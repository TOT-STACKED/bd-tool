const cron = require('node-cron');
const registry = require('../scrapers/registry');

let scheduledTasks = [];

function startScheduler() {
  // Only run mock scraper in dev (every 5 min)
  if (process.env.NODE_ENV === 'development') {
    const task = cron.schedule('*/5 * * * *', async () => {
      console.log('[scheduler] running mock scraper');
      const jobId = `scheduled_${Date.now()}`;
      await registry.run('mock', jobId).catch(err => console.error('[scheduler] error:', err));
    });
    scheduledTasks.push(task);
    console.log('[scheduler] mock scraper scheduled every 5 minutes');
  }
}

function stopScheduler() {
  scheduledTasks.forEach(t => t.stop());
  scheduledTasks = [];
}

module.exports = { startScheduler, stopScheduler };
