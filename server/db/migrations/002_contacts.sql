CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  full_name TEXT,
  title TEXT,
  seniority TEXT CHECK(seniority IN ('c-suite', 'vp', 'director', 'head')),
  function TEXT CHECK(function IN ('sales', 'cs', 'people', 'ops', 'finance', 'marketing', 'product')),
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  hubspot_contact_id TEXT,
  source TEXT DEFAULT 'seed',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
