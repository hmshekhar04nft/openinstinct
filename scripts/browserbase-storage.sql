CREATE TABLE IF NOT EXISTS assistant_browser_usage (
  month text PRIMARY KEY,
  reserved_seconds integer NOT NULL DEFAULT 0 CHECK (reserved_seconds >= 0)
);
ALTER TABLE assistant_browser_usage ENABLE ROW LEVEL SECURITY;
