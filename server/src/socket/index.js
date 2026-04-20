'use strict';

const { joinQueue, leaveQueue, getSocketMeta, deleteSocketMeta, removeFromQueues, acquireLock, releaseLock } = require('./matchmaking');
const { getRoom, getPartner, deleteRoom } = require('./room');
const { forwardSignal } = require('./relay');
const { createRateLimiter } = require('../middleware/rateLimiter');
const { query } = require('../db/postgres');
const logger = require('../utils/logger');

/**
 * Sanitize a chat message: strip HTML tags, trim, cap at 500 chars.
 */
function sanitizeText(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/<[^>]*>/g, '')  // strip HTML tags
    .trim()
    .slice(0, 500);
}

/**
 * Shared cleanup helper — used by 'next', 'disconnect_chat', and 'disconnect'.
 * Removes the socket from its current room, notifies the partner, and cleans
 * up all Redis state. Optionally re-queues the requesting socket.
 *
 * @param {import('socket.io').Server} io
 * @param {string} socketId        - The socket that is leaving/disconnecting
 * @param {boolean} rejoinQueue    - Whether to add socketId back to the queue afterward
 * @param {string} mode            - The mode to re-use when rejoining ('text' | 'video')
 * @param {string[]} interests     - Interests to re-use when rejoining
 */
async function cleanupSocket(io, socketId, rejoinQueue = false, mode = 'text', interests = [], partnerEvent = 'stranger_disconnected') {
  const redis = require('../db/redis').getRedisClient();

  try {
    const meta = await getSocketMeta(socketId);
    const roomId = meta?.roomId;

    if (roomId) {
      // Get partner before deleting room
      const partnerId = await getPartner(roomId, socketId);

      // Have both sockets leave the Socket.io room
      const mySocket = io.sockets.sockets.get(socketId);
      if (mySocket) mySocket.leave(roomId);

      if (partnerId) {
        const partnerSocket = io.sockets.sockets.get(partnerId);
        if (partnerSocket) {
          partnerSocket.leave(roomId);
          partnerSocket.emit(partnerEvent);
        }

        // Clean up partner's metadata too
        await removeFromQueues(partnerId);
        await deleteSocketMeta(partnerId);
      }

      // Delete the room
      await deleteRoom(roomId);
    }

    // Clean up the requesting socket's metadata
    await leaveQueue(socketId);

    logger.info(`cleanupSocket: cleaned up socket=${socketId} roomId=${roomId || 'none'}`);
  } catch (err) {
    logger.error(`cleanupSocket error for socket=${socketId}:`, err.message);
  }

  // Optionally rejoin the queue
  if (rejoinQueue) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      await joinQueue(io, socket, mode, interests);
    }
  }
}

