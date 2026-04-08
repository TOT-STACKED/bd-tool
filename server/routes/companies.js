const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/client');

const router = express.Router();

// DELETE /api/companies/all — wipe all data
router.delete('/all', (req, res) => {
  const db = getDb();
  db.exec('DELETE FROM outreach');
  db.exec('DELETE FROM triggers');
  db.exec('DELETE FROM contacts');
  db.exec('DELETE FROM companies');
  console.log('[companies] all data wiped');
  res.json({ ok: true });
});

router.get('/', (req, res) => {
  const db = getDb();
  const { sector, fte_min, fte_max, trigger_type, search, sort = 'trigger_count' } = req.query;

  let sql = 'SELECT * FROM companies WHERE 1=1';
  const params = [];

  if (sector) { sql += ' AND sector = ?'; params.push(sector); }
  if (fte_min) { sql += ' AND fte_max >= ?'; params.push(Number(fte_min)); }
  if (fte_max) { sql += ' AND fte_min <= ?'; params.push(Number(fte_max)); }
  if (search) { sql += ' AND name LIKE ?'; params.push(`%${search}%`); }

  if (trigger_type) {
    sql += ' AND id IN (SELECT DISTINCT company_id FROM triggers WHERE type = ?)';
    params.push(trigger_type);
  }

  const allowedSorts = { trigger_count: 'trigger_count DESC', name: 'name ASC', last_funding_date: 'last_funding_date DESC' };
  sql += ` ORDER BY ${allowedSorts[sort] || 'trigger_count DESC'}`;

  const data = db.prepare(sql).all(...params);
  res.json({ data, total: data.length });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
  if (!company) return res.status(404).json({ error: 'Not found' });

  const contacts = db.prepare('SELECT * FROM contacts WHERE company_id = ? ORDER BY seniority').all(req.params.id);
  const triggers = db.prepare('SELECT * FROM triggers WHERE company_id = ? ORDER BY detected_at DESC').all(req.params.id);
  const outreach = db.prepare('SELECT * FROM outreach WHERE company_id = ? ORDER BY created_at DESC').all(req.params.id);

  res.json({ company, contacts, triggers, outreach });
});

router.post('/', (req, res) => {
  const db = getDb();
  const now = new Date().toISOString();
  const company = { id: uuidv4(), ...req.body, trigger_count: 0, created_at: now, updated_at: now };

  db.prepare(`
    INSERT INTO companies (id, name, sector, hq_country, fte_min, fte_max, website, linkedin_url,
      funding_stage, last_funding_date, last_funding_amount_usd, trigger_count, created_at, updated_at)
    VALUES (@id, @name, @sector, @hq_country, @fte_min, @fte_max, @website, @linkedin_url,
      @funding_stage, @last_funding_date, @last_funding_amount_usd, @trigger_count, @created_at, @updated_at)
  `).run(company);

  res.status(201).json({ company: db.prepare('SELECT * FROM companies WHERE id = ?').get(company.id) });
});

router.patch('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const updated = { ...existing, ...req.body, updated_at: new Date().toISOString() };
  db.prepare(`
    UPDATE companies SET name=@name, sector=@sector, hq_country=@hq_country, fte_min=@fte_min,
      fte_max=@fte_max, website=@website, linkedin_url=@linkedin_url, funding_stage=@funding_stage,
      last_funding_date=@last_funding_date, last_funding_amount_usd=@last_funding_amount_usd,
      hubspot_company_id=@hubspot_company_id, trigger_count=@trigger_count, updated_at=@updated_at
    WHERE id=@id
  `).run(updated);

  res.json({ company: db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id) });
});

module.exports = router;
