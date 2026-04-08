const { getDb } = require('../db/client');
const { migrate } = require('../db/migrate');
const { companies } = require('./companies.seed');
const { makeContacts } = require('./contacts.seed');
const { makeTriggers } = require('./triggers.seed');
const { makeOutreach } = require('./outreach.seed');

function clearTables(db) {
  db.exec('DELETE FROM outreach');
  db.exec('DELETE FROM triggers');
  db.exec('DELETE FROM contacts');
  db.exec('DELETE FROM companies');
}

function insertAll(db, companies, contacts, triggers, outreach) {
  const insertCompany = db.prepare(`
    INSERT INTO companies (id, name, sector, hq_country, fte_min, fte_max, website, linkedin_url,
      crunchbase_url, funding_stage, last_funding_date, last_funding_amount_usd,
      hubspot_company_id, trigger_count, created_at, updated_at)
    VALUES (@id, @name, @sector, @hq_country, @fte_min, @fte_max, @website, @linkedin_url,
      @crunchbase_url, @funding_stage, @last_funding_date, @last_funding_amount_usd,
      @hubspot_company_id, @trigger_count, @created_at, @updated_at)
  `);

  const insertContact = db.prepare(`
    INSERT INTO contacts (id, company_id, full_name, title, seniority, function,
      email, phone, linkedin_url, hubspot_contact_id, source, created_at, updated_at)
    VALUES (@id, @company_id, @full_name, @title, @seniority, @function,
      @email, @phone, @linkedin_url, @hubspot_contact_id, @source, @created_at, @updated_at)
  `);

  const insertTrigger = db.prepare(`
    INSERT INTO triggers (id, company_id, type, title, detail, source_url,
      detected_at, slack_sent, hubspot_synced, created_at)
    VALUES (@id, @company_id, @type, @title, @detail, @source_url,
      @detected_at, @slack_sent, @hubspot_synced, @created_at)
  `);

  const insertOutreach = db.prepare(`
    INSERT INTO outreach (id, company_id, contact_id, stage, activity_type,
      notes, next_action, next_action_date, owner, trigger_id, created_at, updated_at)
    VALUES (@id, @company_id, @contact_id, @stage, @activity_type,
      @notes, @next_action, @next_action_date, @owner, @trigger_id, @created_at, @updated_at)
  `);

  const seedAll = db.transaction(() => {
    for (const c of companies) insertCompany.run({ ...c, crunchbase_url: null, hubspot_company_id: null });
    for (const c of contacts) insertContact.run(c);
    for (const t of triggers) insertTrigger.run(t);
    for (const o of outreach) insertOutreach.run(o);
  });

  seedAll();
}

function seed() {
  migrate();
  const db = getDb();
  clearTables(db);

  const contacts = makeContacts(companies);
  const triggers = makeTriggers(companies);
  const outreach = makeOutreach(companies, contacts, triggers);

  insertAll(db, companies, contacts, triggers, outreach);

  console.log(`[seed] ${companies.length} companies`);
  console.log(`[seed] ${contacts.length} contacts`);
  console.log(`[seed] ${triggers.length} triggers`);
  console.log(`[seed] ${outreach.length} outreach records`);
  console.log('[seed] done');
}

// Run directly (npm run seed) or export for auto-seed on first deploy
if (require.main === module) {
  seed();
} else {
  seed();
}
