import * as React from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

type ReadWriteOptions = Options<{ value: boolean; set: (b: boolean) => void }>;

type ReadOnlyOptions = Options<boolean>;

type Options<T> = {
  showIntervalTimer: T;
  showTotalDurationTimer: T;
  showSpeed: T;
  showDistance: T;
  showHeartRateCurrent: T;
  showHeartRateMax: T;
  showPowerCurrent: T;
  showPowerTarget: T;
};

const OptionsContext = React.createContext<ReadWriteOptions | null>(null);

const useOptionSetting = (key: string, initialValue: boolean) => {
  const [value, setValue] = useLocalStorage<boolean>(key, initialValue);

  return { value, set: setValue };
};

export const OptionsContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const showIntervalTimer = useOptionSetting('showIntervalTimer', true);

  const showTotalDurationTimer = useOptionSetting(
    'showTotalDurationTimer',
    true
  );

  const showSpeed = useOptionSetting('showSpeed', true);

  const showDistance = useOptionSetting('showDistance', true);

  const showHeartRateCurrent = useOptionSetting('showDistance', true);

  const showHeartRateMax = useOptionSetting('showDistance', true);

  const showPowerTarget = useOptionSetting('showDistance', true);

  const showPowerCurrent = useOptionSetting('showDistance', true);

  return (
    <OptionsContext.Provider
      value={{
        showIntervalTimer,
        showTotalDurationTimer,
        showSpeed,
        showDistance,
        showHeartRateCurrent,
        showHeartRateMax,
        showPowerTarget,
        showPowerCurrent,
      }}
    >
      {children}
    </OptionsContext.Provider>
  );
};

export const useReadWriteOptions: () => ReadWriteOptions = () => {
  const context = React.useContext(OptionsContext);
  if (context === null) {
    throw new Error(
      'useReadWriteOptions must be used within a OptionsContextProvider'
    );
  }
  return context;
};

export const useReadOnlyOptions: () => ReadOnlyOptions = () => {
  const context = React.useContext(OptionsContext);
  if (context === null) {
    throw new Error(
      'useReadOnlyOptions must be used within a OptionsContextProvider'
    );
  }
  const result = {} as ReadOnlyOptions;

  Object.entries(context).forEach(
    ([k, v]) => (result[k as keyof ReadOnlyOptions] = v.value)
  );

  return result;
};
