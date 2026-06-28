CREATE TABLE IF NOT EXISTS login_rate_limits (
  id INTEGER PRIMARY KEY,
  login_identifier TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  failed_count INTEGER NOT NULL DEFAULT 0,
  window_started_at TEXT NOT NULL,
  last_failed_at TEXT NOT NULL,
  UNIQUE (login_identifier, ip_address)
);

CREATE INDEX IF NOT EXISTS idx_login_rate_limits_window_started_at
  ON login_rate_limits(window_started_at);
