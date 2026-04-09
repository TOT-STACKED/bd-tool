const { getDb } = require('../db/client');
const mockScraper = require('./mock.scraper');
const techcrunchScraper = require('./techcrunch.scraper');
const crunchbaseScraper = require('./crunchbase.scraper');
const linkedinJobsScraper = require('./linkedin-jobs.scraper');
const googleNewsScraper = require('./google-news.scraper');

const scrapers = [
  mockScraper,
  techcrunchScraper,
  crunchbaseScraper,
  linkedinJobsScraper,
  googleNewsScraper,
];

const jobResults = new Map();

// Persist scraper run state to SQLite so it survives restarts
function persistRun(scraperName, count, error = null) {
  try {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO scraper_runs (scraper, last_run, last_count, last_error, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(scraper) DO UPDATE SET
        last_run=excluded.last_run,
        last_count=excluded.last_count,
        last_error=excluded.last_error,
        updated_at=excluded.updated_at
    `).run(scraperName, now, count, error, now);
  } catch (err) {
    console.warn('[registry] failed to persist run state:', err.message);
  }
}

function getPersistedRuns() {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM scraper_runs').all();
    return Object.fromEntries(rows.map(r => [r.scraper, r]));
  } catch {
    return {};
  }
}

function status() {
  const persisted = getPersistedRuns();
  return scrapers
    .filter(s => s.name !== 'mock')
    .map(s => {
      const p = persisted[s.name] || {};
      return {
        name: s.name,
        description: s.description,
        schedule: s.schedule,
        last_run: p.last_run || null,
        last_count: p.last_count ?? null,
        last_error: p.last_error || null,
      };
    });
}

async function run(scraperName, jobId) {
  const scraper = scraperName === 'all'
    ? null
    : scrapers.find(s => s.name === scraperName);

  if (scraperName !== 'all' && !scraper) {
    jobResults.set(jobId, { status: 'error', error: `Unknown scraper: ${scraperName}` });
    return;
  }

  jobResults.set(jobId, { status: 'running', scraper: scraperName });

  try {
    const toRun = scraperName === 'all'
      ? scrapers.filter(s => s.name !== 'mock')
      : [scraper];

    let totalCount = 0;

    for (const s of toRun) {
      try {
        const results = await s.run();
        const count = results?.length || 0;
        totalCount += count;
        persistRun(s.name, count);
      } catch (err) {
        console.error(`[registry] ${s.name} error:`, err.message);
        persistRun(s.name, 0, err.message);
      }
    }

    jobResults.set(jobId, { status: 'done', results_count: totalCount });
  } catch (err) {
    console.error('[registry] run error:', err);
    jobResults.set(jobId, { status: 'error', error: err.message });
  }
}

function getJobResult(jobId) {
  return jobResults.get(jobId) || null;
}

module.exports = { status, run, getJobResult };
