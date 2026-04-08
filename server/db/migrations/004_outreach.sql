CREATE TABLE IF NOT EXISTS outreach (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  contact_id TEXT REFERENCES contacts(id),
  stage TEXT NOT NULL DEFAULT 'identified' CHECK(stage IN ('identified','researching','outreach_sent','in_conversation','proposal_sent','closed_won','closed_lost')),
  activity_type TEXT CHECK(activity_type IN ('email','linkedin','call','meeting','note')),
  notes TEXT,
  next_action TEXT,
  next_action_date TEXT,
  owner TEXT,
  trigger_id TEXT REFERENCES triggers(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
