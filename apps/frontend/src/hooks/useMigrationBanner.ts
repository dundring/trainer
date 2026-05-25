import { useState } from 'react';

const KEY = 'migrationBannerDismissed';

export const useMigrationBannerDismissed = () => {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(KEY) === '1'
  );

  const dismiss = () => {
    localStorage.setItem(KEY, '1');
    setDismissed(true);
  };

  return { dismissed, dismiss };
};
