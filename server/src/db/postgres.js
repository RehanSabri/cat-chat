'use strict';

const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  logger.error('PostgreSQL pool error:', err.message);
});

/**
 * Execute a parameterized query.
 * @param {string} text  - SQL string
 * @param {Array}  params - Query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.info(`PG query executed in ${duration}ms — rows: ${result.rowCount}`);
    return result;
  } catch (err) {
    logger.error('PG query error:', err.message, '| Query:', text);
    throw err;
  }
}

async function connect() {
  try {
    const client = await pool.connect();
    logger.info('PostgreSQL connected');
    client.release();
  } catch (err) {
    logger.error('PostgreSQL connection failed:', err.message);
  }
}

async function close() {
  await pool.end();
  logger.info('PostgreSQL pool closed');
}

module.exports = { query, connect, close, pool };
