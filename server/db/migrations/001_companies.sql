CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sector TEXT CHECK(sector IN ('hospo-saas', 'payments')),
  hq_country TEXT DEFAULT 'US',
  fte_min INTEGER,
  fte_max INTEGER,
  website TEXT,
  linkedin_url TEXT,
  crunchbase_url TEXT,
  funding_stage TEXT CHECK(funding_stage IN ('seed', 'series-a', 'series-b', 'series-c', 'series-d', 'growth')),
  last_funding_date TEXT,
  last_funding_amount_usd INTEGER,
  hubspot_company_id TEXT,
  trigger_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
