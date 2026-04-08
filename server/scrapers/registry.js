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

function status() {
  return scrapers.map(s => ({
    name: s.name,
    description: s.description,
    schedule: s.schedule,
    last_run: jobResults.get(`${s.name}_last_run`) || null,
    last_count: jobResults.get(`${s.name}_last_count`) ?? null,
  }));
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
    const toRun = scraperName === 'all' ? scrapers : [scraper];
    let totalCount = 0;

    for (const s of toRun) {
      const results = await s.run();
      const count = results?.length || 0;
      totalCount += count;
      const now = new Date().toISOString();
      jobResults.set(`${s.name}_last_run`, now);
      jobResults.set(`${s.name}_last_count`, count);
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
