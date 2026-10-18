import { Member, Room, Status, WebSocketResponse } from '@dundring/types';
import { error, isSuccess, success } from '@dundring/utils';
import { createClient } from 'redis';
import * as websocket from './websocket';
import { logger } from './logger';

require('dotenv').config();

const roomChannelPrefix = 'room';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redisClient = createClient({
  url: redisUrl,
});
const redisPublisher = redisClient.duplicate();
const redisSubscriber = redisClient.duplicate();
redisClient.on('error', (err) => logger.error('Redis Client Error', err));

export const initRedis = async () => {
  logger.info('Connect redis client');
  await Promise.all([
    redisClient.connect(),
    redisPublisher.connect(),
    redisSubscriber.connect(),
  ]);

  await redisSubscriber.pSubscribe(`${roomChannelPrefix}:*`, handleRoomMessage);
};

const handleRoomMessage = (rawMessage: string, channelName: string) => {
  const message: WebSocketResponse = JSON.parse(rawMessage);
  const roomId = channelName.split(':')[1];

  websocket.sendMessageToRoom(roomId, message);
};

export const createRoom = async (roomId: string, user: Member) => {
  logger.info(
    `[redis]: Create room with id=${roomId} for user=${user.username}`
  );
  await Promise.all([
    redisClient.rPush(toRoomKey(roomId), user.username),
    redisClient.set(toUserKey(user.username), roomId),
  ]);
};

export const joinRoom = async (
  roomId: string,
  user: Member
): Promise<Status<Room, 'Room not found'>> => {
  logger.info(`[redis]: Add user=${user.username} to room with id=${roomId}`);
  const roomKey = toRoomKey(roomId);
  // TODO: Make atomic/transaction
  const usersInRoom = await redisClient.lLen(roomKey);
  if (usersInRoom === 0) return error('Room not found');

  await Promise.all([
    redisClient.rPush(roomKey, user.username),
    redisClient.set(toUserKey(user.username), roomId),
  ]);

  const membersStatus = await getRoomMembers(roomId);
  if (isSuccess(membersStatus)) {
    return success({ id: roomId, members: membersStatus.data });
  }

  return membersStatus;
};

export const leaveRoom = async (
  username: string,
  roomId: string
): Promise<Status<number, 'Room not found'>> => {
  const roomKey = toRoomKey(roomId);
  logger.info(`[redis]: Remove user=${username} from room with id=${roomId}`);

  await Promise.all([
    redisClient.lRem(roomKey, 0, username),
    redisClient.del(toUserKey(username)),
  ]);

  const remainingUsers = await redisClient.lLen(roomKey);

  return success(remainingUsers);
};

export const publishMessageToRoom = <T>(message: T, roomId: string) => {
  redisPublisher.publish(
    `${roomChannelPrefix}:${roomId}`,
    JSON.stringify(message)
  );
};

export const getRoomMembers = async (
  roomId: string
): Promise<Status<string[], 'Room not found'>> => {
  const members = await redisClient.lRange(toRoomKey(roomId), 0, -1);

  if (members.length !== 0) {
    return success(members);
  }

  return error('Room not found');
};

export const getRoomFromUsername = async (
  username: string
): Promise<Status<string, 'No room found for username'>> => {
  const roomId = await redisClient.get(toUserKey(username));

  if (roomId) return success(roomId);

  return error('No room found for username');
};

export const deleteRoom = async (
  roomId: string
): Promise<Status<{}, 'Room not found'>> => {
  const roomRaw = await redisClient.del(toRoomKey(roomId));
  if (roomRaw) {
    return success({});
  }

  return error('Room not found');
};

export const roomExists = async (roomId: string) =>
  (await redisClient.exists(toRoomKey(roomId))) > 0;

const toRoomKey = (roomId: string) => `room-${roomId}`;
const toUserKey = (username: string) => `user-${username}`;
