require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');
const { migrate } = require('./db/migrate');
const { startScheduler } = require('./scheduler');

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

// Run migrations on startup
migrate();

// Auto-seed if DB is empty (first deploy)
if (isProd) {
  const { getDb } = require('./db/client');
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as n FROM companies').get();
  if (count.n === 0) {
    console.log('[server] empty DB detected — running seed');
    require('./seed/index');
  }
}

// API Routes
app.use('/api/companies', require('./routes/companies'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/triggers', require('./routes/triggers'));
app.use('/api/outreach', require('./routes/outreach'));
app.use('/api/scraper', require('./routes/scraper'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/import', require('./routes/import'));
app.use('/api/candidates', require('./routes/candidates'));
console.log('[server] webhook routes loaded: POST /api/webhooks/clay');
app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// Serve React app in production
if (isProd) {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  startScheduler();
});
