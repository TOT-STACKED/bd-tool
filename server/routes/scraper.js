const express = require('express');
const registry = require('../scrapers/registry');

const router = express.Router();

router.get('/status', (req, res) => {
  res.json({ scrapers: registry.status() });
});

router.post('/run', async (req, res) => {
  const { scraper = 'mock' } = req.body;
  const jobId = `job_${Date.now()}`;

  // Run async, don't block
  registry.run(scraper, jobId).catch(err => console.error('[scraper] run error:', err));

  res.json({ jobId, status: 'started', scraper });
});

router.get('/run/:jobId', (req, res) => {
  const result = registry.getJobResult(req.params.jobId);
  if (!result) return res.status(404).json({ error: 'Job not found' });
  res.json(result);
});

module.exports = router;
