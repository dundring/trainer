import { getEnv, identityClientId } from './utils/environment';

// Sign-in through identity (id.dundring.com) with OAuth 2.0 authorization code
// + PKCE. The access token lives in memory; the refresh token in localStorage,
// so a new tab or a reload stays signed in like before.

export const callbackPath = '/auth/callback';
const refreshTokenKey = 'identity_refresh_token';

let accessToken: { value: string; expiresAt: number } | null = null;

const readRefreshToken = () => {
  try {
    return localStorage.getItem(refreshTokenKey);
  } catch {
    return null;
  }
};

export const hasSession = () => !!readRefreshToken();

const base64UrlEncode = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...Array.from(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const randomString = (byteLength: number) =>
  base64UrlEncode(crypto.getRandomValues(new Uint8Array(byteLength)));

const codeChallenge = async (verifier: string) =>
  base64UrlEncode(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
    )
  );

const redirectUri = () => `${location.origin}${callbackPath}`;

/** Redirects to identity to sign in; comes back to `returnTo` (a path). */
export const login = async (
  returnTo = `${location.pathname}${location.search}`
) => {
  const { identityUrl, identityAudience } = getEnv();
  const verifier = randomString(32);
  const state = randomString(16);
  sessionStorage.setItem('pkce_verifier', verifier);
  sessionStorage.setItem('oauth_state', state);
  sessionStorage.setItem('auth_return_to', returnTo);

  const url = new URL(`${identityUrl}/authorize`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', identityClientId);
  url.searchParams.set('redirect_uri', redirectUri());
  url.searchParams.set('code_challenge', await codeChallenge(verifier));
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', state);
  url.searchParams.set('audience', identityAudience);
  location.assign(url.toString());
};

const storeTokens = (tokens: {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}) => {
  accessToken = {
    value: tokens.access_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
  };
  localStorage.setItem(refreshTokenKey, tokens.refresh_token);
};

const requestTokens = (params: Record<string, string>) =>
  fetch(`${getEnv().identityUrl}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ...params, client_id: identityClientId }),
  });

// Keyed by code: React's StrictMode runs effects twice, and a code works once.
const callbacks = new Map<string, Promise<string | null>>();

/** Finishes a sign-in at the callback path. Returns the path to go back to, or null if it failed. */
export const handleCallback = (): Promise<string | null> => {
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  if (!code) return Promise.resolve(null);

  if (!callbacks.has(code)) {
    callbacks.set(
      code,
      (async () => {
        const verifier = sessionStorage.getItem('pkce_verifier');
        const state = sessionStorage.getItem('oauth_state');
        const returnTo = sessionStorage.getItem('auth_return_to') || '/';
        sessionStorage.removeItem('pkce_verifier');
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('auth_return_to');
        if (!verifier || params.get('state') !== state) return null;

        const response = await requestTokens({
          grant_type: 'authorization_code',
          code,
          code_verifier: verifier,
          redirect_uri: redirectUri(),
        });
        if (!response.ok) return null;
        storeTokens(await response.json());
        return returnTo;
      })()
    );
  }
  return callbacks.get(code)!;
};

let refreshing: Promise<string | null> | null = null;

// One refresh at a time, also across tabs: identity rotates refresh tokens and
// treats a reused one as stolen, which would sign every tab out.
const refresh = () => {
  refreshing ??= withLock(async () => {
    // Read inside the lock: another tab may have just rotated it.
    const refreshToken = readRefreshToken();
    if (!refreshToken) return null;

    const response = await requestTokens({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });
    if (!response.ok) {
      // Expired, revoked (signed out at identity) or reused: sign out here too.
      if (response.status === 400 || response.status === 401) logout();
      return null;
    }
    storeTokens(await response.json());
    return accessToken!.value;
  }).finally(() => {
    refreshing = null;
  });
  return refreshing;
};

const withLock = async <T>(f: () => Promise<T>): Promise<T> =>
  navigator.locks ? await navigator.locks.request('identity-refresh', f) : f();

/** A valid access token (refreshed when about to expire), or null when signed out. */
export const getAccessToken = async (): Promise<string | null> => {
  if (accessToken && accessToken.expiresAt > Date.now() + 60_000) {
    return accessToken.value;
  }
  return refresh().catch(() => null);
};

/** Signs out of the trainer. The identity session stays, so signing in again is quick. */
export const logout = () => {
  accessToken = null;
  localStorage.removeItem(refreshTokenKey);
};

/** Not a page: marks a sign-in whose callback continues to identity's connect page. */
export const connectStravaPath = '/auth/connect-strava';
/** Where identity's connect page returns to. */
export const connectedPath = '/auth/connected';

/**
 * Connects Strava at identity, then comes back to `returnTo`. Signs in first:
 * identity's connect page needs its own session, which can expire long before
 * the trainer's refresh token does (instant while it's still there).
 */
export const connectStrava = (
  returnTo = `${location.pathname}${location.search}`
) => login(`${connectStravaPath}?return_to=${encodeURIComponent(returnTo)}`);

/** Identity's connect page, which returns to `connectedPath`. */
export const connectStravaUrl = (returnTo: string) => {
  const url = new URL(`${getEnv().identityUrl}/connect/strava`);
  url.searchParams.set('client_id', identityClientId);
  url.searchParams.set(
    'redirect_uri',
    `${location.origin}${connectedPath}?return_to=${encodeURIComponent(returnTo)}`
  );
  return url.toString();
};
