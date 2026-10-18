interface Environment {
  dundringHttpServerUrl: string;
  dundringWsServerUrl: string;
  /** Where users sign in (identity), and the audience of this API's access tokens. */
  identityUrl: string;
  identityAudience: string;
}

const identity = {
  dev: {
    identityUrl: 'https://id-dev.dundring.com',
    identityAudience: 'trainer-dev.dundring.com/api',
  },
  prod: {
    identityUrl: 'https://id.dundring.com',
    identityAudience: 'trainer.dundring.com/api',
  },
};

export const identityClientId = 'trainer';

export const getEnv = (): Environment => {
  const envOverride = import.meta.env.VITE_ENV_OVERRIDE || null;

  switch (envOverride) {
    case 'test':
      return {
        dundringHttpServerUrl: 'https://test.dundring.com/api',
        dundringWsServerUrl: 'wss://test.dundring.com/api',
        ...identity.dev,
      };
    case 'prod':
      return {
        dundringHttpServerUrl: 'https://dundring.com/api',
        dundringWsServerUrl: 'wss://dundring.com/api',
        ...identity.prod,
      };
    default:
      if (isSecureConnection()) {
        return {
          dundringHttpServerUrl: `https://${location.hostname}/api`,
          dundringWsServerUrl: `wss://${location.hostname}/api`,
          ...(location.hostname === 'trainer.dundring.com'
            ? identity.prod
            : identity.dev),
        };
      }

      const hostname = import.meta.env.VITE_HOST_OVERRIDE || 'localhost:8080';
      return {
        dundringHttpServerUrl: `http://${hostname}/api`,
        dundringWsServerUrl: `ws://${hostname}/api`,
        // Local trainer signs in at dev identity (localhost:5173 is a registered
        // redirect URI there), unless pointed at a local identity.
        identityUrl:
          import.meta.env.VITE_IDENTITY_URL || identity.dev.identityUrl,
        identityAudience:
          import.meta.env.VITE_IDENTITY_AUDIENCE ||
          identity.dev.identityAudience,
      };
  }
};

const isSecureConnection = () => location.protocol === 'https:';
