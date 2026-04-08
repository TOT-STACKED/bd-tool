const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/client');

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { company_id, stage, owner } = req.query;
  let sql = `
    SELECT o.*, c.name as company_name, c.sector as company_sector,
           ct.full_name as contact_name, ct.title as contact_title
    FROM outreach o
    JOIN companies c ON c.id = o.company_id
    LEFT JOIN contacts ct ON ct.id = o.contact_id
    WHERE 1=1
  `;
  const params = [];
  if (company_id) { sql += ' AND o.company_id = ?'; params.push(company_id); }
  if (stage) { sql += ' AND o.stage = ?'; params.push(stage); }
  if (owner) { sql += ' AND o.owner = ?'; params.push(owner); }
  sql += ' ORDER BY o.updated_at DESC';
  res.json({ data: db.prepare(sql).all(...params) });
});

router.post('/', (req, res) => {
  const db = getDb();
  const now = new Date().toISOString();
  const record = { id: uuidv4(), stage: 'identified', ...req.body, created_at: now, updated_at: now };
  db.prepare(`
    INSERT INTO outreach (id, company_id, contact_id, stage, activity_type,
      notes, next_action, next_action_date, owner, trigger_id, created_at, updated_at)
    VALUES (@id, @company_id, @contact_id, @stage, @activity_type,
      @notes, @next_action, @next_action_date, @owner, @trigger_id, @created_at, @updated_at)
  `).run({ contact_id: null, activity_type: null, notes: null, next_action: null,
           next_action_date: null, owner: null, trigger_id: null, ...record });
  res.status(201).json({ record: db.prepare('SELECT * FROM outreach WHERE id = ?').get(record.id) });
});

router.patch('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM outreach WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const updated = { ...existing, ...req.body, updated_at: new Date().toISOString() };
  db.prepare(`
    UPDATE outreach SET stage=@stage, activity_type=@activity_type, notes=@notes,
      next_action=@next_action, next_action_date=@next_action_date, owner=@owner, updated_at=@updated_at
    WHERE id=@id
  `).run(updated);
  res.json({ record: db.prepare('SELECT * FROM outreach WHERE id = ?').get(req.params.id) });
});

module.exports = router;
