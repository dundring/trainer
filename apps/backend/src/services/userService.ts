require('dotenv').config();
import * as db from '../db';
import { isError, isSuccess } from '@dundring/utils';
import { monitoringService } from '.';

export const getUser = async (query: { username: string } | { id: string }) =>
  db.getUser(query);

export const updateUser = async (
  userId: string,
  data: { username?: string; ftp?: number }
) => {
  const ret = await db.updateUser(userId, data);
  if (isSuccess(ret)) {
    monitoringService.log(
      `User *${ret.data.id}* updated profile ${
        data.username ? `username=*${data.username}* ` : ''
      }${data.ftp ? `ftp=*${data.ftp}*` : ''}`
    );
  }
  return ret;
};

export const getUserWorkoutsByUserId = async (userId: string) =>
  db.getUserWorkouts(userId);

export const updateUserFtp = async (userId: string, ftp: number) =>
  db.upsertFitnessData(userId, { ftp });

export const getUserFitnessData = async (userId: string) =>
  db.getFitnessData(userId);

/** The trainer user for an identity user, created on their first sign-in. */
export const getOrCreateUser = async (id: string) => {
  const existing = await db.getUser({ id });
  if (isError(existing) && existing.type === 'User not found') {
    const created = await db.createUserWithRandomUsername(id);
    if (isSuccess(created)) {
      monitoringService.log(`New user: *${id}*`);
    }
    // Read it back either way: a parallel request may have created it.
    return db.getUser({ id });
  }
  return existing;
};
