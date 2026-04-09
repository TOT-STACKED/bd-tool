const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/client');

const router = express.Router();

// GET /api/candidates
router.get('/', (req, res) => {
  const db = getDb();
  const { search, seniority, function: fn, status, current_company } = req.query;

  let sql = 'SELECT * FROM candidates WHERE 1=1';
  const params = [];

  if (search) {
    sql += ' AND (full_name LIKE ? OR current_company LIKE ? OR title LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (seniority) { sql += ' AND seniority = ?'; params.push(seniority); }
  if (fn) { sql += ' AND function = ?'; params.push(fn); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (current_company) { sql += ' AND LOWER(current_company) LIKE LOWER(?)'; params.push(`%${current_company}%`); }

  sql += ' ORDER BY seniority, full_name';
  const data = db.prepare(sql).all(...params);
  res.json({ data, total: data.length });
});

// GET /api/candidates/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id);
  if (!candidate) return res.status(404).json({ error: 'Not found' });
  res.json({ candidate });
});

// POST /api/candidates
router.post('/', (req, res) => {
  const db = getDb();
  const now = new Date().toISOString();
  const candidate = { id: uuidv4(), source: 'manual', status: 'available', ...req.body, created_at: now, updated_at: now };
  db.prepare(`
    INSERT INTO candidates (id, full_name, first_name, last_name, title, current_company,
      seniority, function, email, phone, linkedin_url, location, status, notes, source,
      placed_at_company_id, created_at, updated_at)
    VALUES (@id, @full_name, @first_name, @last_name, @title, @current_company,
      @seniority, @function, @email, @phone, @linkedin_url, @location, @status, @notes, @source,
      @placed_at_company_id, @created_at, @updated_at)
  `).run({ placed_at_company_id: null, notes: null, ...candidate });
  res.status(201).json({ candidate: db.prepare('SELECT * FROM candidates WHERE id = ?').get(candidate.id) });
});

// PATCH /api/candidates/:id
router.patch('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const updated = { ...existing, ...req.body, updated_at: new Date().toISOString() };
  db.prepare(`
    UPDATE candidates SET full_name=@full_name, first_name=@first_name, last_name=@last_name,
      title=@title, current_company=@current_company, seniority=@seniority, function=@function,
      email=@email, phone=@phone, linkedin_url=@linkedin_url, location=@location,
      status=@status, notes=@notes, placed_at_company_id=@placed_at_company_id, updated_at=@updated_at
    WHERE id=@id
  `).run(updated);
  res.json({ candidate: db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id) });
});

// DELETE /api/candidates/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM candidates WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
