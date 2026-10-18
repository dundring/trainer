import { Request, Response } from 'express';
import { ApiResponseBody, ApiStatus, Status } from '@dundring/types';
import crypto from 'crypto';
import * as redis from '../redis';
import { identityService } from '.';

export const generateMailToken = async (mail: string) => {
  const token = crypto.randomUUID();
  redis.setMailToken(token, mail);
  return token;
};

export const getMailTokenData = async (
  token: string
): Promise<Status<string, 'Mail token not found'>> => {
  return redis.getMailToken(token);
};

/**
 * Verifies the identity access token in the Authorization header. Returns the
 * user's id (trainer `User.id` = identity `sub`), or responds 401 and returns null.
 */
export const authenticate = async <Res, Req>(
  req: Request<Req>,
  res: Response<ApiResponseBody<Res>>
): Promise<{ userId: string } | null> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  const reject = (statusMessage: string) => {
    res.statusMessage = statusMessage;
    res.statusCode = 401;
    res.send({ status: ApiStatus.FAILURE, message: statusMessage });
    return null;
  };

  if (!token) return reject('No token provided.');

  try {
    return { userId: await identityService.verifyAccessToken(token) };
  } catch {
    return reject('Could not verify token.');
  }
};
