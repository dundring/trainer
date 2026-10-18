import { Status } from '@dundring/types';
import { error, success } from '@dundring/utils';
import * as jose from 'jose';
import fetch from 'node-fetch';
import { logger } from '../logger';

require('dotenv').config();

// Users sign in at identity (id.dundring.com); trainer verifies the access
// tokens it issues and gets Strava tokens from its vault. A trainer User's id is
// the identity user's id (the token's `sub`).
const identityUrl = process.env.IDENTITY_URL || 'https://id-dev.dundring.com';
const audience =
  process.env.IDENTITY_AUDIENCE || 'trainer-dev.dundring.com/api';
const clientId = process.env.IDENTITY_CLIENT_ID || 'trainer';
const clientSecret = process.env.IDENTITY_CLIENT_SECRET || '';

const jwks = jose.createRemoteJWKSet(new URL(`${identityUrl}/jwks`));

export const checkIdentityConfig = () => {
  if (!process.env.IDENTITY_URL) {
    console.log(
      `[.env]: No identity URL provided; using ${identityUrl}. Override this by setting the IDENTITY_URL in the environment config.`
    );
  }
  if (!process.env.IDENTITY_AUDIENCE) {
    console.log(
      `[.env]: No identity audience provided; using ${audience}. Override this by setting the IDENTITY_AUDIENCE in the environment config.`
    );
  }
  if (!process.env.IDENTITY_CLIENT_SECRET) {
    console.log(
      '[.env]: No identity client secret provided; uploading to Strava will not work. Override this by setting the IDENTITY_CLIENT_SECRET in the environment config.'
    );
  }
};

/** Returns the identity user id (`sub`) of a valid access token for this API. */
export const verifyAccessToken = async (token: string): Promise<string> => {
  const { payload } = await jose.jwtVerify(token, jwks, {
    issuer: identityUrl,
    audience,
  });
  if (!payload.sub) throw new Error('Missing sub claim');
  return payload.sub;
};

let clientToken: { value: string; expiresAt: number } | null = null;

const getClientToken = async (): Promise<string | null> => {
  if (clientToken && clientToken.expiresAt > Date.now() + 60_000) {
    return clientToken.value;
  }
  const response = await fetch(`${identityUrl}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });
  if (!response.ok) {
    logger.error(`[identity]: client_credentials failed: ${response.status}`);
    return null;
  }
  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };
  clientToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return clientToken.value;
};

export const getStravaAccessToken = async (
  userId: string
): Promise<
  Status<
    string,
    | 'Strava not connected'
    | 'Strava needs to be reconnected'
    | 'Could not get Strava token'
  >
> => {
  try {
    const token = await getClientToken();
    if (!token) return error('Could not get Strava token');

    const url = new URL(`${identityUrl}/api/tokens/strava`);
    url.searchParams.set('user_id', userId);
    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    // 404: the user never connected Strava. 409: Strava rejected the stored
    // refresh token (e.g. access revoked in Strava's settings).
    if (response.status === 404) return error('Strava not connected');
    if (response.status === 409) return error('Strava needs to be reconnected');
    if (!response.ok) {
      logger.error(
        `[identity]: Strava token for ${userId}: ${response.status}`
      );
      return error('Could not get Strava token');
    }

    const data = (await response.json()) as { access_token: string };
    return success(data.access_token);
  } catch (e) {
    logger.error('[identity]: Strava token request failed', e);
    return error('Could not get Strava token');
  }
};
