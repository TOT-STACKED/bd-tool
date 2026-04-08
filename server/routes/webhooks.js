const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/client');
const { fireTrigger } = require('../services/trigger.service');
const { upsertCompany } = require('../services/hubspot.service');

const router = express.Router();

// ─── Field resolver ────────────────────────────────────────────────────────────
// Resolves a value from a Clay row by trying multiple column name variants
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

// ─── Company resolution ───────────────────────────────────────────────────────
function findCompany(db, name) {
  if (!name) return null;
  const clean = String(name).trim();
  return (
    db.prepare('SELECT * FROM companies WHERE name = ? LIMIT 1').get(clean) ||
    db.prepare('SELECT * FROM companies WHERE LOWER(name) = LOWER(?) LIMIT 1').get(clean) ||
    db.prepare("SELECT * FROM companies WHERE LOWER(name) LIKE LOWER('%' || ? || '%') LIMIT 1").get(clean)
  );
}

const VALID_STAGES = ['seed', 'series-a', 'series-b', 'series-c', 'series-d', 'growth'];
function normaliseFundingStage(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase().replace(/\s+/g, '-');
  if (VALID_STAGES.includes(s)) return s;
  if (s.includes('seed')) return 'seed';
  if (s.includes('series-a') || s === 'a') return 'series-a';
  if (s.includes('series-b') || s === 'b') return 'series-b';
  if (s.includes('series-c') || s === 'c') return 'series-c';
  if (s.includes('series-d') || s === 'd') return 'series-d';
  if (s.includes('growth') || s.includes('late')) return 'growth';
  return null;
}

function inferSector(row) {
  const hints = [
    field(row, 'sector', 'industry', 'vertical', 'category'),
    field(row, 'company_name', 'company'),
    field(row, 'title', 'headline'),
  ].filter(Boolean).join(' ').toLowerCase();

  if (/payment|fintech|pos|checkout|merchant|transaction|acquiring|issuing/.test(hints)) return 'payments';
  return 'hospo-saas'; // default for this watchlist
}

function domainToUrl(domain) {
  if (!domain) return null;
  if (domain.startsWith('http')) return domain;
  return `https://${domain}`;
}

function createCompany(db, row) {
  const now = new Date().toISOString();
  const name = String(field(row, 'company_name', 'company', 'organization') || '').trim();
  if (!name) return null;

  const domain = field(row, 'company_domain', 'domain', 'website');
  const linkedinUrl = field(row, 'linkedin_url', 'company_linkedin', 'linkedin');

  const company = {
    id: uuidv4(),
    name,
    sector: inferSector(row),
    hq_country: field(row, 'hq_country', 'country', 'location') ? 'US' : 'US',
    fte_min: Number(field(row, 'fte_min', 'employees_min')) || 50,
    fte_max: Number(field(row, 'fte_max', 'employees_max')) || 500,
    website: domainToUrl(domain),
    linkedin_url: linkedinUrl || null,
    crunchbase_url: field(row, 'crunchbase_url', 'crunchbase') || null,
    funding_stage: normaliseFundingStage(field(row, 'funding_stage', 'stage', 'last_round', 'series')),
    last_funding_date: field(row, 'last_funding_date', 'funding_date') || null,
    last_funding_amount_usd: Number(field(row, 'last_funding_amount_usd', 'amount_usd', 'funding_amount')) || null,
    hubspot_company_id: null,
    trigger_count: 0,
    created_at: now,
    updated_at: now,
  };

  db.prepare(`
    INSERT INTO companies (id, name, sector, hq_country, fte_min, fte_max, website, linkedin_url,
      crunchbase_url, funding_stage, last_funding_date, last_funding_amount_usd,
      hubspot_company_id, trigger_count, created_at, updated_at)
    VALUES (@id, @name, @sector, @hq_country, @fte_min, @fte_max, @website, @linkedin_url,
      @crunchbase_url, @funding_stage, @last_funding_date, @last_funding_amount_usd,
      @hubspot_company_id, @trigger_count, @created_at, @updated_at)
  `).run(company);

  console.log(`[webhooks/clay] auto-created company: "${name}"`);

  // Sync to HubSpot in background
  upsertCompany(company).catch(err => console.error('[webhooks/clay] hubspot company sync error:', err));

  return db.prepare('SELECT * FROM companies WHERE id = ?').get(company.id);
}

// ─── Trigger helpers ──────────────────────────────────────────────────────────
function normaliseType(raw) {
  if (!raw) return null;
  const t = String(raw).toLowerCase().replace(/[-\s]/g, '_');
  if (['funding', 'fundraise', 'raise', 'investment'].some(k => t.includes(k))) return 'funding';
  if (['job', 'posting', 'hiring', 'role', 'position', 'vacancy'].some(k => t.includes(k))) return 'job_posting';
  if (['hire', 'new_hire', 'appoint', 'join', 'executive', 'joined'].some(k => t.includes(k))) return 'new_hire';
  return null;
}

