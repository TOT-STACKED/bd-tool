/**
 * Funding News Scraper
 * Uses Google News RSS to find funding announcements for each target company.
 * Covers TechCrunch, BusinessWire, PR Newswire, City A.M., and all major outlets.
 */
const Parser = require('rss-parser');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/client');
const { fireTrigger } = require('../services/trigger.service');

const AMOUNT_RE = /\$(\d+(?:\.\d+)?)\s*(M|B|million|billion)/i;
const ROUND_RE = /\b(Series [A-E]|Seed|Pre-?Seed|Growth)\b/i;

const parser = new Parser({ timeout: 12000 });

function extractAmount(text) {
  const m = text.match(AMOUNT_RE);
  if (!m) return null;
  const num = parseFloat(m[1]);
  const mult = /b/i.test(m[2]) ? 1e9 : 1e6;
  return Math.round(num * mult);
}

function fundingNewsUrl(companyName) {
  // Quote the name AND require funding-specific terms to reduce false positives
  const q = encodeURIComponent(
    `"${companyName}" ("raises" OR "raised" OR "Series A" OR "Series B" OR "Series C" OR "seed round" OR "growth round") startup`
  );
  return `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;
}

const techcrunchScraper = {
  name: 'techcrunch',
  description: 'Scans Google News for funding announcements at target companies',
  schedule: '0 */4 * * *', // every 4 hours

  async run() {
    const db = getDb();
    const companies = db.prepare('SELECT * FROM companies').all();
    if (!companies.length) return [];

    const results = [];

    for (const company of companies) {
      const url = fundingNewsUrl(company.name);
      let feed;
      try {
        feed = await parser.parseURL(url);
      } catch (err) {
        console.warn(`[funding] RSS failed for "${company.name}":`, err.message);
        await new Promise(r => setTimeout(r, 500));
        continue;
      }

      for (const item of feed.items) {
        const text = `${item.title || ''} ${item.contentSnippet || ''}`;
        const link = item.link || '';
        if (!link) continue;

          // Must mention BOTH an amount AND explicit round — strict to avoid false positives
        const hasAmount = AMOUNT_RE.test(text);
        const hasRound = ROUND_RE.test(text);
        if (!hasAmount || !hasRound) continue;

        // Company name must appear in the title (not just the snippet)
        const nameRe = new RegExp(`\\b${company.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (!nameRe.test(item.title || '')) continue;

        // Skip news older than 60 days
        if (item.pubDate) {
          const age = Date.now() - new Date(item.pubDate).getTime();
          if (age > 60 * 24 * 60 * 60 * 1000) continue;
        }

        // Deduplicate
        const existing = db.prepare(
          'SELECT id FROM triggers WHERE source_url = ? AND company_id = ?'
        ).get(link, company.id);
        if (existing) continue;

        const amount_usd = extractAmount(item.title) || extractAmount(item.contentSnippet || '');
        const roundMatch = text.match(ROUND_RE);
        const round = roundMatch ? roundMatch[1] : null;

        const now = new Date().toISOString();
        const trigger = {
          id: uuidv4(),
          company_id: company.id,
          type: 'funding',
          title: item.title,
          detail: JSON.stringify({ amount_usd, round, announcement_url: link, published: item.pubDate }),
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
        console.log(`[funding] matched "${company.name}": ${item.title}`);
      }

      await new Promise(r => setTimeout(r, 400));
    }

    console.log(`[funding] done — ${results.length} new trigger(s)`);
    return results;
  },
};

module.exports = techcrunchScraper;
