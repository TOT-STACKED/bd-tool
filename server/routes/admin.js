const express = require('express');
const { getDb } = require('../db/client');

const router = express.Router();

// POST /api/admin/reset — wipe all data (requires ADMIN_SECRET header)
router.post('/reset', (req, res) => {
  const secret = process.env.ADMIN_SECRET;
  if (secret) {
    const provided = req.headers['x-admin-secret'];
    if (!provided || provided !== secret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const db = getDb();
  db.exec('DELETE FROM outreach');
  db.exec('DELETE FROM triggers');
  db.exec('DELETE FROM contacts');
  db.exec('DELETE FROM companies');

  console.log('[admin] all tables cleared');
  res.json({ ok: true, message: 'All data cleared' });
});

module.exports = router;