function inferSeniority(title) {
  if (!title) return 'director';
  const t = title.toLowerCase();
  if (/\b(chief|cro|cco|coo|cpo|cto|cfo|ceo)\b/.test(t)) return 'c-suite';
  if (/\bvp\b|vice president/.test(t)) return 'vp';
  if (/\bhead\b/.test(t)) return 'head';
  if (/\bdirector\b/.test(t)) return 'director';
  return 'director';
}

function buildTitle(row, type, company) {
  const explicit = field(row, 'title', 'signal_title', 'headline', 'trigger_title');
  if (explicit) return explicit;

  const role  = field(row, 'role_title', 'job_title', 'position');
  const person = field(row, 'person_name', 'person', 'full_name');
  const amount = field(row, 'amount_usd', 'amount', 'raised', 'funding_amount');
  const round  = field(row, 'round', 'funding_round', 'series');

  if (type === 'funding') {
    const amt = amount ? ` $${(Number(amount) / 1e6).toFixed(0)}M` : '';
    const rnd = round ? ` ${round}` : '';
    return `${company.name} raised${amt}${rnd}`;
  }
  if (type === 'new_hire' && person) return `${company.name} hired ${person} as ${role || 'new executive'}`;
  if (type === 'new_hire') return `${company.name} appointed new ${role || 'senior executive'}`;
  if (type === 'job_posting' && role) return `${company.name} is hiring: ${role}`;
  return `${company.name} — new ${type.replace('_', ' ')} signal`;
}

function buildDetail(row, type) {
  if (type === 'funding') {
    return {
      amount_usd: Number(field(row, 'amount_usd', 'amount', 'raised', 'funding_amount')) || null,
      round: field(row, 'round', 'funding_round', 'series'),
      investors: field(row, 'investors', 'lead_investor', 'investor'),
      announcement_url: field(row, 'source_url', 'url', 'article_url'),
    };
  }
  if (type === 'new_hire') {
    const role = field(row, 'role_title', 'job_title', 'position', 'new_role');
    return {
      person_name: field(row, 'person_name', 'person', 'full_name'),
      new_title: role,
      seniority: field(row, 'seniority', 'level') || inferSeniority(role),
      linkedin_url: field(row, 'linkedin_url', 'profile_url', 'linkedin'),
    };
  }
  if (type === 'job_posting') {
    const role = field(row, 'role_title', 'job_title', 'position');
    return {
      role_title: role,
      seniority: field(row, 'seniority', 'level') || inferSeniority(role),
      job_url: field(row, 'source_url', 'job_url', 'url', 'link'),
      posted_date: field(row, 'posted_date', 'date', 'published_at'),
    };
  }
  return {};
}

// ─── Row processor ────────────────────────────────────────────────────────────
function processRow(row) {
  const db = getDb();

  const companyName = field(row, 'company_name', 'company', 'organization', 'org_name');
  if (!companyName) return { skipped: true, reason: 'No company_name in payload' };

  // Find or auto-create the company
  let company = findCompany(db, companyName);
  let autoCreated = false;
  if (!company) {
    company = createCompany(db, row);
    if (!company) return { skipped: true, reason: `Could not create company from row` };
    autoCreated = true;
  }

  const rawType = field(row, 'trigger_type', 'type', 'signal_type', 'event_type');
  const type = normaliseType(rawType);
  if (!type) {
    return { skipped: true, reason: `Unknown trigger_type: "${rawType}"` };
  }

  const sourceUrl = field(row, 'source_url', 'url', 'link', 'job_url', 'article_url') || null;

  // Deduplicate by source_url + company
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

  console.log(`[webhooks/clay] ${autoCreated ? '[new company] ' : ''}${type} for "${company.name}": ${title}`);
  return { ok: true, trigger_id: trigger.id, company: company.name, type, auto_created: autoCreated };
}

// ─── POST /api/webhooks/clay ──────────────────────────────────────────────────
router.post('/clay', async (req, res) => {
  const secret = process.env.CLAY_WEBHOOK_SECRET;
  if (secret) {
    const provided = req.headers['x-clay-secret'] || req.headers['authorization'];
    if (!provided || provided.replace('Bearer ', '') !== secret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  let rows = [];
  if (Array.isArray(req.body)) {
    rows = req.body;
  } else if (Array.isArray(req.body?.data)) {
    rows = req.body.data;
  } else if (req.body && typeof req.body === 'object') {
    rows = [req.body];
  }

  if (!rows.length) return res.status(400).json({ error: 'No rows in payload' });

  const results = rows.map(row => {
    try { return processRow(row); }
    catch (err) {
      console.error('[webhooks/clay] row error:', err.message);
      return { error: err.message };
    }
  });

  res.json({
    received: rows.length,
    created: results.filter(r => r.ok).length,
    skipped: results.filter(r => r.skipped).length,
    auto_created_companies: results.filter(r => r.auto_created).length,
    results,
  });
});

module.exports = router;
