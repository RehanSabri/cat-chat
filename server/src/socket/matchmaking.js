'use strict';

const { v4: uuidv4 } = require('uuid');
const { getRedisClient } = require('../db/redis');
const { createRoom } = require('./room');
const logger = require('../utils/logger');

const SOCKET_META_TTL = 86400; // 24 hours
const LOCK_TTL = 2; // seconds — mutex for rapid Next clicks

/**
 * Attempt to acquire a Redis lock for a given key.
 * Returns true if the lock was acquired, false otherwise.
 */
async function acquireLock(redis, lockKey) {
  const result = await redis.set(lockKey, '1', 'EX', LOCK_TTL, 'NX');
  return result === 'OK';
}

async function releaseLock(redis, lockKey) {
  await redis.del(lockKey);
}

/**
 * Store socket metadata in Redis.
 */
async function setSocketMeta(socketId, data) {
  const redis = getRedisClient();
  await redis.hset(`socket:${socketId}`, data);
  await redis.expire(`socket:${socketId}`, SOCKET_META_TTL);
}

/**
 * Get socket metadata from Redis.
 */
async function getSocketMeta(socketId) {
  const redis = getRedisClient();
  const meta = await redis.hgetall(`socket:${socketId}`);
  if (!meta || Object.keys(meta).length === 0) return null;
  return meta;
}

/**
 * Delete socket metadata from Redis.
 */
async function deleteSocketMeta(socketId) {
  const redis = getRedisClient();
  await redis.del(`socket:${socketId}`);
}

/**
 * Remove a socket ID from both queues.
 */
async function removeFromQueues(socketId) {
  const redis = getRedisClient();
  await redis.lrem(`queue:text`, 0, socketId);
  await redis.lrem(`queue:video`, 0, socketId);
}

/**
 * Remove socket from all queues and delete its metadata.
 */
async function leaveQueue(socketId) {
  await removeFromQueues(socketId);
  await deleteSocketMeta(socketId);
}

/**
 * Check whether two users share at least one interest tag.
 */
function hasSharedInterest(interestsA, interestsB) {
  // If either user specified no interests, treat as "match with anyone" → instant pair
  const aEmpty = !interestsA || !interestsA.trim();
  const bEmpty = !interestsB || !interestsB.trim();
  if (aEmpty || bEmpty) return true;

  // Both have interests — check for at least one overlap (case-insensitive)
  const setA = new Set(interestsA.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean));
  for (const interest of interestsB.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)) {
    if (setA.has(interest)) return true;
  }
  return false;
}


/**
 * Try to pop two connected sockets from the queue and pair them.
 *
 * Fixes vs original:
 *  1. Dead socket → clean its metadata + RECURSIVELY retry so the live
 *     socket isn't stuck waiting for a ghost.
 *  2. Interest-mismatch fallback → schedule a real setTimeout so the two
 *     sockets get paired after 5 s even if nobody else joins.
 *  3. Both-dead case → clean up ghost Redis metadata for both.
 *
 * @param {import('socket.io').Server} io
 * @param {string} mode
 * @param {number} [depth=0]  — recursion guard, max 10 retries
 * @returns {Promise<boolean>}
 */
