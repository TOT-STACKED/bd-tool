const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/client');
const { fireTrigger } = require('../services/trigger.service');

const router = express.Router();

// ─── Clay webhook ──────────────────────────────────────────────────────────────
//
// Set the webhook URL in Clay to:
//   https://bd-tool-production.up.railway.app/api/webhooks/clay
//
// Expected columns in your Clay table (column names are flexible — we try common
// variants for each field):
//
//   company_name   — e.g. "Toast" (must match a company in your watchlist)
//   trigger_type   — "funding" | "job_posting" | "new_hire"
//   title          — short description, e.g. "Toast raised $50M Series C"
//   source_url     — LinkedIn job URL, TechCrunch article, etc.
//
//   For funding:
//     amount_usd   — number, e.g. 50000000
//     round        — "Series A" / "Series B" etc.
//
//   For job_posting:
//     role_title   — "VP of Sales"
//     seniority    — "vp" | "director" | "head" | "c-suite"
//
//   For new_hire:
//     person_name  — "Jane Smith"
//     role_title   — "Chief Revenue Officer"
//     seniority    — "c-suite"
//
// Optional security: set CLAY_WEBHOOK_SECRET in Railway env vars and add the same
// value as a header "x-clay-secret" in your Clay webhook config.
// ─────────────────────────────────────────────────────────────────────────────

// Resolve a field from a Clay row — tries multiple common column name variants
function field(row, ...keys) {
  for (const key of keys) {
    const variants = [key, key.replace(/_/g, ' '), key.replace(/_/g, '-')];
    for (const v of variants) {
      for (const rowKey of Object.keys(row)) {
        if (rowKey.toLowerCase() === v.toLowerCase() && row[rowKey] != null && row[rowKey] !== '') {
          return row[rowKey];
        }
      }
    }
  }
  return null;
}

// Find a company by name — exact first, then case-insensitive, then partial
function findCompany(db, name) {
  if (!name) return null;
  const clean = String(name).trim();
  return (
    db.prepare('SELECT * FROM companies WHERE name = ? LIMIT 1').get(clean) ||
    db.prepare('SELECT * FROM companies WHERE LOWER(name) = LOWER(?) LIMIT 1').get(clean) ||
    db.prepare("SELECT * FROM companies WHERE LOWER(name) LIKE LOWER('%' || ? || '%') LIMIT 1").get(clean)
  );
}

function processRow(row) {
  const db = getDb();

  const companyName = field(row, 'company_name', 'company', 'organization', 'org_name');
  const company = findCompany(db, companyName);

  if (!company) {
    return { skipped: true, reason: `Company not found: "${companyName}"` };
  }

  const rawType = field(row, 'trigger_type', 'type', 'signal_type', 'event_type');
  const type = normaliseType(rawType);
  if (!type) {
    return { skipped: true, reason: `Unknown trigger_type: "${rawType}"` };
  }

  const sourceUrl = field(row, 'source_url', 'url', 'link', 'job_url', 'article_url') || null;

  // Deduplicate: if we've already stored this URL for this company, skip
  if (sourceUrl) {
    const existing = db.prepare(
      'SELECT id FROM triggers WHERE source_url = ? AND company_id = ?'
    ).get(sourceUrl, company.id);
    if (existing) return { skipped: true, reason: 'Duplicate source_url' };
  }

  const title = buildTitle(row, type, company);
  const detail = buildDetail(row, type);
  const now = new Date().toISOString();

  const trigger = {
    id: uuidv4(),
    company_id: company.id,
    type,
    title,
    detail: JSON.stringify(detail),
    source_url: sourceUrl,
    detected_at: now,
    slack_sent: 0,
    hubspot_synced: 0,
    created_at: now,
  };

  db.prepare(`
    INSERT INTO triggers (id, company_id, type, title, detail, source_url,
      detected_at, slack_sent, hubspot_synced, created_at)
    VALUES (@id, @company_id, @type, @title, @detail, @source_url,
      @detected_at, @slack_sent, @hubspot_synced, @created_at)
  `).run(trigger);

  db.prepare('UPDATE companies SET trigger_count = trigger_count + 1, updated_at = ? WHERE id = ?')
    .run(now, company.id);

  fireTrigger(trigger, company).catch(err =>
    console.error('[webhooks/clay] side-effect error:', err)
  );

  console.log(`[webhooks/clay] trigger created: ${type} for "${company.name}" — ${title}`);
  return { ok: true, trigger_id: trigger.id, company: company.name, type };
}

