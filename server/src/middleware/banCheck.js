'use strict';

const { query } = require('../db/postgres');
const logger = require('../utils/logger');

/**
 * Socket.io middleware that checks whether the connecting IP is currently banned.
 *
 * IP is sourced from X-Forwarded-For (if behind a proxy) or socket.handshake.address.
 * If banned:  emits 'banned' to the socket and calls socket.disconnect(true).
 * If not banned: calls next() to allow the connection.
 */
async function banCheck(socket, next) {
  try {
    const forwarded = socket.handshake.headers['x-forwarded-for'];
    const ip = forwarded
      ? forwarded.split(',')[0].trim()
      : socket.handshake.address;

    const result = await query(
      `SELECT id, reason, expires_at FROM bans
       WHERE ip_address = $1
         AND (expires_at IS NULL OR expires_at > NOW())
       LIMIT 1`,
      [ip]
    );

    if (result.rows.length > 0) {
      const ban = result.rows[0];
      const expiresMsg = ban.expires_at
        ? `until ${new Date(ban.expires_at).toISOString()}`
        : 'permanently';

      logger.warn(`Banned IP attempted connection: ${ip} (banned ${expiresMsg})`);

      socket.emit('banned', {
        reason: ban.reason || 'You are banned from this service.',
        expiresAt: ban.expires_at || null,
      });

      socket.disconnect(true);
      return;
    }

    next();
  } catch (err) {
    // If the ban check fails (e.g. DB is unavailable), allow the connection
    // to avoid a complete outage, but log the error.
    logger.error('banCheck middleware error (allowing connection):', err.message);
    next();
  }
}

module.exports = { banCheck };
