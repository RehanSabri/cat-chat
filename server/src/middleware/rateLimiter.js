'use strict';

/**
 * Per-socket, in-memory rate limiter using a Map.
 * No Redis required — state lives in process memory.
 *
 * Limits:
 *   send_message — 10 per 5 seconds
 *   next         —  5 per 10 seconds
 *   join_queue   —  3 per 10 seconds
 */

const LIMITS = {
  send_message: { max: 10, windowMs: 5000 },
  next:         { max: 5,  windowMs: 10000 },
  join_queue:   { max: 3,  windowMs: 10000 },
};

/**
 * Creates a rate limiter instance per socket.
 * Call createRateLimiter() once per connected socket and pass the returned
 * object's .check() method to each event handler.
 */
function createRateLimiter() {
  // eventType -> { count, windowStart }
  const state = new Map();

  /**
   * Check whether the socket is allowed to perform the given event.
   * Returns true if allowed, false if rate-limited.
   * Emits 'rate_limited' to the socket if the limit is exceeded.
   *
   * @param {import('socket.io').Socket} socket
   * @param {string} eventType
   * @returns {boolean}
   */
  function check(socket, eventType) {
    const limit = LIMITS[eventType];
    if (!limit) return true; // no limit defined for this event

    const now = Date.now();
    const current = state.get(eventType) || { count: 0, windowStart: now };

    if (now - current.windowStart > limit.windowMs) {
      // Window has expired — reset
      state.set(eventType, { count: 1, windowStart: now });
      return true;
    }

    if (current.count >= limit.max) {
      const retryAfter = Math.ceil((limit.windowMs - (now - current.windowStart)) / 1000);
      socket.emit('rate_limited', { event: eventType, retryAfter });
      const logger = require('../utils/logger');
      logger.warn(`Rate limited: socket=${socket.id} event=${eventType} retryAfter=${retryAfter}s`);
      return false;
    }

    state.set(eventType, { count: current.count + 1, windowStart: current.windowStart });
    return true;
  }

  return { check };
}

module.exports = { createRateLimiter };
