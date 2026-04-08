const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/client');
const { fireTrigger } = require('../services/trigger.service');

// Requires CRUNCHBASE_API_KEY in .env (Basic plan, $29/month at crunchbase.com)
// Without a key this scraper logs a warning and returns [].

const BASE = 'https://api.crunchbase.com/api/v4';
const LOOKBACK_DAYS = 30;

function slugFromUrl(url) {
  if (!url) return null;
  // e.g. https://www.crunchbase.com/organization/stripe → stripe
  const m = url.match(/crunchbase\.com\/organization\/([^/?#]+)/i);
  return m ? m[1] : null;
}

async function fetchWithKey(path, key) {
  const url = `${BASE}${path}${path.includes('?') ? '&' : '?'}user_key=${key}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Crunchbase ${res.status} for ${path}`);
  return res.json();
}

const crunchbaseScraper = {
  name: 'crunchbase',
  description: 'Checks Crunchbase for recent funding rounds (requires CRUNCHBASE_API_KEY)',
  schedule: '0 7 * * *', // daily at 7am

  async run() {
    const key = process.env.CRUNCHBASE_API_KEY;
    if (!key) {
      console.log('[crunchbase] skipped — no CRUNCHBASE_API_KEY set');
      return [];
    }

    const db = getDb();
    const companies = db.prepare('SELECT * FROM companies WHERE crunchbase_url IS NOT NULL').all();
    if (!companies.length) {
      console.log('[crunchbase] no companies with crunchbase_url set');
      return [];
    }

    const cutoff = new Date(Date.now() - LOOKBACK_DAYS * 86400000).toISOString().slice(0, 10);
    const results = [];

    for (const company of companies) {
      const slug = slugFromUrl(company.crunchbase_url);
      if (!slug) continue;

      let data;
      try {
        data = await fetchWithKey(
          `/entities/organizations/${slug}?card_ids=funding_rounds`,
          key
        );
      } catch (err) {
        console.error(`[crunchbase] error fetching ${slug}:`, err.message);
        continue;
      }

      const rounds = data?.cards?.funding_rounds || [];

      for (const round of rounds) {
        if (!round.announced_on || round.announced_on < cutoff) continue;

        const sourceUrl = `https://www.crunchbase.com/funding_round/${round.identifier?.permalink || round.uuid}`;

        const existing = db.prepare(
          'SELECT id FROM triggers WHERE source_url = ? AND company_id = ?'
        ).get(sourceUrl, company.id);
        if (existing) continue;

        const amount_usd = round.money_raised?.value_usd || null;
        const roundName = round.investment_type
          ? round.investment_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          : null;

        const title = amount_usd
          ? `${company.name} raised ${roundName || 'funding'} · $${(amount_usd / 1e6).toFixed(0)}M`
          : `${company.name} announced ${roundName || 'funding round'}`;

        const now = new Date().toISOString();
        const trigger = {
          id: uuidv4(),
          company_id: company.id,
          type: 'funding',
          title,
          detail: JSON.stringify({
            amount_usd,
            round: roundName,
            investors: (round.lead_investors || []).map(i => i.value),
            announcement_url: sourceUrl,
          }),
          source_url: sourceUrl,
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
        console.log(`[crunchbase] new funding for "${company.name}": ${title}`);
      }

      // Respect Crunchbase rate limit (4 req/s on Basic)
      await new Promise(r => setTimeout(r, 300));
    }

    console.log(`[crunchbase] done — ${results.length} new trigger(s)`);
    return results;
  },
};

module.exports = crunchbaseScraper;
