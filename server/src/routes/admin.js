'use strict';

const express = require('express');
const router = express.Router();
const { query } = require('../db/postgres');
const logger = require('../utils/logger');

/**
 * GET /bans
 * Returns a paginated list of currently active bans.
 * Query params: page (default 1), limit (default 20)
 */
router.get('/bans', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT id, ip_address, fingerprint, reason, banned_at, expires_at, banned_by
       FROM bans
       WHERE expires_at IS NULL OR expires_at > NOW()
       ORDER BY banned_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) AS total FROM bans WHERE expires_at IS NULL OR expires_at > NOW()`
    );

    res.json({
      bans: result.rows,
      total: parseInt(countResult.rows[0].total, 10),
      page,
      limit,
    });
  } catch (err) {
    logger.error('GET /bans error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /ban/:ip
 * Remove all active bans for a given IP address.
 */
router.delete('/ban/:ip', async (req, res) => {
  try {
    const { ip } = req.params;
    if (!ip) return res.status(400).json({ error: 'IP address required' });

    const result = await query(
      `DELETE FROM bans WHERE ip_address = $1 RETURNING id`,
      [ip]
    );

    logger.info(`Ban removed for IP=${ip} — ${result.rowCount} record(s) deleted`);
    res.json({ success: true, removed: result.rowCount });
  } catch (err) {
    logger.error('DELETE /ban error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
