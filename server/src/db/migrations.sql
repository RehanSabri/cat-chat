-- TextChat database migrations
-- Run this file against your PostgreSQL database to set up the required tables.
-- Example: psql -U user -d textchat -f migrations.sql

-- ============================================================
-- BANS
-- ============================================================
CREATE TABLE IF NOT EXISTS bans (
  id            SERIAL PRIMARY KEY,
  ip_address    VARCHAR(45)  NOT NULL,
  fingerprint   VARCHAR(255),
  reason        TEXT,
  banned_at     TIMESTAMPTZ  DEFAULT NOW(),
  expires_at    TIMESTAMPTZ,          -- NULL = permanent ban
  banned_by     VARCHAR(50)  DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS idx_bans_ip
  ON bans(ip_address);

CREATE INDEX IF NOT EXISTS idx_bans_fingerprint
  ON bans(fingerprint);

-- ============================================================
-- REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id                   SERIAL PRIMARY KEY,
  reporter_socket_id   VARCHAR(255),
  reported_socket_id   VARCHAR(255),
  reporter_ip          VARCHAR(45),
  reported_ip          VARCHAR(45),
  reason               VARCHAR(100) NOT NULL,
  details              TEXT,
  room_id              VARCHAR(255),
  created_at           TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_reported_ip
  ON reports(reported_ip);

CREATE INDEX IF NOT EXISTS idx_reports_created_at
  ON reports(created_at);
