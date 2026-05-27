import * as React from 'react';
import { DataPoint } from '../types';
import { useActiveWorkout } from './ActiveWorkoutContext';
import { useHeartRateMonitor } from './HeartRateContext';
import { useLogs } from './LogContext';
import { useSmartTrainer } from './SmartTrainerContext';
import { useWebsocket } from './WebsocketContext';
import * as db from '../db';
import { WorkoutDataPoint } from '../db';
import { useWorkoutState } from '../hooks/useWorkoutState';
import { useLiveRef } from '../hooks/useLiveRef';

type TrainerState = 'not_started' | 'running' | 'paused';

const DataContext = React.createContext<{
  graphData: DataPoint[];
  trackedData: DataPoint[];
  hasValidData: boolean;
  timeElapsed: number;
  distance: number;
  maxHeartRate: number | null;
  speed: number;
  start: () => void;
  stop: () => void;
  addLap: () => void;
  state: TrainerState;
  isRunning: boolean;
  smoothedPower: number;
} | null>(null);

interface Props {
  clockWorker: Worker;
  children: React.ReactNode;
}

export const DataContextProvider = ({ clockWorker, children }: Props) => {
  const {
    syncResistance,
    start: startActiveWorkout,
    increaseElapsedTime: increaseActiveWorkoutElapsedTime,
  } = useActiveWorkout();

  const { sendData } = useWebsocket();
  const {
    state: workoutState,
    trackedData,
    graphData,
    lastDatapoint,
  } = useWorkoutState();
  const [state, setState] = React.useState<TrainerState>('not_started');
  const isRunning = state === 'running';

  const { logEvent } = useLogs();
  const {
    isConnected: smartTrainerIsConnected,
    setResistance,
    power,
    cadence,
  } = useSmartTrainer();

  const { heartRate } = useHeartRateMonitor();

  const hasValidData = trackedData.length > 0;

  const accumulatedTimeRef = React.useRef(0);
  const pausedTimeRef = React.useRef(0);
  const lastElapsedRef = React.useRef(0);
  const powerRef = useLiveRef(power);
  const heartRateRef = useLiveRef(heartRate);
  const cadenceRef = useLiveRef(cadence);

  const dataTick = React.useCallback(
    async (delta: number) => {
      try {
        const timeToFlush = accumulatedTimeRef.current;
        accumulatedTimeRef.current = 0;
        if (timeToFlush > 0) {
          await db.addElapsedTime(timeToFlush);
        }

        const currentHeartRate = heartRateRef.current;
        const currentPower = powerRef.current;
        const currentCadence = cadenceRef.current;

        const heartRateToInclude = currentHeartRate
          ? { heartRate: currentHeartRate }
          : {};
        const powerToInclude = currentPower ? { power: currentPower } : {};
        const cadenceToInclude = currentCadence
          ? { cadence: currentCadence }
          : {};
        const dataPoint = {
          timestamp: new Date(),
          ...heartRateToInclude,
          ...powerToInclude,
          ...cadenceToInclude,
        };

        if (dataPoint.cadence || dataPoint.power || dataPoint.heartRate) {
          const data = {
            heartRate: currentHeartRate,
            power: currentPower,
            cadence: currentCadence,
          };
          await db.addDatapoint(delta, data, isRunning);
          sendData(dataPoint);
        }
      } catch (error) {
        console.error('Failed to process dataTick:', error);
      }
    },
    [isRunning, sendData]
  );

  const clockTick = React.useCallback(
    (elapsed: number) => {
      // Calculate total elapsed time: paused time + current session elapsed
      const totalElapsed = pausedTimeRef.current + elapsed;

      // Calculate delta from last update
      const delta = totalElapsed - lastElapsedRef.current;
      lastElapsedRef.current = totalElapsed;

      // Only accumulate and update if there's a meaningful delta
      if (delta > 0) {
        accumulatedTimeRef.current += delta;
        increaseActiveWorkoutElapsedTime(delta);
      }
    },
    [increaseActiveWorkoutElapsedTime]
  );

  React.useEffect(() => {
    if (clockWorker === null) return;

    clockWorker.onmessage = async ({
      data,
    }: MessageEvent<{ type: string; delta?: number; elapsed?: number }>) => {
      if (!data) return;
      switch (data.type) {
        case 'clockTick': {
          if (data.elapsed !== undefined) {
            clockTick(data.elapsed);
          }
          break;
        }
        case 'dataTick': {
          if (data.delta !== undefined) {
            await dataTick(data.delta);
          }
        }
      }
    };
    clockWorker.onerror = (e) => console.error('Clock worker error:', e);

    return () => {
      clockWorker.onerror = null;
      clockWorker.onmessage = null;
    };
  }, [clockTick, dataTick]);

  const start = React.useCallback(async () => {
    if (trackedData.length > 0) {
      logEvent('workout started');
    } else {
      logEvent('workout resumed');
      syncResistance();
    }

    // Initialize refs from current elapsed time when resuming a previous session
    if (state === 'not_started' && workoutState.elapsedTime > 0) {
      pausedTimeRef.current = workoutState.elapsedTime;
      lastElapsedRef.current = workoutState.elapsedTime;
    }

    startActiveWorkout();
    clockWorker.postMessage('startClockTimer');
    setState('running');
  }, [
    clockWorker,
    logEvent,
    syncResistance,
    startActiveWorkout,
    trackedData.length,
    state,
    workoutState.elapsedTime,
  ]);

  const stop = React.useCallback(async () => {
    logEvent('workout paused');
    setState('paused');
    if (smartTrainerIsConnected) {
      setResistance(0);
    }

    clockWorker.postMessage('stopClockTimer');

    const timeToFlush = accumulatedTimeRef.current;
    accumulatedTimeRef.current = 0;
    if (timeToFlush > 0) {
      try {
        await db.addElapsedTime(timeToFlush);
      } catch (error) {
        console.error('Failed to flush elapsed time on stop:', error);
      }
    }

    // Store the current elapsed time as paused time for when we resume
    pausedTimeRef.current = workoutState.elapsedTime;
    lastElapsedRef.current = workoutState.elapsedTime;
  }, [
    clockWorker,
    smartTrainerIsConnected,
    setResistance,
    logEvent,
    workoutState.elapsedTime,
  ]);

  return (
    <DataContext.Provider
      value={{
        graphData,
        trackedData,
        hasValidData,
        timeElapsed: workoutState.elapsedTime,
        distance: lastDatapoint?.accumulatedDistance ?? 0,
        speed: lastDatapoint?.speed ?? 0,
        start,
        stop,
        addLap: async () => {
          await db.addLap();
        },
        state,
        isRunning,
        smoothedPower: getSmoothedPower(graphData),
        maxHeartRate: workoutState.maxHeartRate || null,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = React.useContext(DataContext);
  if (context === null) {
    throw new Error('useData must be used within a DataContextProvider');
  }
  return context;
};

const getSmoothedPower = (datapoints: WorkoutDataPoint[]) => {
  const point1 = datapoints.at(-1)?.power || 0;
  const point2 = datapoints.at(-2)?.power || 0;
  const point3 = datapoints.at(-3)?.power || 0;

  const sum = point1 + point2 + point3;
  const len = Math.sign(point1) + Math.sign(point2) + Math.sign(point3);
  if (len === 0) {
    return 0;
  }
  return Math.round(sum / len);
};
