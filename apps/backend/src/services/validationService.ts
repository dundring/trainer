import { Request, Response } from 'express';
import { ApiResponseBody, ApiStatus, Status } from '@dundring/types';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import * as redis from '../redis';
import { identityService } from '.';

const tokenSecret = process.env.TOKEN_SECRET || '12345';

export const hash = (message: string) => {
  return crypto.createHash('md5').update(message).digest('hex');
};

export const generateAccessToken = (user: UserPayload) => {
  return jwt.sign(user, tokenSecret, {
    expiresIn: '120d',
  });
};

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

export type AuthenticatedRequest<T> = {
  username: string;
  userId: string;
  jwtPayload: JwtExpPayload;
} & Request<T>;

interface UnauthenticatedRequest<T> extends Request<T> {
  username?: string;
  userId?: string;
  jwtPayload?: JwtExpPayload;
}

interface UserPayload {
  username: string;
  userId: string;
}
interface JwtExpPayload {
  expiresIn: string;
  exp: number;
}
export const authenticateToken = <Res, Req>(
  req: UnauthenticatedRequest<Req>,
  res: Response<ApiResponseBody<Res>>
): req is AuthenticatedRequest<Req> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      const statusMessage = 'No token provided.';
      res.statusMessage = statusMessage;
      res.statusCode = 401;
      res.send({
        status: ApiStatus.FAILURE,
        message: statusMessage,
      });
      return false;
    }

    const jwtPayload = jwt.decode(token) as JwtExpPayload;

    req.jwtPayload = jwtPayload;

    const user = jwt.verify(token, tokenSecret) as UserPayload;

    req.username = user.username;
    req.userId = user.userId;

    return true;
  } catch (error) {
    const statusMessage = 'Could not verify token.';
    res.statusMessage = statusMessage;
    res.statusCode = 401;
    res.send({
      status: ApiStatus.FAILURE,
      message: statusMessage,
    });
    return false;
  }
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