function normaliseType(raw) {
  if (!raw) return null;
  const t = String(raw).toLowerCase().replace(/[-\s]/g, '_');
  if (['funding', 'fundraise', 'raise', 'investment'].some(k => t.includes(k))) return 'funding';
  if (['job', 'posting', 'hiring', 'role', 'position'].some(k => t.includes(k))) return 'job_posting';
  if (['hire', 'new_hire', 'appoint', 'join', 'executive'].some(k => t.includes(k))) return 'new_hire';
  return null;
}

function buildTitle(row, type, company) {
  const explicit = field(row, 'title', 'signal_title', 'headline');
  if (explicit) return explicit;

  const role = field(row, 'role_title', 'job_title', 'position', 'title');
  const person = field(row, 'person_name', 'name', 'full_name');
  const amount = field(row, 'amount_usd', 'amount', 'raised');
  const round = field(row, 'round', 'funding_round', 'series');

  if (type === 'funding') {
    const amt = amount ? ` $${(Number(amount) / 1e6).toFixed(0)}M` : '';
    const rnd = round ? ` ${round}` : '';
    return `${company.name} raised${amt}${rnd}`;
  }
  if (type === 'new_hire' && person) return `${company.name} hired ${person} as ${role || 'new executive'}`;
  if (type === 'new_hire') return `${company.name} made a new senior hire${role ? `: ${role}` : ''}`;
  if (type === 'job_posting' && role) return `${company.name} is hiring: ${role}`;
  return `${company.name} — new ${type.replace('_', ' ')} signal`;
}

function buildDetail(row, type) {
  if (type === 'funding') {
    return {
      amount_usd: Number(field(row, 'amount_usd', 'amount', 'raised')) || null,
      round: field(row, 'round', 'funding_round', 'series'),
      investors: field(row, 'investors', 'lead_investor'),
    };
  }
  if (type === 'new_hire') {
    return {
      person_name: field(row, 'person_name', 'name', 'full_name'),
      new_title: field(row, 'role_title', 'job_title', 'position', 'new_role'),
      seniority: field(row, 'seniority', 'level') || inferSeniority(field(row, 'role_title', 'job_title')),
      linkedin_url: field(row, 'linkedin_url', 'profile_url', 'linkedin'),
    };
  }
  if (type === 'job_posting') {
    return {
      role_title: field(row, 'role_title', 'job_title', 'position'),
      seniority: field(row, 'seniority', 'level') || inferSeniority(field(row, 'role_title', 'job_title')),
      job_url: field(row, 'source_url', 'job_url', 'url', 'link'),
      posted_date: field(row, 'posted_date', 'date', 'published_at'),
    };
  }
  return {};
}

function inferSeniority(title) {
  if (!title) return 'director';
  const t = title.toLowerCase();
  if (/\b(chief|cro|cco|coo|cpo|cto|cfo|ceo)\b/.test(t)) return 'c-suite';
  if (/\bvp\b|vice president/.test(t)) return 'vp';
  if (/\bdirector\b/.test(t)) return 'director';
  if (/\bhead\b/.test(t)) return 'head';
  return 'director';
}

// ─── Route handler ────────────────────────────────────────────────────────────

router.post('/clay', async (req, res) => {
  // Optional secret check
  const secret = process.env.CLAY_WEBHOOK_SECRET;
  if (secret) {
    const provided = req.headers['x-clay-secret'] || req.headers['authorization'];
    if (!provided || provided.replace('Bearer ', '') !== secret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  // Clay sends either a single row object or { data: [...] } batch
  let rows = [];
  if (Array.isArray(req.body)) {
    rows = req.body;
  } else if (Array.isArray(req.body?.data)) {
    rows = req.body.data;
  } else if (req.body && typeof req.body === 'object') {
    rows = [req.body];
  }

  if (!rows.length) {
    return res.status(400).json({ error: 'No rows in payload' });
  }

  const results = rows.map(row => {
    try {
      return processRow(row);
    } catch (err) {
      console.error('[webhooks/clay] row error:', err.message, row);
      return { error: err.message };
    }
  });

  const created = results.filter(r => r.ok).length;
  const skipped = results.filter(r => r.skipped).length;

  res.json({ received: rows.length, created, skipped, results });
});

module.exports = router;
