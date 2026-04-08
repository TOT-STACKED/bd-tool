const { v4: uuidv4 } = require('uuid');

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function makeTriggers(companies) {
  const triggers = [];
  const now = new Date().toISOString();

  const fundingTitles = [
    (co, amt, round) => `${co.name} raised $${(amt / 1e6).toFixed(0)}M ${round}`,
  ];
  const jobTitles = [
    'VP of Sales', 'VP Customer Success', 'Director of Sales', 'Head of People',
    'Director of Customer Success', 'VP People', 'Head of Sales', 'Chief Revenue Officer',
    'Director of Talent Acquisition', 'Head of Revenue'
  ];
  const hireTitles = [
    { title: 'Chief Revenue Officer', seniority: 'c-suite' },
    { title: 'VP of Sales', seniority: 'vp' },
    { title: 'Director of Customer Success', seniority: 'director' },
    { title: 'Head of People', seniority: 'head' },
    { title: 'VP People', seniority: 'vp' },
    { title: 'Chief Commercial Officer', seniority: 'c-suite' },
    { title: 'Director of Sales', seniority: 'director' },
    { title: 'Head of Customer Success', seniority: 'head' },
  ];
  const rounds = ['Series A', 'Series B', 'Series C'];
  const investors = [
    ['Andreessen Horowitz', 'Sequoia Capital'],
    ['Bessemer Venture Partners', 'Accel'],
    ['Tiger Global', 'Coatue Management'],
    ['General Catalyst', 'Insight Partners'],
  ];

  const firstNames = ['Marcus', 'Priya', 'Jordan', 'Elena', 'Connor', 'Aisha', 'Derek', 'Valentina', 'Sean', 'Fatima'];
  const lastNames = ['Rivera', 'Patel', 'Brooks', 'Kimura', 'O\'Brien', 'Hassan', 'Chang', 'Russo', 'Okafor', 'Mueller'];

  let nameIdx = 0;
  let dayOffset = 0;

  for (const co of companies) {
    const triggerCount = co.trigger_count || 2;

    for (let i = 0; i < triggerCount; i++) {
      dayOffset = Math.floor(Math.random() * 30);
      const detectedAt = daysAgo(dayOffset);
      const type = i === 0 && co.last_funding_date ? 'funding'
        : i % 3 === 1 ? 'new_hire'
        : 'job_posting';

      if (type === 'funding') {
        const round = co.funding_stage === 'series-c' ? 'Series C'
          : co.funding_stage === 'series-b' ? 'Series B' : 'Series A';
        const amt = co.last_funding_amount_usd || 10000000;
        const inv = investors[Math.floor(Math.random() * investors.length)];
        triggers.push({
          id: uuidv4(),
          company_id: co.id,
          type: 'funding',
          title: `${co.name} raised $${(amt / 1e6).toFixed(0)}M ${round}`,
          detail: JSON.stringify({ amount_usd: amt, round, investors: inv, announcement_url: co.website }),
          source_url: `https://techcrunch.com/2025/01/01/${co.name.toLowerCase().replace(/\s+/g, '-')}-raises`,
          detected_at: detectedAt,
          slack_sent: 0,
          hubspot_synced: 0,
          created_at: now,
        });
      } else if (type === 'new_hire') {
        const hire = hireTitles[nameIdx % hireTitles.length];
        const first = firstNames[nameIdx % firstNames.length];
        const last = lastNames[nameIdx % lastNames.length];
        nameIdx++;
        triggers.push({
          id: uuidv4(),
          company_id: co.id,
          type: 'new_hire',
          title: `${co.name} hired new ${hire.title}`,
          detail: JSON.stringify({
            person_name: `${first} ${last}`,
            new_title: hire.title,
            seniority: hire.seniority,
            linkedin_url: `https://linkedin.com/in/${first.toLowerCase()}-${last.toLowerCase()}`,
            start_date: detectedAt,
          }),
          source_url: `https://linkedin.com/in/${first.toLowerCase()}-${last.toLowerCase()}`,
          detected_at: detectedAt,
          slack_sent: 0,
          hubspot_synced: 0,
          created_at: now,
        });
      } else {
        const role = jobTitles[i % jobTitles.length];
        triggers.push({
          id: uuidv4(),
          company_id: co.id,
          type: 'job_posting',
          title: `${co.name} posted ${role} role`,
          detail: JSON.stringify({
            role_title: role,
            seniority: role.startsWith('VP') ? 'vp' : role.startsWith('Director') ? 'director' : role.startsWith('Head') ? 'head' : 'c-suite',
            job_url: `${co.website}/careers`,
            posted_date: detectedAt,
          }),
          source_url: `${co.website}/careers`,
          detected_at: detectedAt,
          slack_sent: 0,
          hubspot_synced: 0,
          created_at: now,
        });
      }
    }
  }

  return triggers;
}

module.exports = { makeTriggers };
