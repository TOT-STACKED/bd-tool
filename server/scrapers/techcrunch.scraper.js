const Parser = require('rss-parser');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/client');
const { fireTrigger } = require('../services/trigger.service');

const FEED_URL = 'https://techcrunch.com/feed/';
const FUNDING_RE = /\b(raises?|raised|funding|series [a-e]|seed round|pre-?seed|growth round)\b/i;
const AMOUNT_RE = /\$(\d+(?:\.\d+)?)\s*(M|B|million|billion)/i;
const ROUND_RE = /Series ([A-E])/i;

const parser = new Parser({ timeout: 10000 });

function extractAmount(text) {
  const m = text.match(AMOUNT_RE);
  if (!m) return null;
  const num = parseFloat(m[1]);
  const mult = /b/i.test(m[2]) ? 1e9 : 1e6;
  return Math.round(num * mult);
}

const techcrunchScraper = {
  name: 'techcrunch',
  description: 'Scans TechCrunch RSS for funding announcements matching target companies',
  schedule: '0 */2 * * *', // every 2 hours

  async run() {
    const db = getDb();
    const companies = db.prepare('SELECT * FROM companies').all();
    if (!companies.length) return [];

    let feed;
    try {
      feed = await parser.parseURL(FEED_URL);
    } catch (err) {
      console.error('[techcrunch] RSS fetch failed:', err.message);
      return [];
    }

    const results = [];

    for (const item of feed.items) {
      const text = `${item.title || ''} ${item.contentSnippet || ''}`;
      if (!FUNDING_RE.test(text)) continue;

      for (const company of companies) {
        // Case-insensitive whole-word match against company name
        const nameRe = new RegExp(`\\b${company.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (!nameRe.test(text)) continue;

        // Deduplicate: skip if we've already stored this article for this company
        const existing = db.prepare(
          'SELECT id FROM triggers WHERE source_url = ? AND company_id = ?'
        ).get(item.link, company.id);
        if (existing) continue;

        const amount_usd = extractAmount(item.title) || extractAmount(item.contentSnippet || '');
        const roundMatch = item.title.match(ROUND_RE);
        const round = roundMatch ? `Series ${roundMatch[1].toUpperCase()}` : null;

        const now = new Date().toISOString();
        const trigger = {
          id: uuidv4(),
          company_id: company.id,
          type: 'funding',
          title: item.title,
          detail: JSON.stringify({
            amount_usd,
            round,
            announcement_url: item.link,
            published: item.pubDate,
          }),
          source_url: item.link,
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
        console.log(`[techcrunch] matched "${company.name}": ${item.title}`);
      }
    }

    console.log(`[techcrunch] done — ${results.length} new trigger(s)`);
    return results;
  },
};

module.exports = techcrunchScraper;
