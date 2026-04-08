CREATE TABLE IF NOT EXISTS triggers (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  type TEXT NOT NULL CHECK(type IN ('funding', 'job_posting', 'new_hire')),
  title TEXT NOT NULL,
  detail TEXT,
  source_url TEXT,
  detected_at TEXT NOT NULL,
  slack_sent INTEGER DEFAULT 0,
  hubspot_synced INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);
