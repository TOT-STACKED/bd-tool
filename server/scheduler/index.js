const cron = require('node-cron');
const registry = require('../scrapers/registry');

let scheduledTasks = [];

function schedule(cronExpr, scraperName) {
  const task = cron.schedule(cronExpr, async () => {
    console.log(`[scheduler] running ${scraperName}`);
    const jobId = `scheduled_${scraperName}_${Date.now()}`;
    await registry.run(scraperName, jobId).catch(err =>
      console.error(`[scheduler] ${scraperName} error:`, err)
    );
  });
  scheduledTasks.push(task);
}

function startScheduler() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    // Mock scraper only in dev — every 5 minutes
    schedule('*/5 * * * *', 'mock');
    console.log('[scheduler] mock scraper scheduled (dev)');
  }

  // Real scrapers — run in production and dev
  schedule('0 */2 * * *', 'techcrunch');    // every 2 hours
  schedule('0 7 * * *', 'crunchbase');      // daily 7am
  schedule('0 8 * * *', 'linkedin-jobs');   // daily 8am
  schedule('0 9 * * *', 'google-news');     // daily 9am

  console.log('[scheduler] real scrapers scheduled (techcrunch, crunchbase, linkedin-jobs, google-news)');
}

function stopScheduler() {
  scheduledTasks.forEach(t => t.stop());
  scheduledTasks = [];
}

module.exports = { startScheduler, stopScheduler };
