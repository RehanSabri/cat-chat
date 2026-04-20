'use strict';

require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

const logger = require('./utils/logger');
const { getRedisClient } = require('./db/redis');
const { connect: connectPg, close: closePg } = require('./db/postgres');
const { banCheck } = require('./middleware/banCheck');
const { registerHandlers } = require('./socket/index');
const adminRouter = require('./routes/admin');

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ─── Express app ─────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use(cors({ origin: CLIENT_URL, credentials: true }));

// HTTP rate limiting (prevents DDoS on REST endpoints)
const httpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(httpLimiter);

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    connectedSockets: io.engine.clientsCount,
    timestamp: new Date().toISOString(),
  });
});

// ─── Admin routes ────────────────────────────────────────────────────────────
app.use('/admin', adminRouter);

// ─── HTTP server ─────────────────────────────────────────────────────────────
const server = http.createServer(app);

// ─── Socket.io ───────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Ban check runs on every new socket connection
io.use(banCheck);

// Register all event handlers for each connected socket
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id} (total: ${io.engine.clientsCount})`);
  registerHandlers(io, socket);
});

// ─── Startup ─────────────────────────────────────────────────────────────────
async function start() {
  // Connect datastores (non-blocking — server starts regardless)
  try {
    getRedisClient(); // initialises and throws on fatal error
  } catch (err) {
    logger.error('Failed to initialise Redis:', err.message);
  }

  await connectPg(); // logs success/failure internally

  server.listen(PORT, () => {
    logger.info(`TextChat server listening on port ${PORT}`);
    logger.info(`Accepting connections from ${CLIENT_URL}`);
  });
}

// ─── Graceful shutdown ───────────────────────────────────────────────────────
async function shutdown(signal) {
  logger.info(`${signal} received — shutting down gracefully…`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      const redis = getRedisClient();
      await redis.quit();
      logger.info('Redis disconnected');
    } catch (err) {
      logger.error('Error closing Redis:', err.message);
    }

    try {
      await closePg();
    } catch (err) {
      logger.error('Error closing PostgreSQL:', err.message);
    }

    process.exit(0);
  });

  // Force exit if graceful shutdown hangs
  setTimeout(() => {
    logger.error('Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Catch unhandled promise rejections — log but do not crash
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection:', reason);
});

start();