async function tryPair(io, mode, depth = 0) {
  if (depth > 10) return false; // safety guard against infinite recursion

  const redis = getRedisClient();
  const queueKey = `queue:${mode}`;
  const FALLBACK_MS = 5000;

  // Pop first candidate
  const socketIdA = await redis.rpop(queueKey);
  if (!socketIdA) return false;

  // Pop second candidate
  const socketIdB = await redis.rpop(queueKey);
  if (!socketIdB) {
    // Only one socket in the queue — verify it's still alive
    if (!io.sockets.sockets.has(socketIdA)) {
      // Ghost — clean metadata and stop
      await deleteSocketMeta(socketIdA);
      return false;
    }
    // Alive — put it back and wait
    await redis.lpush(queueKey, socketIdA);
    return false;
  }

  const aConnected = io.sockets.sockets.has(socketIdA);
  const bConnected = io.sockets.sockets.has(socketIdB);

  // ── Both dead ──────────────────────────────────────────────────────────────
  if (!aConnected && !bConnected) {
    // Clean ghost metadata so Redis doesn't accumulate stale keys
    await deleteSocketMeta(socketIdA);
    await deleteSocketMeta(socketIdB);
    // Retry — there may be more sockets further in the queue
    return tryPair(io, mode, depth + 1);
  }

  // ── One dead ───────────────────────────────────────────────────────────────
  if (!aConnected) {
    await deleteSocketMeta(socketIdA);
    // Put the live socket back at the tail so it pairs with the next arrival
    await redis.lpush(queueKey, socketIdB);
    return tryPair(io, mode, depth + 1); // retry immediately with what's left
  }
  if (!bConnected) {
    await deleteSocketMeta(socketIdB);
    await redis.lpush(queueKey, socketIdA);
    return tryPair(io, mode, depth + 1);
  }

  // ── Both alive — check interests ───────────────────────────────────────────
  const metaA = await getSocketMeta(socketIdA);
  const metaB = await getSocketMeta(socketIdB);
  const sharedInterest = hasSharedInterest(metaA?.interests, metaB?.interests);

  if (!sharedInterest && metaA && metaB) {
    const waitA = Date.now() - parseInt(metaA.joinedAt || '0', 10);
    const waitB = Date.now() - parseInt(metaB.joinedAt || '0', 10);

    if (waitA < FALLBACK_MS && waitB < FALLBACK_MS) {
      // Neither has waited long enough — push both back atomically.
      // A single multi-arg lpush keeps them adjacent: [socketIdA, socketIdB, ...]
      // so a concurrent third socket can't wedge between them.
      await redis.lpush(queueKey, socketIdA, socketIdB);

      // ── FIX 2: Schedule a real retry after 5 s ─────────────────────────
      // Without this, two sockets in an empty queue wait forever if no new
      // user joins to trigger the next tryPair call.
      const retryIn = FALLBACK_MS - Math.min(waitA, waitB);
      setTimeout(() => tryPair(io, mode).catch(() => {}), retryIn);

      return false;
    }
  }

  // ── Pair them ──────────────────────────────────────────────────────────────
  const roomId = uuidv4();
  await createRoom(roomId, socketIdA, socketIdB, mode);

  // Merge roomId into existing socket metadata (keeps mode/interests/joinedAt)
  await setSocketMeta(socketIdA, { roomId });
  await setSocketMeta(socketIdB, { roomId });

  const socketA = io.sockets.sockets.get(socketIdA);
  const socketB = io.sockets.sockets.get(socketIdB);

  if (socketA) socketA.join(roomId);
  if (socketB) socketB.join(roomId);

  if (socketA) socketA.emit('matched', { roomId, initiator: true });
  if (socketB) socketB.emit('matched', { roomId, initiator: false });

  logger.info(`Matched: room=${roomId} userA=${socketIdA} userB=${socketIdB} mode=${mode}`);
  return true;
}


/**
 * Add a socket to the queue and attempt to pair it.
 */
async function joinQueue(io, socket, mode, interests) {
  const redis = getRedisClient();
  const validMode = mode === 'video' ? 'video' : 'text';
  const queueKey = `queue:${validMode}`;

  // Safety: remove from any existing queue first
  await removeFromQueues(socket.id);

  // Push to queue
  await redis.lpush(queueKey, socket.id);

  // Store socket metadata
  await setSocketMeta(socket.id, {
    mode: validMode,
    interests: Array.isArray(interests) ? interests.join(',') : (interests || ''),
    joinedAt: Date.now().toString(),
  });

  logger.info(`Socket ${socket.id} joined ${validMode} queue`);

  // Try to pair immediately
  await tryPair(io, validMode);
}

module.exports = {
  joinQueue,
  leaveQueue,
  removeFromQueues,
  getSocketMeta,
  setSocketMeta,
  deleteSocketMeta,
  acquireLock,
  releaseLock,
};
