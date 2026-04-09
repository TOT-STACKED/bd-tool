CREATE TABLE IF NOT EXISTS scraper_runs (
  scraper TEXT PRIMARY KEY,
  last_run TEXT,
  last_count INTEGER DEFAULT 0,
  last_error TEXT,
  updated_at TEXT NOT NULL
);
