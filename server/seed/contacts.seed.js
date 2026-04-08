const { v4: uuidv4 } = require('uuid');

const now = new Date().toISOString();

function makeContacts(companies) {
  const contacts = [];

  const templates = [
    // c-suite
    { seniority: 'c-suite', function: 'sales', titles: ['Chief Revenue Officer', 'CEO', 'Co-Founder & CEO', 'Chief Commercial Officer', 'Chief Operating Officer'] },
    { seniority: 'c-suite', function: 'people', titles: ['Chief People Officer', 'Chief HR Officer'] },
    // vp
    { seniority: 'vp', function: 'sales', titles: ['VP of Sales', 'VP Sales', 'VP, Enterprise Sales', 'VP Revenue'] },
    { seniority: 'vp', function: 'cs', titles: ['VP Customer Success', 'VP Client Services', 'VP of CS'] },
    { seniority: 'vp', function: 'people', titles: ['VP People', 'VP of Talent', 'VP Human Resources'] },
    // director
    { seniority: 'director', function: 'sales', titles: ['Director of Sales', 'Director, Mid-Market Sales', 'Director of Enterprise Sales'] },
    { seniority: 'director', function: 'cs', titles: ['Director of Customer Success', 'Director Client Outcomes'] },
    { seniority: 'director', function: 'people', titles: ['Director of People', 'Director of Talent Acquisition', 'Director of HR'] },
    // head
    { seniority: 'head', function: 'sales', titles: ['Head of Sales', 'Head of Revenue', 'Head of Growth'] },
    { seniority: 'head', function: 'cs', titles: ['Head of Customer Success', 'Head of Client Success'] },
    { seniority: 'head', function: 'people', titles: ['Head of People', 'Head of Talent', 'Head of HR'] },
  ];

  const firstNames = ['James', 'Sarah', 'Michael', 'Emma', 'David', 'Olivia', 'Chris', 'Jessica', 'Ryan', 'Amanda',
    'Tyler', 'Lauren', 'Brandon', 'Rachel', 'Kevin', 'Megan', 'Justin', 'Brittany', 'Alex', 'Stephanie',
    'Nathan', 'Ashley', 'Andrew', 'Nicole', 'Daniel', 'Samantha', 'Matthew', 'Emily', 'Joshua', 'Hannah'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Moore',
    'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Young', 'Allen',
    'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson'];

  let nameIdx = 0;
  for (const company of companies) {
    // Pick 4–5 contacts per company across seniority tiers
    const picks = [
      templates[Math.floor(Math.random() * 2)],      // c-suite
      templates[2 + Math.floor(Math.random() * 3)],  // vp
      templates[5 + Math.floor(Math.random() * 3)],  // director
      templates[8 + Math.floor(Math.random() * 3)],  // head
    ];

    for (const tmpl of picks) {
      const first = firstNames[nameIdx % firstNames.length];
      const last = lastNames[nameIdx % lastNames.length];
      const title = tmpl.titles[nameIdx % tmpl.titles.length];
      const emailDomain = (company.website || 'company.com').replace('https://', '');
      nameIdx++;

      contacts.push({
        id: uuidv4(),
        company_id: company.id,
        full_name: `${first} ${last}`,
        title,
        seniority: tmpl.seniority,
        function: tmpl.function,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@${emailDomain}`,
        phone: null,
        linkedin_url: `https://linkedin.com/in/${first.toLowerCase()}-${last.toLowerCase()}-${Math.floor(Math.random() * 9000) + 1000}`,
        hubspot_contact_id: null,
        source: 'seed',
        created_at: now,
        updated_at: now,
      });
    }
  }

  return contacts;
}

module.exports = { makeContacts };