/**
 * Register all Socket.io event handlers for a connected socket.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
function registerHandlers(io, socket) {
  const rateLimiter = createRateLimiter();

  // ─── join_queue ────────────────────────────────────────────────────────────
  socket.on('join_queue', async ({ mode, interests } = {}) => {
    try {
      if (!rateLimiter.check(socket, 'join_queue')) return;

      const safeMode = mode === 'video' ? 'video' : 'text';
      const safeInterests = Array.isArray(interests) ? interests : [];
      await joinQueue(io, socket, safeMode, safeInterests);
    } catch (err) {
      logger.error(`[join_queue] socket=${socket.id}:`, err.message);
    }
  });

  // ─── leave_queue ───────────────────────────────────────────────────────────
  socket.on('leave_queue', async () => {
    try {
      await leaveQueue(socket.id);
      logger.info(`Socket ${socket.id} left queue`);
    } catch (err) {
      logger.error(`[leave_queue] socket=${socket.id}:`, err.message);
    }
  });

  // ─── send_message ──────────────────────────────────────────────────────────
  socket.on('send_message', async ({ text } = {}) => {
    try {
      if (!rateLimiter.check(socket, 'send_message')) return;

      const meta = await getSocketMeta(socket.id);
      if (!meta?.roomId) return; // not in a room

      const sanitized = sanitizeText(text);
      if (!sanitized) return;

      const partnerId = await getPartner(meta.roomId, socket.id);
      if (!partnerId) return;

      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        partnerSocket.emit('stranger_message', { text: sanitized });
      }
    } catch (err) {
      logger.error(`[send_message] socket=${socket.id}:`, err.message);
    }
  });

  // ─── next ──────────────────────────────────────────────────────────────────
  socket.on('next', async () => {
    try {
      if (!rateLimiter.check(socket, 'next')) return;

      const redis = require('../db/redis').getRedisClient();
      const lockKey = `lock:next:${socket.id}`;

      // Acquire mutex to prevent race conditions from rapid clicks
      const locked = await acquireLock(redis, lockKey);
      if (!locked) {
        logger.warn(`[next] lock not acquired for socket=${socket.id} — rapid click ignored`);
        return;
      }

      try {
        const meta = await getSocketMeta(socket.id);
        const mode = meta?.mode || 'text';
        const interests = meta?.interests ? meta.interests.split(',').filter(Boolean) : [];

        await cleanupSocket(io, socket.id, true, mode, interests);
      } finally {
        await releaseLock(redis, lockKey);
      }
    } catch (err) {
      logger.error(`[next] socket=${socket.id}:`, err.message);
    }
  });

  // ─── disconnect_chat ───────────────────────────────────────────────────────
  socket.on('disconnect_chat', async () => {
    try {
      await cleanupSocket(io, socket.id, false, 'text', [], 'stranger_left');
      logger.info(`Socket ${socket.id} ended chat voluntarily`);
    } catch (err) {
      logger.error(`[disconnect_chat] socket=${socket.id}:`, err.message);
    }
  });

  // ─── WebRTC relay ──────────────────────────────────────────────────────────
  socket.on('webrtc_offer', async ({ offer } = {}) => {
    try {
      const meta = await getSocketMeta(socket.id);
      if (!meta?.roomId || !offer) return;
      await forwardSignal(io, socket, meta.roomId, 'webrtc_offer', { offer });
    } catch (err) {
      logger.error(`[webrtc_offer] socket=${socket.id}:`, err.message);
    }
  });

  socket.on('webrtc_answer', async ({ answer } = {}) => {
    try {
      const meta = await getSocketMeta(socket.id);
      if (!meta?.roomId || !answer) return;
      await forwardSignal(io, socket, meta.roomId, 'webrtc_answer', { answer });
    } catch (err) {
      logger.error(`[webrtc_answer] socket=${socket.id}:`, err.message);
    }
  });

  socket.on('webrtc_ice_candidate', async ({ candidate } = {}) => {
    try {
      const meta = await getSocketMeta(socket.id);
      if (!meta?.roomId || !candidate) return;
      await forwardSignal(io, socket, meta.roomId, 'webrtc_ice_candidate', { candidate });
    } catch (err) {
      logger.error(`[webrtc_ice_candidate] socket=${socket.id}:`, err.message);
    }
  });

  // ─── report_user ───────────────────────────────────────────────────────────
  socket.on('report_user', async ({ reason, details } = {}) => {
    try {
      const meta = await getSocketMeta(socket.id);
      if (!meta?.roomId) {
        socket.emit('report_result', { success: false, error: 'Not in a room' });
        return;
      }

      const partnerId = await getPartner(meta.roomId, socket.id);
      if (!partnerId) {
        socket.emit('report_result', { success: false, error: 'No partner found' });
        return;
      }

      const reporterIp = socket.handshake.headers['x-forwarded-for']?.split(',')[0].trim()
        || socket.handshake.address;
      const partnerSocket = io.sockets.sockets.get(partnerId);
      const reportedIp = partnerSocket
        ? (partnerSocket.handshake.headers['x-forwarded-for']?.split(',')[0].trim() || partnerSocket.handshake.address)
        : null;

      // Insert report
      await query(
        `INSERT INTO reports (reporter_socket_id, reported_socket_id, reporter_ip, reported_ip, reason, details, room_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [socket.id, partnerId, reporterIp, reportedIp, reason || 'unspecified', details || '', meta.roomId]
      );

      logger.info(`Report filed: reporter=${socket.id} reported=${partnerId} reason=${reason}`);

      // Check auto-ban threshold: 3+ reports against this IP in the last hour
      if (reportedIp) {
        const countResult = await query(
          `SELECT COUNT(*) AS cnt FROM reports
           WHERE reported_ip = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
          [reportedIp]
        );

        const reportCount = parseInt(countResult.rows[0]?.cnt || '0', 10);
        if (reportCount >= 3) {
          // Auto-ban for 24 hours
          await query(
            `INSERT INTO bans (ip_address, reason, expires_at, banned_by)
             VALUES ($1, $2, NOW() + INTERVAL '24 hours', 'auto')
             ON CONFLICT DO NOTHING`,
            [reportedIp, `Auto-banned after ${reportCount} reports within 1 hour`]
          );

          logger.warn(`Auto-ban applied: ip=${reportedIp} after ${reportCount} reports`);

          if (partnerSocket) {
            partnerSocket.emit('banned', { reason: 'You have been banned due to multiple reports.' });
            partnerSocket.disconnect(true);
          }
        }
      }

      socket.emit('report_result', { success: true });
    } catch (err) {
      logger.error(`[report_user] socket=${socket.id}:`, err.message);
      socket.emit('report_result', { success: false, error: 'Server error' });
    }
  });

  // ─── disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', async (reason) => {
    try {
      logger.info(`Socket ${socket.id} disconnected — reason: ${reason}`);
      await cleanupSocket(io, socket.id, false);
    } catch (err) {
      logger.error(`[disconnect] socket=${socket.id}:`, err.message);
    }
  });
}

module.exports = { registerHandlers, cleanupSocket };
