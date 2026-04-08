const { getDb } = require('../db/client');
const { sendAlert } = require('./slack.service');
const { upsertCompany, upsertContact } = require('./hubspot.service');

async function fireTrigger(trigger, company) {
  const db = getDb();

  // Send Slack alert
  const slackResult = await sendAlert(trigger, company);
  if (slackResult.sent) {
    db.prepare('UPDATE triggers SET slack_sent = 1 WHERE id = ?').run(trigger.id);
  }

  // Sync company to HubSpot
  const hsResult = await upsertCompany(company);

  // For new_hire triggers, also sync the new contact
  if (trigger.type === 'new_hire' && trigger.detail) {
    const detail = typeof trigger.detail === 'string' ? JSON.parse(trigger.detail) : trigger.detail;
    if (detail.person_name) {
      const syntheticContact = {
        full_name: detail.person_name,
        title: detail.new_title,
        seniority: detail.seniority,
        email: null,
        source: 'trigger',
      };
      await upsertContact(syntheticContact, { ...company, hubspot_company_id: hsResult.hsId || company.hubspot_company_id });
    }
  }

  if (hsResult.synced || hsResult.skipped) {
    db.prepare('UPDATE triggers SET hubspot_synced = 1 WHERE id = ?').run(trigger.id);
  }
}

module.exports = { fireTrigger };
