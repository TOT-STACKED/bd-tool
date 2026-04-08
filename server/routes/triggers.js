const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/client');
const { fireTrigger } = require('../services/trigger.service');

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { company_id, type, since, limit = '50' } = req.query;
  let sql = `
    SELECT t.*, c.name as company_name, c.sector as company_sector
    FROM triggers t
    JOIN companies c ON c.id = t.company_id
    WHERE 1=1
  `;
  const params = [];
  if (company_id) { sql += ' AND t.company_id = ?'; params.push(company_id); }
  if (type) { sql += ' AND t.type = ?'; params.push(type); }
  if (since) { sql += ' AND t.detected_at >= ?'; params.push(since); }
  sql += ' ORDER BY t.detected_at DESC LIMIT ?';
  params.push(Number(limit));
  res.json({ data: db.prepare(sql).all(...params) });
});

router.post('/', async (req, res) => {
  const db = getDb();
  const now = new Date().toISOString();
  const trigger = {
    id: uuidv4(),
    detected_at: now,
    slack_sent: 0,
    hubspot_synced: 0,
    created_at: now,
    source_url: null,
    ...req.body,
    detail: req.body.detail ? JSON.stringify(req.body.detail) : null,
  };

  db.prepare(`
    INSERT INTO triggers (id, company_id, type, title, detail, source_url,
      detected_at, slack_sent, hubspot_synced, created_at)
    VALUES (@id, @company_id, @type, @title, @detail, @source_url,
      @detected_at, @slack_sent, @hubspot_synced, @created_at)
  `).run(trigger);

  // Update trigger_count on company
  db.prepare('UPDATE companies SET trigger_count = trigger_count + 1, updated_at = ? WHERE id = ?')
    .run(now, trigger.company_id);

  const inserted = db.prepare('SELECT * FROM triggers WHERE id = ?').get(trigger.id);
  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(trigger.company_id);

  // Fire async side effects (Slack + HubSpot) — don't await, don't block response
  fireTrigger(inserted, company).catch(err => console.error('[trigger] side-effect error:', err));

  res.status(201).json({ trigger: inserted });
});

router.patch('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM triggers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const updated = { ...existing, ...req.body };
  db.prepare('UPDATE triggers SET slack_sent=@slack_sent, hubspot_synced=@hubspot_synced WHERE id=@id').run(updated);
  res.json({ trigger: db.prepare('SELECT * FROM triggers WHERE id = ?').get(req.params.id) });
});

module.exports = router;
