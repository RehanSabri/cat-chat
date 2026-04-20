'use strict';

const Redis = require('ioredis');
const logger = require('../utils/logger');

let client;
let _retryCount = 0;

function getRedisClient() {
  if (!client) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const isUpstash = redisUrl.startsWith('rediss://');

    client = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      enableOfflineQueue: true,
      lazyConnect: false,
      // Enable TLS automatically for Upstash (rediss://) connections
      ...(isUpstash && { tls: { rejectUnauthorized: false } }),
      // Cap reconnect delay at 10 s — avoids log spam while still auto-recovering
      retryStrategy(times) {
        _retryCount = times;
        const delay = Math.min(times * 500, 10000);
        return delay;
      },
    });

    client.on('connect', () => {
      _retryCount = 0;
      logger.info('Redis connected');
    });
    client.on('ready', () => logger.info('Redis ready'));
    // Only log every 5th retry to avoid flooding the console
    client.on('error', (err) => {
      if (_retryCount <= 1 || _retryCount % 5 === 0) {
        logger.error(`Redis error (attempt ${_retryCount}): ${err.message}`);
        logger.error('  → Is Redis running? Try: docker run -d -p 6379:6379 redis:alpine');
      }
    });
    client.on('close', () => {
      if (_retryCount <= 1) logger.warn('Redis connection closed — will retry automatically');
    });
    client.on('reconnecting', () => {
      if (_retryCount <= 1) logger.info('Redis reconnecting...');
    });
  }
  return client;
}

module.exports = { getRedisClient };
