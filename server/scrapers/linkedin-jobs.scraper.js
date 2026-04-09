/**
 * Job Postings Scraper
 * Uses Google News RSS to find senior role postings at target companies.
 * Indeed RSS is largely blocked; Google News picks up job announcements
 * from LinkedIn, Glassdoor, and company press releases reliably.
 */
const Parser = require('rss-parser');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/client');
const { fireTrigger } = require('../services/trigger.service');

const SENIOR_RE = /\b(VP|Vice President|Director|Head of|Chief Revenue|Chief Customer|Chief Operating|CRO|CCO|COO|Chief People)\b/i;

const SENIORITY_MAP = [
  { re: /chief|cro|cco|coo|cpo/i, val: 'c-suite' },
  { re: /\bvp\b|vice president/i, val: 'vp' },
  { re: /\bdirector\b/i, val: 'director' },
  { re: /\bhead of\b/i, val: 'head' },
];

function detectSeniority(title) {
  for (const { re, val } of SENIORITY_MAP) {
    if (re.test(title)) return val;
  }
  return 'director';
}

function jobNewsUrl(companyName) {
  const q = encodeURIComponent(
    `"${companyName}" hiring (VP OR Director OR "Head of" OR CRO OR "Chief Revenue" OR "Vice President")`
  );
  return `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;
}

const parser = new Parser({ timeout: 12000 });

const linkedinJobsScraper = {
  name: 'linkedin-jobs',
  description: 'Scans Google News for senior role postings at target companies',
  schedule: '0 8 * * *', // daily at 8am

  async run() {
    const db = getDb();
    const companies = db.prepare('SELECT * FROM companies').all();
    if (!companies.length) return [];

    const results = [];

    for (const company of companies) {
      const url = jobNewsUrl(company.name);
      let feed;
      try {
        feed = await parser.parseURL(url);
      } catch (err) {
        console.warn(`[jobs] RSS failed for "${company.name}":`, err.message);
        await new Promise(r => setTimeout(r, 400));
        continue;
      }

      for (const item of feed.items) {
        const title = item.title || '';
        const link = item.link || '';
        if (!link || !SENIOR_RE.test(title)) continue;

        // Skip news older than 30 days
        if (item.pubDate) {
          const age = Date.now() - new Date(item.pubDate).getTime();
          if (age > 30 * 24 * 60 * 60 * 1000) continue;
        }

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
          detail: JSON.stringify({ role_title: title, seniority, job_url: link, posted_date: item.pubDate || now }),
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
        console.log(`[jobs] posting at "${company.name}": ${title}`);
      }

      await new Promise(r => setTimeout(r, 400));
    }

    console.log(`[jobs] done — ${results.length} new trigger(s)`);
    return results;
  },
};

module.exports = linkedinJobsScraper;
