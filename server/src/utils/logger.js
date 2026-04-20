'use strict';

const levels = { info: '✓', warn: '⚠', error: '✗' };

function log(level, ...args) {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}]`;
  console[level](prefix, ...args);
}

const logger = {
  info: (...args) => log('info', ...args),
  warn: (...args) => log('warn', ...args),
  error: (...args) => log('error', ...args),
};

module.exports = logger;
