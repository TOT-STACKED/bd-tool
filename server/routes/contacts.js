const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/client');

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { company_id, seniority, function: fn } = req.query;
  let sql = 'SELECT * FROM contacts WHERE 1=1';
  const params = [];
  if (company_id) { sql += ' AND company_id = ?'; params.push(company_id); }
  if (seniority) { sql += ' AND seniority = ?'; params.push(seniority); }
  if (fn) { sql += ' AND function = ?'; params.push(fn); }
  sql += ' ORDER BY seniority, full_name';
  res.json({ data: db.prepare(sql).all(...params) });
});

router.post('/', (req, res) => {
  const db = getDb();
  const now = new Date().toISOString();
  const contact = { id: uuidv4(), source: 'manual', ...req.body, created_at: now, updated_at: now };
  db.prepare(`
    INSERT INTO contacts (id, company_id, full_name, title, seniority, function,
      email, phone, linkedin_url, source, created_at, updated_at)
    VALUES (@id, @company_id, @full_name, @title, @seniority, @function,
      @email, @phone, @linkedin_url, @source, @created_at, @updated_at)
  `).run(contact);
  res.status(201).json({ contact: db.prepare('SELECT * FROM contacts WHERE id = ?').get(contact.id) });
});

router.patch('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const updated = { ...existing, ...req.body, updated_at: new Date().toISOString() };
  db.prepare(`
    UPDATE contacts SET full_name=@full_name, title=@title, seniority=@seniority,
      function=@function, email=@email, phone=@phone, linkedin_url=@linkedin_url,
      hubspot_contact_id=@hubspot_contact_id, updated_at=@updated_at
    WHERE id=@id
  `).run(updated);
  res.json({ contact: db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id) });
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
