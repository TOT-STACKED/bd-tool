const Parser = require('rss-parser');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/client');
const { fireTrigger } = require('../services/trigger.service');

// Uses Google News RSS to detect senior executive new hires at target companies.
// Press releases, business wire articles, and news coverage of C-suite/VP hires
// are reliably picked up by Google News.

const HIRE_RE = /\b(hired|appoints?|names?|joins|welcomes?|brings? on|onboards?)\b/i;

const TITLE_PATTERNS = [
  { re: /\b(chief revenue officer|CRO)\b/i, title: 'Chief Revenue Officer', seniority: 'c-suite' },
  { re: /\b(chief customer officer|CCO)\b/i, title: 'Chief Customer Officer', seniority: 'c-suite' },
  { re: /\b(chief operating officer|COO)\b/i, title: 'Chief Operating Officer', seniority: 'c-suite' },
  { re: /\b(chief people officer|CPO)\b/i, title: 'Chief People Officer', seniority: 'c-suite' },
  { re: /\bVP of Sales\b/i, title: 'VP of Sales', seniority: 'vp' },
  { re: /\bVP(?:\s+of)?\s+Customer Success\b/i, title: 'VP of Customer Success', seniority: 'vp' },
  { re: /\bVP(?:\s+of)?\s+People\b/i, title: 'VP of People', seniority: 'vp' },
  { re: /\bVP(?:\s+of)?\s+Revenue\b/i, title: 'VP of Revenue', seniority: 'vp' },
  { re: /\bDirector of Sales\b/i, title: 'Director of Sales', seniority: 'director' },
  { re: /\bDirector of Customer Success\b/i, title: 'Director of Customer Success', seniority: 'director' },
  { re: /\bHead of Sales\b/i, title: 'Head of Sales', seniority: 'head' },
  { re: /\bHead of Customer Success\b/i, title: 'Head of Customer Success', seniority: 'head' },
  { re: /\bHead of People\b/i, title: 'Head of People', seniority: 'head' },
];

// Extract a person name heuristic: "Company appoints Jane Smith as VP..." or "Jane Smith joins..."
function extractPerson(text) {
  // Pattern: Verb + Capitalized Name (2-3 words) + as|to
  const m = text.match(
    /(?:appoints?|hires?|names?|welcomes?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\s+(?:as|to)\b/
  ) || text.match(
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\s+(?:joins|appointed|named)\b/
  );
  return m ? m[1] : null;
}

function googleNewsUrl(company) {
  const q = encodeURIComponent(
    `"${company}" (appointed OR hired OR joins OR names) (CRO OR "VP Sales" OR "VP of Sales" OR "Chief Revenue" OR "VP Customer" OR "Head of Sales" OR "Director of Sales")`
  );
  return `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;
}

const parser = new Parser({ timeout: 10000 });

const googleNewsScraper = {
  name: 'google-news',
  description: 'Scans Google News for senior executive new hire announcements',
  schedule: '0 9 * * *', // daily at 9am

  async run() {
    const db = getDb();
    const companies = db.prepare('SELECT * FROM companies').all();
    if (!companies.length) return [];

    const results = [];

    for (const company of companies) {
      const url = googleNewsUrl(company.name);

      let feed;
      try {
        feed = await parser.parseURL(url);
      } catch (err) {
        console.warn(`[google-news] RSS failed for "${company.name}":`, err.message);
        continue;
      }

      for (const item of feed.items) {
        const text = `${item.title || ''} ${item.contentSnippet || ''}`;

        // Must mention a hire/appointment
        if (!HIRE_RE.test(text)) continue;

        // Must mention a relevant senior title
        const matchedTitle = TITLE_PATTERNS.find(p => p.re.test(text));
        if (!matchedTitle) continue;

        const link = item.link || '';
        if (!link) continue;

        // Deduplicate by article URL + company
        const existing = db.prepare(
          'SELECT id FROM triggers WHERE source_url = ? AND company_id = ?'
        ).get(link, company.id);
        if (existing) continue;

        const personName = extractPerson(text);
        const now = new Date().toISOString();

        const triggerTitle = personName
          ? `${company.name} hired ${personName} as ${matchedTitle.title}`
          : `${company.name} appointed new ${matchedTitle.title}`;

        const trigger = {
          id: uuidv4(),
          company_id: company.id,
          type: 'new_hire',
          title: triggerTitle,
          detail: JSON.stringify({
            person_name: personName,
            new_title: matchedTitle.title,
            seniority: matchedTitle.seniority,
            linkedin_url: null,
            start_date: item.pubDate || now,
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
        console.log(`[google-news] new hire at "${company.name}": ${triggerTitle}`);
      }

      // Don't hammer Google News
      await new Promise(r => setTimeout(r, 500));
    }

    console.log(`[google-news] done — ${results.length} new trigger(s)`);
    return results;
  },
};

module.exports = googleNewsScraper;
