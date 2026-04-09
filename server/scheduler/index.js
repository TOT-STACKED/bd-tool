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
    schedule('*/5 * * * *', 'mock');
    console.log('[scheduler] mock scraper scheduled (dev)');
  }

  // Real scrapers on schedule
  schedule('0 */4 * * *', 'techcrunch');    // every 4 hours
  schedule('0 7 * * *', 'crunchbase');      // daily 7am
  schedule('0 8 * * *', 'linkedin-jobs');   // daily 8am
  schedule('0 9 * * *', 'google-news');     // daily 9am

  console.log('[scheduler] real scrapers scheduled (funding, crunchbase, jobs, google-news)');

  // Startup scrape disabled — run manually from Settings when needed
}

function stopScheduler() {
  scheduledTasks.forEach(t => t.stop());
  scheduledTasks = [];
}

module.exports = { startScheduler, stopScheduler };
