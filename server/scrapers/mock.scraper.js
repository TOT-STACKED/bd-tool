const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/client');
const { fireTrigger } = require('../services/trigger.service');

const MOCK_TYPES = ['funding', 'job_posting', 'new_hire'];
const MOCK_ROLES = ['VP of Sales', 'Director of Customer Success', 'Head of People', 'VP People', 'Head of Sales'];
const MOCK_HIRES = [
  { title: 'Chief Revenue Officer', seniority: 'c-suite' },
  { title: 'VP of Sales', seniority: 'vp' },
  { title: 'Director of Customer Success', seniority: 'director' },
  { title: 'Head of People', seniority: 'head' },
];
const ROUNDS = ['Series A', 'Series B', 'Series C'];
const NAMES = [['Taylor', 'Morgan'], ['Jordan', 'Lee'], ['Casey', 'Chen'], ['Alex', 'Patel']];

const mockScraper = {
  name: 'mock',
  description: 'Generates a fake trigger for development/testing',
  schedule: '*/5 * * * *', // every 5 minutes in dev

  async run() {
    const db = getDb();
    const companies = db.prepare('SELECT * FROM companies ORDER BY RANDOM() LIMIT 1').all();
    if (!companies.length) return [];

    const company = companies[0];
    const type = MOCK_TYPES[Math.floor(Math.random() * MOCK_TYPES.length)];
    const now = new Date().toISOString();
    const id = uuidv4();

    let title, detail;

    if (type === 'funding') {
      const round = ROUNDS[Math.floor(Math.random() * ROUNDS.length)];
      const amount = (Math.floor(Math.random() * 40) + 5) * 1000000;
      title = `${company.name} raised $${(amount / 1e6).toFixed(0)}M ${round}`;
      detail = { amount_usd: amount, round, investors: ['Mock Ventures', 'Seed Capital LP'] };
    } else if (type === 'new_hire') {
      const hire = MOCK_HIRES[Math.floor(Math.random() * MOCK_HIRES.length)];
      const [first, last] = NAMES[Math.floor(Math.random() * NAMES.length)];
      title = `${company.name} hired new ${hire.title}`;
      detail = { person_name: `${first} ${last}`, new_title: hire.title, seniority: hire.seniority };
    } else {
      const role = MOCK_ROLES[Math.floor(Math.random() * MOCK_ROLES.length)];
      title = `${company.name} posted ${role} role`;
      detail = { role_title: role, seniority: 'vp', job_url: `${company.website || 'https://example.com'}/careers`, posted_date: now };
    }

    const trigger = {
      id,
      company_id: company.id,
      type,
      title,
      detail: JSON.stringify(detail),
      source_url: null,
      detected_at: now,
      slack_sent: 0,
      hubspot_synced: 0,
      created_at: now,
    };

    db.prepare(`
      INSERT INTO triggers (id, company_id, type, title, detail, source_url, detected_at, slack_sent, hubspot_synced, created_at)
      VALUES (@id, @company_id, @type, @title, @detail, @source_url, @detected_at, @slack_sent, @hubspot_synced, @created_at)
    `).run(trigger);

    db.prepare('UPDATE companies SET trigger_count = trigger_count + 1, updated_at = ? WHERE id = ?').run(now, company.id);

    await fireTrigger(trigger, company);

    return [trigger];
  }
};

module.exports = mockScraper;
