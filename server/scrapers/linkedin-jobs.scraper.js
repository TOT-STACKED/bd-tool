const Parser = require('rss-parser');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/client');
const { fireTrigger } = require('../services/trigger.service');

// Uses Indeed RSS to find senior job postings at target companies.
// Indeed RSS is free, no auth required, and covers LinkedIn/Glassdoor/direct posts.
// Searches for VP / Director / Head of roles posted in the last 7 days.

const SENIOR_TITLES = [
  'VP Sales', 'VP of Sales',
  'VP Customer Success', 'VP of Customer Success',
  'VP People', 'VP of People',
  'Director of Sales', 'Director Sales',
  'Director Customer Success',
  'Director of People', 'Head of Sales',
  'Head of Customer Success',
  'Head of People',
  'Chief Revenue Officer', 'CRO',
  'Chief Customer Officer', 'CCO',
  'Chief Operating Officer', 'COO',
];

const SENIORITY_MAP = {
  'chief': 'c-suite', 'cro': 'c-suite', 'cco': 'c-suite', 'coo': 'c-suite',
  'vp': 'vp', 'vice president': 'vp',
  'director': 'director',
  'head': 'head',
};

function detectSeniority(title) {
  const t = title.toLowerCase();
  for (const [key, val] of Object.entries(SENIORITY_MAP)) {
    if (t.includes(key)) return val;
  }
  return 'director';
}

const parser = new Parser({ timeout: 10000 });

function indeedRssUrl(company, role) {
  const q = encodeURIComponent(`"${company}" ${role}`);
  return `https://www.indeed.com/rss?q=${q}&l=United+States&sort=date&fromage=7`;
}

const linkedinJobsScraper = {
  name: 'linkedin-jobs',
  description: 'Scans Indeed RSS for senior role postings at target companies',
  schedule: '0 8 * * *', // daily at 8am

  async run() {
    const db = getDb();
    const companies = db.prepare('SELECT * FROM companies').all();
    if (!companies.length) return [];

    const results = [];

    for (const company of companies) {
      // Search for a handful of the most important senior titles per company
      const rolesToSearch = [
        'VP Sales OR "VP of Sales"',
        'Director Sales OR "Director of Customer Success"',
        '"Head of People" OR "VP People" OR CRO OR CCO OR COO',
      ];

      for (const roleQuery of rolesToSearch) {
        const url = indeedRssUrl(company.name, roleQuery);

        let feed;
        try {
          feed = await parser.parseURL(url);
        } catch (err) {
          console.warn(`[linkedin-jobs] Indeed RSS failed for ${company.name}:`, err.message);
          continue;
        }

        for (const item of feed.items) {
          const title = item.title || '';
          const link = item.link || '';
          if (!link) continue;

          // Confirm the job title is actually senior (Indeed sometimes returns broader results)
          const isSenior = SENIOR_TITLES.some(t =>
            title.toLowerCase().includes(t.toLowerCase())
          );
          if (!isSenior) continue;

          // Deduplicate by job URL + company
          const existing = db.prepare(
            'SELECT id FROM triggers WHERE source_url = ? AND company_id = ?'
          ).get(link, company.id);
          if (existing) continue;

          const seniority = detectSeniority(title);
          const now = new Date().toISOString();

          const trigger = {
            id: uuidv4(),
            company_id: company.id,
            type: 'job_posting',
            title: `${company.name} is hiring: ${title}`,
            detail: JSON.stringify({
              role_title: title,
              seniority,
              job_url: link,
              posted_date: item.pubDate || now,
            }),
            source_url: link,
            detected_at: now,
            slack_sent: 0,
            hubspot_synced: 0,
            created_at: now,
          };

          db.prepare(`
            INSERT INTO triggers (id, company_id, type, title, detail, source_url, detected_at, slack_sent, hubspot_synced, created_at)
            VALUES (@id, @company_id, @type, @title, @detail, @source_url, @detected_at, @slack_sent, @hubspot_synced, @created_at)
          `).run(trigger);

          db.prepare('UPDATE companies SET trigger_count = trigger_count + 1, updated_at = ? WHERE id = ?')
            .run(now, company.id);

          await fireTrigger(trigger, company);
          results.push(trigger);
          console.log(`[linkedin-jobs] job posting at "${company.name}": ${title}`);
        }

        // Be polite to Indeed
        await new Promise(r => setTimeout(r, 500));
      }
    }

    console.log(`[linkedin-jobs] done — ${results.length} new trigger(s)`);
    return results;
  },
};

module.exports = linkedinJobsScraper;
