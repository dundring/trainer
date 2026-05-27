import { useToast } from '@chakra-ui/toast';
import * as React from 'react';
import { useLogs } from '../context/LogContext';

export interface SmartTrainerInterface {
  requestPermission: () => void;
  power: number | null;
  cadence: number | null;
  speed: number | null;
  isConnected: boolean;
  status: 'not_connected' | 'connecting' | 'connected' | 'error';
  disconnect: () => void;
  setResistance: (resistance: number) => void;
  currentResistance: number;
}

interface SetFitnessMachineCharacteristicsAction {
  type: 'set_fitness_machine_characteristics';
  device: BluetoothDevice;
  fitnessMachineControlPointCharacteristic: BluetoothRemoteGATTCharacteristic;
  indoorBikeDataCharacteristic: BluetoothRemoteGATTCharacteristic;
}

interface SetCyclingPowerCharacteristicsAction {
  type: 'set_cycling_power_characteristics';
  device: BluetoothDevice;
  cyclingPowerMeasurementCharacteristic: BluetoothRemoteGATTCharacteristic;
}

interface SetConnectingAction {
  type: 'set_connecting';
}

interface SetErrorAction {
  type: 'set_error';
  errorMessage: string;
}

interface ResetAction {
  type: 'reset';
}
type Action =
  | SetFitnessMachineCharacteristicsAction
  | SetCyclingPowerCharacteristicsAction
  | SetConnectingAction
  | SetErrorAction
  | ResetAction;

interface FitnessMachineService {
  type: 'fitness_machine';
  fitnessMachineControlPointCharacteristic: BluetoothRemoteGATTCharacteristic;
  indoorBikeDataCharacteristic: BluetoothRemoteGATTCharacteristic;
}
interface CyclingPowerService {
  type: 'cycling_power';
  cyclingPowerMeasurementCharacteristic: BluetoothRemoteGATTCharacteristic;
}

type Service = FitnessMachineService | CyclingPowerService;

type SmartTrainer =
  | { status: 'not_connected' }
  | { status: 'connecting' }
  | { status: 'error'; errorMessage: string }
  | { status: 'connected'; device: BluetoothDevice; service: Service };

