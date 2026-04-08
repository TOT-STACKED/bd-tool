/**
 * HubSpot service — syncs companies and contacts on trigger.
 * Uses HUBSPOT_API_KEY from .env for direct REST API calls.
 */

const BASE_URL = 'https://api.hubapi.com';

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.HUBSPOT_API_KEY}`,
  };
}

async function findCompanyByDomain(domain) {
  if (!process.env.HUBSPOT_API_KEY) return null;
  try {
    const res = await fetch(`${BASE_URL}/crm/v3/objects/companies/search`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        filterGroups: [{ filters: [{ propertyName: 'domain', operator: 'EQ', value: domain }] }],
        properties: ['name', 'domain', 'hs_object_id'],
      }),
    });
    const data = await res.json();
    return data.results?.[0] || null;
  } catch { return null; }
}

async function upsertCompany(company) {
  if (!process.env.HUBSPOT_API_KEY) {
    console.log('[hubspot] no API key — skipping company sync');
    return { skipped: true };
  }

  const { getDb } = require('../db/client');
  const db = getDb();
  const domain = (company.website || '').replace(/https?:\/\//, '').replace(/\/$/, '');

  try {
    const existing = await findCompanyByDomain(domain);

    const properties = {
      name: company.name,
      domain,
      numberofemployees: String(Math.round(((company.fte_min || 0) + (company.fte_max || 0)) / 2)),
      bd_sector: company.sector,
      bd_trigger_count: String(company.trigger_count || 0),
      bd_last_trigger_date: new Date().toISOString().split('T')[0],
    };

    let hsId;
    if (existing) {
      await fetch(`${BASE_URL}/crm/v3/objects/companies/${existing.id}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ properties }),
      });
      hsId = existing.id;
    } else {
      const res = await fetch(`${BASE_URL}/crm/v3/objects/companies`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ properties }),
      });
      const data = await res.json();
      hsId = data.id;
    }

    if (hsId) {
      db.prepare('UPDATE companies SET hubspot_company_id = ? WHERE id = ?').run(String(hsId), company.id);
    }

    console.log(`[hubspot] company synced: ${company.name} (hs_id: ${hsId})`);
    return { synced: true, hsId };
  } catch (err) {
    console.error('[hubspot] company sync error:', err.message);
    return { synced: false, error: err.message };
  }
}

async function upsertContact(contact, company) {
  if (!process.env.HUBSPOT_API_KEY) {
    console.log('[hubspot] no API key — skipping contact sync');
    return { skipped: true };
  }

  if (!contact?.email) return { skipped: true, reason: 'no email' };

  try {
    const properties = {
      firstname: contact.full_name?.split(' ')[0] || '',
      lastname: contact.full_name?.split(' ').slice(1).join(' ') || '',
      email: contact.email,
      jobtitle: contact.title,
      bd_seniority: contact.seniority,
      bd_function: contact.function,
      bd_source: contact.source || 'bd-tool',
    };

    const res = await fetch(`${BASE_URL}/crm/v3/objects/contacts`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ properties }),
    });
    const data = await res.json();
    const hsId = data.id;

    if (hsId && company?.hubspot_company_id) {
      await fetch(`${BASE_URL}/crm/v4/associations/contacts/companies/batch/create`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          inputs: [{ from: { id: String(hsId) }, to: { id: company.hubspot_company_id }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 1 }] }]
        }),
      });
    }

    console.log(`[hubspot] contact synced: ${contact.full_name}`);
    return { synced: true, hsId };
  } catch (err) {
    console.error('[hubspot] contact sync error:', err.message);
    return { synced: false, error: err.message };
  }
}

module.exports = { upsertCompany, upsertContact };
