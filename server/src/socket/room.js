'use strict';

const { getRedisClient } = require('../db/redis');

const ROOM_TTL_SECONDS = 86400; // 24 hours

/**
 * Create a room in Redis with a 24-hour TTL.
 */
async function createRoom(roomId, userA, userB, mode) {
  const redis = getRedisClient();
  const key = `room:${roomId}`;
  await redis.hset(key, {
    userA,
    userB,
    mode,
    createdAt: Date.now().toString(),
  });
  await redis.expire(key, ROOM_TTL_SECONDS);
}

/**
 * Retrieve a room hash. Returns null if the room does not exist.
 */
async function getRoom(roomId) {
  const redis = getRedisClient();
  const room = await redis.hgetall(`room:${roomId}`);
  if (!room || Object.keys(room).length === 0) return null;
  return room;
}

/**
 * Given a roomId and the requesting socket's ID, return the other socket ID (the partner).
 * Returns null if the room does not exist or the socket is not in it.
 */
async function getPartner(roomId, mySocketId) {
  const room = await getRoom(roomId);
  if (!room) return null;
  if (room.userA === mySocketId) return room.userB;
  if (room.userB === mySocketId) return room.userA;
  return null;
}

/**
 * Delete a room from Redis.
 */
async function deleteRoom(roomId) {
  const redis = getRedisClient();
  await redis.del(`room:${roomId}`);
}

module.exports = { createRoom, getRoom, getPartner, deleteRoom };