interface SmartTrainerData {
  power: number | null;
  cadence: number | null;
  speed: number | null;
}
/* Information about the Bluetooth services: https://www.bluetooth.com/specifications/specs/fitness-machine-service-1-0/ */
export const useSmartTrainerInterface = (): SmartTrainerInterface => {
  const [data, setData] = React.useState<SmartTrainerData>({
    power: null,
    cadence: null,
    speed: null,
  });
  const { logEvent } = useLogs();
  const [currentResistance, setCurrentResistance] = React.useState(0);
  const toast = useToast();

  const [smartTrainer, dispatch] = React.useReducer(
    (_current: SmartTrainer, action: Action): SmartTrainer => {
      switch (action.type) {
        case 'reset': {
          return { status: 'not_connected' };
        }
        case 'set_connecting': {
          return { status: 'connecting' };
        }
        case 'set_error': {
          return { status: 'error', errorMessage: action.errorMessage };
        }
        case 'set_cycling_power_characteristics': {
          return {
            status: 'connected',
            device: action.device,
            service: {
              type: 'cycling_power',
              cyclingPowerMeasurementCharacteristic:
                action.cyclingPowerMeasurementCharacteristic,
            },
          };
        }
        case 'set_fitness_machine_characteristics': {
          return {
            status: 'connected',
            device: action.device,
            service: {
              type: 'fitness_machine',
              fitnessMachineControlPointCharacteristic:
                action.fitnessMachineControlPointCharacteristic,
              indoorBikeDataCharacteristic: action.indoorBikeDataCharacteristic,
            },
          };
        }
      }
    },
    { status: 'not_connected' }
  );

  const handleCyclingPowerUpdate = (event: any) => {
    const data = event.target.value as DataView;

    const power = data.getUint8(2) + (data.getUint8(3) << 8);
    setData({ power, cadence: null, speed: null });
  };
  const handleIndoorBikeDataUpdate = (event: any) => {
    const data = event.target.value as DataView;

    /* NB: speed is only based on the rotation of the smart trainer's resistance unit, meaning that it is easier to get a higher speed
     *  when using less resistance. If we really want to use speed, we should do a do some trickery using the power, either calculating
     *  the speed solely on power or some hybrid using the smart trainer speed weighted with the power. I think 100% power based speed
     *  would be best. */
    const speed = (data.getUint8(2) + (data.getUint8(3) << 8)) / 100;
    const cadence = (data.getUint8(4) + (data.getUint8(5) << 8)) / 2;
    const power = data.getUint8(6) + (data.getUint8(7) << 8);
    setData({ power, cadence, speed });
  };

  const onDisconnected = React.useCallback(() => {
    toast({
      title: 'Trainer Disconnected!',
      isClosable: true,
      duration: 2000,
      status: 'warning',
    });
    setCurrentResistance(0);
    dispatch({
      type: 'set_error',
      errorMessage: 'Disconnected',
    });
    logEvent('heart rate monitor auto-disconnected');
  }, []);

  const requestPermission = async () => {
    dispatch({ type: 'set_connecting' });

    const device = await navigator.bluetooth
      .requestDevice({
        filters: [{ services: ['cycling_power'] }],
        optionalServices: ['fitness_machine'],
      })
      .catch((_e) => {
        dispatch({ type: 'reset' });
        return null;
      });

    if (!device) return;

    const server = await device.gatt?.connect();
    try {
      const fitnessMachineService =
        await server?.getPrimaryService('fitness_machine');

      if (!fitnessMachineService) {
        return dispatch({
          type: 'set_error',
          errorMessage: 'Could not connect to fitness machine service.',
        });
      }
      const fitnessMachineControlPointCharacteristic =
        await fitnessMachineService?.getCharacteristic(
          'fitness_machine_control_point'
        );

      if (!fitnessMachineControlPointCharacteristic) {
        return dispatch({
          type: 'set_error',
          errorMessage:
            'Could not connect to fitness machine control point characteristic.',
        });
      }

      await fitnessMachineControlPointCharacteristic?.writeValue(
        new Uint8Array([0x01])
      );

      const indoorBikeDataCharacteristic =
        await fitnessMachineService?.getCharacteristic('indoor_bike_data');

      if (!indoorBikeDataCharacteristic) {
        return dispatch({
          type: 'set_error',
          errorMessage: 'Could not connect to indoor bike data characteristic.',
        });
      }

      await indoorBikeDataCharacteristic?.startNotifications();
      indoorBikeDataCharacteristic?.addEventListener(
        'characteristicvaluechanged',
        handleIndoorBikeDataUpdate
      );

      dispatch({
        type: 'set_fitness_machine_characteristics',
        device,
        indoorBikeDataCharacteristic,
        fitnessMachineControlPointCharacteristic,
      });

      device.removeEventListener('gattserverdisconnected', onDisconnected);
      device.addEventListener('gattserverdisconnected', onDisconnected);
    } catch (e) {
      logEvent(
        'Could not connect to device as Fitness Machine. Trying to connect to cycling power.'
      );
      const cyclingPowerService =
        await server?.getPrimaryService('cycling_power');
      if (!cyclingPowerService) {
        return dispatch({
          type: 'set_error',
          errorMessage: 'Could not connect to cycling power service.',
        });
      }

      const cyclingPowerMeasurementCharacteristic =
        await cyclingPowerService.getCharacteristic(
          'cycling_power_measurement'
        );

      if (!cyclingPowerMeasurementCharacteristic) {
        return dispatch({
          type: 'set_error',
          errorMessage:
            'Could not connect to cycling power measurement characteristic.',
        });
      }

      await cyclingPowerMeasurementCharacteristic?.startNotifications();
      cyclingPowerMeasurementCharacteristic?.addEventListener(
        'characteristicvaluechanged',
        handleCyclingPowerUpdate
      );

      dispatch({
        type: 'set_cycling_power_characteristics',
        device,
        cyclingPowerMeasurementCharacteristic,
      });

      toast({
        title:
          'Could not connect to your smart trainer as a fitness machine. ' +
          'This means that Dundring will only be able to read the power ' +
          'data, but not set resistance. If you have a smart trainer ' +
          'that should be capable of this, please ensure that you have ' +
          'the latest firmware update, and try again. If that does not ' +
          'work, please contact us at our Slack workspace.',
        isClosable: true,
        duration: 20000,
        status: 'warning',
      });
    }
    logEvent('smart trainer connected');
  };

  const disconnect = async () => {
    if (smartTrainer.status === 'connected') {
      switch (smartTrainer.service.type) {
        case 'fitness_machine': {
          await smartTrainer.service.indoorBikeDataCharacteristic.stopNotifications();
          smartTrainer.service.indoorBikeDataCharacteristic.removeEventListener(
            'characteristicvaluechanged',
            handleIndoorBikeDataUpdate
          );
          break;
        }
        case 'cycling_power': {
          await smartTrainer.service.cyclingPowerMeasurementCharacteristic.stopNotifications();
          smartTrainer.service.cyclingPowerMeasurementCharacteristic.removeEventListener(
            'characteristicvaluechanged',
            handleCyclingPowerUpdate
          );
          break;
        }
      }
      smartTrainer.device.gatt?.disconnect();
      dispatch({ type: 'reset' });
    }

    logEvent('smart trainer disconnected');
  };

  const isConnected = smartTrainer.status === 'connected';
  return {
    requestPermission,
    disconnect,
    status: smartTrainer.status,
    isConnected,
    power: isConnected ? data.power : null,
    cadence: isConnected ? data.cadence : null,
    speed: isConnected ? data.speed : null,
    currentResistance,
    setResistance: React.useCallback(
      async (resistance: number) => {
        if (!isConnected) {
          logEvent(
            'tried to set resistance, but no smart trainer is connected'
          );
          return;
        }
        if (smartTrainer.service.type === 'fitness_machine') {
          try {
            const fitnessMachineControlPointCharacteristic =
              smartTrainer.service.fitnessMachineControlPointCharacteristic;
            if (fitnessMachineControlPointCharacteristic) {
              if (!resistance) {
                await fitnessMachineControlPointCharacteristic.writeValue(
                  new Uint8Array([OP_CODES.RESET])
                );

                const windSpeedAndGrade = Int16Array.of(1, 1);
                const rollingAndWindResistance = Uint8Array.of(1, 1);

                const totalLength =
                  windSpeedAndGrade.byteLength +
                  rollingAndWindResistance.byteLength +
                  1;
                const combinedBuffer = new ArrayBuffer(totalLength);
                const combinedView = new DataView(combinedBuffer);

                combinedView.setUint8(0, OP_CODES.SET_INDOOR_SIMULATION);
                // wind speed
                combinedView.setInt16(1, 0, true);
                // grade
                combinedView.setInt16(3, 0, true);
                // rolling resistance, resolution 0.001
                combinedView.setUint8(5, 255);
                // wind resistance
                combinedView.setUint8(6, 255);

                await fitnessMachineControlPointCharacteristic.writeValue(
                  new Uint8Array(combinedBuffer)
                );
                logEvent(`set resistance: Free mode`);
                setCurrentResistance(0);
              } else {
                const resBuf = new Uint8Array(
                  new Uint16Array([resistance]).buffer
                );
                const cmdBuf = new Uint8Array([OP_CODES.SET_POWER_TARGET]);
                const combined = new Uint8Array(cmdBuf.length + resBuf.length);
                combined.set(cmdBuf);
                combined.set(resBuf, cmdBuf.length);
                await fitnessMachineControlPointCharacteristic.writeValue(
                  combined
                );
                logEvent(`set resistance: ${resistance}W`);
                setCurrentResistance(resistance);
              }
            }
          } catch (error) {
            if (error) {
              console.error(`Tried setting resistance, but got error:`, error);
              logEvent(`failed to set resistance: ${resistance}W`);
            }
          }
        }
      },
      [isConnected, logEvent, smartTrainer]
    ),
  };
};

const OP_CODES = {
  RESET: 0x00,
  SET_POWER_TARGET: 0x05,
  SET_INDOOR_SIMULATION: 0x11,
};
