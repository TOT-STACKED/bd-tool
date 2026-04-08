const { v4: uuidv4 } = require('uuid');

const stages = ['identified', 'researching', 'outreach_sent', 'in_conversation', 'proposal_sent', 'closed_won', 'closed_lost'];
const activityTypes = ['email', 'linkedin', 'call', 'meeting', 'note'];
const owners = ['Alex R.', 'Sam T.', 'Jordan K.', 'Chris F.'];

const notes = [
  'Warm intro from network — follow up after funding announcement',
  'VP Sales role live — great entry point for placement conversation',
  'New CRO in seat 3 months — likely to be building out team',
  'Series B closed — growth phase, will need CS leadership',
  'Met at SaaStr — good rapport, send capability deck',
  'Referred by previous candidate — high intent signal',
  'Director People role posted — dual opportunity (candidate + client)',
  'Reached out via LinkedIn, awaiting response',
  'Booked intro call for next week',
  'Sent proposal for retained search on VP Sales',
];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function makeOutreach(companies, contacts, triggers) {
  const records = [];
  const now = new Date().toISOString();

  // Create 20 outreach records spread across 12 companies
  const targetCompanies = companies.slice(0, 12);

  targetCompanies.forEach((co, i) => {
    const companyContacts = contacts.filter(c => c.company_id === co.id);
    const companyTriggers = triggers.filter(t => t.company_id === co.id);
    const contact = companyContacts[0] || null;
    const trigger = companyTriggers[0] || null;

    const stage = stages[i % stages.length];
    const actType = activityTypes[i % activityTypes.length];

    records.push({
      id: uuidv4(),
      company_id: co.id,
      contact_id: contact ? contact.id : null,
      stage,
      activity_type: actType,
      notes: notes[i % notes.length],
      next_action: stage === 'identified' ? 'Research stakeholders' :
        stage === 'researching' ? 'Send intro LinkedIn message' :
        stage === 'outreach_sent' ? 'Follow up if no reply by Thursday' :
        stage === 'in_conversation' ? 'Send capability deck' :
        stage === 'proposal_sent' ? 'Chase decision' : null,
      next_action_date: daysAgo(-3 + i),
      owner: owners[i % owners.length],
      trigger_id: trigger ? trigger.id : null,
      created_at: daysAgo(20 - i),
      updated_at: daysAgo(10 - Math.floor(i / 2)),
    });
  });

  return records;
}

module.exports = { makeOutreach };
