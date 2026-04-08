/**
 * Slack service — sends trigger alerts to #stacked-bd-recruit.
 * Uses Slack Web API (chat.postMessage) with SLACK_BOT_TOKEN + SLACK_CHANNEL_ID.
 * Falls back to SLACK_WEBHOOK_URL if bot token not set.
 */

const CHANNEL_ID = process.env.SLACK_CHANNEL_ID || 'C0AR2N4LZ5M'; // #stacked-bd-recruit

const TRIGGER_EMOJI = { funding: '💰', job_posting: '📋', new_hire: '🤝' };
const TRIGGER_LABEL = { funding: 'Funding Round', job_posting: 'Job Posting', new_hire: 'New Hire' };

function buildText(trigger, company) {
  const emoji = TRIGGER_EMOJI[trigger.type] || '🔔';
  const label = TRIGGER_LABEL[trigger.type] || trigger.type;
  const detail = trigger.detail ? JSON.parse(trigger.detail) : {};

  let text = `${emoji} *BD Trigger — ${label}*\n`;
  text += `*Company:* ${company.name} (${company.sector}, ${company.fte_min}–${company.fte_max} FTE)\n`;
  text += `*Signal:* ${trigger.title}\n`;

  if (trigger.type === 'funding' && detail.round) {
    text += `*Round:* ${detail.round} · $${((detail.amount_usd || 0) / 1e6).toFixed(0)}M\n`;
    if (detail.investors?.length) text += `*Investors:* ${detail.investors.join(', ')}\n`;
  }
  if (trigger.type === 'new_hire' && detail.person_name) {
    text += `*Person:* ${detail.person_name} — ${detail.new_title}\n`;
  }
  if (trigger.type === 'job_posting' && detail.role_title) {
    text += `*Role:* ${detail.role_title}\n`;
  }

  if (trigger.source_url) text += `*Source:* ${trigger.source_url}\n`;
  text += `\n_Log outreach → http://localhost:5173/companies/${company.id}?tab=pipeline_`;

  return text;
}

async function sendAlert(trigger, company) {
  const text = buildText(trigger, company);

  // Primary: Slack Web API with bot token
  if (process.env.SLACK_BOT_TOKEN) {
    try {
      const res = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
        },
        body: JSON.stringify({ channel: CHANNEL_ID, text, unfurl_links: false }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      console.log(`[slack] alert sent to #stacked-bd-recruit for trigger ${trigger.id}`);
      return { sent: true };
    } catch (err) {
      console.error('[slack] bot token error:', err.message);
      return { sent: false, error: err.message };
    }
  }

  // Fallback: Incoming Webhook
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      const res = await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`Slack returned ${res.status}`);
      console.log(`[slack] alert sent via webhook for trigger ${trigger.id}`);
      return { sent: true };
    } catch (err) {
      console.error('[slack] webhook error:', err.message);
      return { sent: false, error: err.message };
    }
  }

  console.log('[slack] no SLACK_BOT_TOKEN or SLACK_WEBHOOK_URL — skipping alert');
  return { skipped: true };
}

module.exports = { sendAlert };
