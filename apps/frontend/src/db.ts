import Dexie, { Table } from 'dexie';
import { Waypoint } from './types';
import { Route, routeNameToWaypoint } from './gps';
import {
  getPowerToSpeedMap,
  millisToHoursMinutesAndSeconds,
} from '@dundring/utils';
import { distanceToCoordinates } from './utils/gps';

export type WorkoutDataPoint = {
  id?: number;
  workoutNumber: number;
  lapNumber: number;
  accumulatedDistance: number;
  timestamp: Date;
  deltaTime: number;
  deltaDistance: number;
  tracking: boolean;
  heartRate?: number;
  power?: number;
  cadence?: number;
  position?: Waypoint;
  speed?: number;
};

export type WorkoutState = {
  workoutNumber: number;
  lapNumber: number;
  elapsedTime: number;
  maxHeartRate: number | null;
  route: Route;
};

export class DundringDexie extends Dexie {
  workoutDataPoint!: Table<WorkoutDataPoint>;
  workoutState!: Table<WorkoutState>;

  constructor() {
    super('dundring');
    this.version(1).stores({
      workoutDataPoint:
        '++id, workoutNumber, lapNumber, timestamp, tracking, heartRate, power, cadence, position, speed, accumulatedDistance, [workoutNumber+lapNumber]',
      workoutState: '++workoutNumber, lapNumber, route',
    });
  }
}

export const db = new DundringDexie();

export const defaultWorkoutState: WorkoutState = {
  workoutNumber: 0,
  lapNumber: 0,
  elapsedTime: 0,
  maxHeartRate: null,
  route: 'zap',
};

export const clearWorkoutData = async () => {
  await db.transaction('rw', db.workoutState, db.workoutDataPoint, async () => {
    const state = await getWorkoutState();
    await db.workoutDataPoint.clear();
    await db.workoutState.clear();

    return db.workoutState.add({
      ...defaultWorkoutState,
      route: state.route,
    });
  });
};

export const addLap = async () => {
  await db.transaction('rw', db.workoutState, async () => {
    const state = await getWorkoutState();

    const lapNumber = state.lapNumber + 1;
    return db.workoutState.update(state.workoutNumber, {
      lapNumber,
    });
  });
};

const getLastDatapoint = async () => {
  const state = await getWorkoutState();

  return (
    db.workoutDataPoint
      .where('workoutNumber')
      .equals(state.workoutNumber)
      .filter((item) => item.tracking)
      .last() ?? null
  );
};

const getWorkoutState = async () => {
  const state = await db.workoutState.orderBy('workoutNumber').last();

  return state ?? defaultWorkoutState;
};

export const addDatapoint = async (
  delta: number,
  data: {
    heartRate: number | null;
    power: number | null;
    cadence: number | null;
  },
  isTracking: boolean
) => {
  const heartRateToInclude = data.heartRate
    ? { heartRate: data.heartRate }
    : {};
  const powerToInclude = data.power ? { power: data.power } : {};
  const cadenceToInclude = data.cadence ? { cadence: data.cadence } : {};
  const dataPoint = {
    timestamp: new Date(),
    ...heartRateToInclude,
    ...powerToInclude,
    ...cadenceToInclude,
  };

  const weight = 80;
  const powerSpeed = getPowerToSpeedMap(weight);
  const speed = dataPoint.power ? powerSpeed(dataPoint.power) : 0;
  const deltaDistance = isTracking ? (speed * delta) / 1000 : 0;

  return await db.transaction(
    'rw',
    db.workoutDataPoint,
    db.workoutState,
    async () => {
      const lastDatapoint = await getLastDatapoint();
      const workoutState = await getWorkoutState();

      const routeWaypoints = routeNameToWaypoint(workoutState.route);

      const accumulatedDistance = lastDatapoint?.accumulatedDistance ?? 0;
      const totalDistance = accumulatedDistance + deltaDistance;

      const coordinates = distanceToCoordinates(routeWaypoints, totalDistance);

      await db.workoutDataPoint.add({
        ...dataPoint,
        timestamp: new Date(),
        deltaTime: delta,
        deltaDistance,
        workoutNumber: workoutState.workoutNumber,
        lapNumber: workoutState.lapNumber,
        tracking: isTracking,
        accumulatedDistance: totalDistance,
        speed,
        position: coordinates
          ? {
              lat: coordinates.lat,
              lon: coordinates.lon,
              deltaDistance,
            }
          : undefined,
      });

      const heartRate = dataPoint.heartRate ?? 0;
      const maxHeartRate = workoutState.maxHeartRate ?? 0;

      if (maxHeartRate < heartRate) {
        await db.workoutState.update(workoutState.workoutNumber, {
          maxHeartRate: heartRate,
        });
      }
    }
  );
};

export const addElapsedTime = async (delta: number) => {
  await db.transaction('rw', db.workoutState, async () => {
    const state = await getWorkoutState();

    return db.workoutState.update(state.workoutNumber, {
      elapsedTime: state.elapsedTime + delta,
    });
  });
};

export const initWorkoutstate = async () => {
  await db.transaction('rw', db.workoutState, async () => {
    const state = await db.workoutState.orderBy('workoutNumber').last();

    if (!state) {
      return db.workoutState.add(defaultWorkoutState);
    }
  });
};

export const setRoute = async (route: Route) => {
  await db.transaction('rw', db.workoutState, async () => {
    const state = await getWorkoutState();

    return db.workoutState.update(state.workoutNumber, {
      route,
    });
  });
};

const hoursToRecoverWorkout = 12;
export const clearWorkoutDataIfOldDataExists = async () => {
  return await db.transaction(
    'rw',
    db.workoutDataPoint,
    db.workoutState,
    async () => {
      const lastTrackedDatapoint = await getLastDatapoint();

      if (lastTrackedDatapoint) {
        const time = millisToHoursMinutesAndSeconds(
          Date.now() - lastTrackedDatapoint.timestamp.getTime()
        );

        if (time.hours >= hoursToRecoverWorkout) {
          return clearWorkoutData();
        }
      }
    }
  );
};
