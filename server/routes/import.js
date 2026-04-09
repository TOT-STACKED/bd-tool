const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/client');

const router = express.Router();

// Simple CSV parser (no external deps)
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());

  return lines.slice(1).map(line => {
    // Handle quoted fields with commas inside
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    values.push(current.trim());

    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  }).filter(row => Object.values(row).some(v => v));
}

// Normalise funding stage
const VALID_STAGES = ['seed', 'series-a', 'series-b', 'series-c', 'series-d', 'growth'];
function normaliseStage(raw) {
  if (!raw) return null;
  const s = raw.toLowerCase().replace(/\s+/g, '-');
  if (VALID_STAGES.includes(s)) return s;
  if (s.includes('seed')) return 'seed';
  if (s.includes('series-a') || s === 'a') return 'series-a';
  if (s.includes('series-b') || s === 'b') return 'series-b';
  if (s.includes('series-c') || s === 'c') return 'series-c';
  if (s.includes('series-d') || s === 'd') return 'series-d';
  if (s.includes('growth')) return 'growth';
  return null;
}

// POST /api/import/csv  — body: { csv: "..." }
router.post('/csv', (req, res) => {
  const { csv } = req.body;
  if (!csv) return res.status(400).json({ error: 'csv field required' });

  const rows = parseCSV(csv);
  if (!rows.length) return res.status(400).json({ error: 'No rows found in CSV' });

  const db = getDb();
  const now = new Date().toISOString();

  const findCompany = db.prepare('SELECT id FROM companies WHERE LOWER(name) = LOWER(?) LIMIT 1');
  const insertCompany = db.prepare(`
    INSERT INTO companies (id, name, sector, hq_country, fte_min, fte_max, website, linkedin_url,
      funding_stage, last_funding_date, last_funding_amount_usd, trigger_count, created_at, updated_at)
    VALUES (@id, @name, @sector, @hq_country, @fte_min, @fte_max, @website, @linkedin_url,
      @funding_stage, @last_funding_date, @last_funding_amount_usd, @trigger_count, @created_at, @updated_at)
  `);
  const updateCompany = db.prepare(`
    UPDATE companies SET sector=@sector, hq_country=@hq_country, fte_min=@fte_min, fte_max=@fte_max,
      website=@website, linkedin_url=@linkedin_url, funding_stage=@funding_stage,
      last_funding_date=@last_funding_date, last_funding_amount_usd=@last_funding_amount_usd,
      updated_at=@updated_at
    WHERE id=@id
  `);

  let created = 0, updated = 0, skipped = 0;

  const importAll = db.transaction(() => {
    for (const row of rows) {
      // Accept various column name formats
      const name = row['company_name'] || row['name'] || row['company'] || '';
      if (!name.trim()) { skipped++; continue; }

      const sector = row['sector'] || 'hospo-saas';
      const hq = (row['hq_country'] || row['country'] || 'US').toUpperCase().slice(0, 2);
      const fteMin = parseInt(row['fte_min'] || row['employees_min'] || '50', 10) || 50;
      const fteMax = parseInt(row['fte_max'] || row['employees_max'] || '500', 10) || 500;
      const website = row['website'] || row['url'] || null;
      const linkedin = row['linkedin_url'] || row['linkedin'] || null;
      const stage = normaliseStage(row['funding_stage'] || row['round'] || '');
      const fundingDate = row['funding_date'] || row['last_funding_date'] || null;
      const amountRaw = row['amount_usd'] || row['last_funding_amount_usd'] || row['funding_amount'] || null;
      const amount = amountRaw ? parseInt(amountRaw, 10) || null : null;

      const existing = findCompany.get(name.trim());
      if (existing) {
        updateCompany.run({
          id: existing.id, sector, hq_country: hq, fte_min: fteMin, fte_max: fteMax,
          website, linkedin_url: linkedin, funding_stage: stage,
          last_funding_date: fundingDate || null,
          last_funding_amount_usd: amount,
          updated_at: now,
        });
        updated++;
      } else {
        insertCompany.run({
          id: uuidv4(), name: name.trim(), sector, hq_country: hq,
          fte_min: fteMin, fte_max: fteMax, website, linkedin_url: linkedin,
          funding_stage: stage, last_funding_date: fundingDate || null,
          last_funding_amount_usd: amount, trigger_count: 0,
          created_at: now, updated_at: now,
        });
        created++;
      }
    }
  });

  importAll();

  console.log(`[import] CSV: ${created} created, ${updated} updated, ${skipped} skipped`);
  res.json({ ok: true, created, updated, skipped, total: rows.length });
});

module.exports = router;
