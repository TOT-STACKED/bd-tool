const { v4: uuidv4 } = require('uuid');

const now = new Date().toISOString();

const companies = [
  // ── Hospo SaaS (12) ──────────────────────────────────────────────────────
  {
    id: uuidv4(), name: 'TableTurn', sector: 'hospo-saas', hq_country: 'US',
    fte_min: 80, fte_max: 120, website: 'https://tableturn.io',
    linkedin_url: 'https://linkedin.com/company/tableturn',
    funding_stage: 'series-b', last_funding_date: '2024-11-12',
    last_funding_amount_usd: 22000000, trigger_count: 3, created_at: now, updated_at: now
  },
  {
    id: uuidv4(), name: 'MenuIQ', sector: 'hospo-saas', hq_country: 'US',
    fte_min: 55, fte_max: 80, website: 'https://menuiq.com',
    linkedin_url: 'https://linkedin.com/company/menuiq',
    funding_stage: 'series-a', last_funding_date: '2024-09-03',
    last_funding_amount_usd: 9500000, trigger_count: 2, created_at: now, updated_at: now
  },
  {
    id: uuidv4(), name: 'Plated OS', sector: 'hospo-saas', hq_country: 'US',
    fte_min: 150, fte_max: 220, website: 'https://platednos.com',
    linkedin_url: 'https://linkedin.com/company/platednos',
    funding_stage: 'series-c', last_funding_date: '2025-01-20',
    last_funding_amount_usd: 45000000, trigger_count: 5, created_at: now, updated_at: now
  },
  {
    id: uuidv4(), name: 'GuestHQ', sector: 'hospo-saas', hq_country: 'US',
    fte_min: 60, fte_max: 90, website: 'https://guesthq.io',
    linkedin_url: 'https://linkedin.com/company/guesthq',
    funding_stage: 'series-a', last_funding_date: '2024-06-18',
    last_funding_amount_usd: 7000000, trigger_count: 1, created_at: now, updated_at: now
  },
  {
    id: uuidv4(), name: 'FoodFlow Systems', sector: 'hospo-saas', hq_country: 'US',
    fte_min: 100, fte_max: 160, website: 'https://foodflowsystems.com',
    linkedin_url: 'https://linkedin.com/company/foodflowsystems',
    funding_stage: 'series-b', last_funding_date: '2024-08-30',
    last_funding_amount_usd: 18000000, trigger_count: 4, created_at: now, updated_at: now
  },
  {
    id: uuidv4(), name: 'Resy Ops', sector: 'hospo-saas', hq_country: 'US',
    fte_min: 200, fte_max: 300, website: 'https://resyops.com',
    linkedin_url: 'https://linkedin.com/company/resyops',
    funding_stage: 'series-c', last_funding_date: '2024-12-05',
    last_funding_amount_usd: 38000000, trigger_count: 6, created_at: now, updated_at: now
  },
  {
    id: uuidv4(), name: 'LoyalBite', sector: 'hospo-saas', hq_country: 'US',
    fte_min: 70, fte_max: 110, website: 'https://loyalbite.io',
    linkedin_url: 'https://linkedin.com/company/loyalbite',
    funding_stage: 'series-a', last_funding_date: '2024-07-22',
    last_funding_amount_usd: 11000000, trigger_count: 2, created_at: now, updated_at: now
  },
  {
    id: uuidv4(), name: 'KitchenSync', sector: 'hospo-saas', hq_country: 'US',
    fte_min: 85, fte_max: 130, website: 'https://kitchensync.ai',
    linkedin_url: 'https://linkedin.com/company/kitchensync-ai',
    funding_stage: 'series-b', last_funding_date: '2025-02-14',
    last_funding_amount_usd: 25000000, trigger_count: 3, created_at: now, updated_at: now
  },
  {
    id: uuidv4(), name: 'BarBack Technology', sector: 'hospo-saas', hq_country: 'US',
    fte_min: 50, fte_max: 75, website: 'https://barback.tech',
    linkedin_url: 'https://linkedin.com/company/barback-technology',
    funding_stage: 'seed', last_funding_date: '2024-04-10',
    last_funding_amount_usd: 3500000, trigger_count: 1, created_at: now, updated_at: now
  },
  {
    id: uuidv4(), name: 'HospoCloud', sector: 'hospo-saas', hq_country: 'US',
    fte_min: 120, fte_max: 180, website: 'https://hospocloud.com',
    linkedin_url: 'https://linkedin.com/company/hospocloud',
    funding_stage: 'series-b', last_funding_date: '2024-10-08',
    last_funding_amount_usd: 20000000, trigger_count: 4, created_at: now, updated_at: now
  },
  {
    id: uuidv4(), name: 'VenueStack', sector: 'hospo-saas', hq_country: 'US',
    fte_min: 90, fte_max: 140, website: 'https://venuestack.io',
    linkedin_url: 'https://linkedin.com/company/venuestack',
    funding_stage: 'series-a', last_funding_date: '2024-05-19',
    last_funding_amount_usd: 8500000, trigger_count: 2, created_at: now, updated_at: now
  },
  {
    id: uuidv4(), name: 'DineData', sector: 'hospo-saas', hq_country: 'US',
    fte_min: 60, fte_max: 95, website: 'https://dinedata.co',
    linkedin_url: 'https://linkedin.com/company/dinedata',
    funding_stage: 'series-a', last_funding_date: '2024-03-28',
    last_funding_amount_usd: 6000000, trigger_count: 1, created_at: now, updated_at: now
  },

  // ── Payments (13) ────────────────────────────────────────────────────────
  {
    id: uuidv4(), name: 'Paybridge', sector: 'payments', hq_country: 'US',
    fte_min: 180, fte_max: 260, website: 'https://paybridge.com',
    linkedin_url: 'https://linkedin.com/company/paybridge',
    funding_stage: 'series-c', last_funding_date: '2025-01-08',
    last_funding_amount_usd: 52000000, trigger_count: 7, created_at: now, updated_at: now
  },
  {
    id: uuidv4(), name: 'Ledgr', sector: 'payments', hq_country: 'US',
    fte_min: 100, fte_max: 150, website: 'https://ledgr.io',
    linkedin_url: 'https://linkedin.com/company/ledgr',
    funding_stage: 'series-b', last_funding_date: '2024-11-27',
    last_funding_amount_usd: 30000000, trigger_count: 5, created_at: now, updated_at: now
  },
  {
    id: uuidv4(), name: 'FlowPay', sector: 'payments', hq_country: 'US',
    fte_min: 75, fte_max: 120, website: 'https://flowpay.io',
    linkedin_url: 'https://linkedin.com/company/flowpay',
    funding_stage: 'series-a', last_funding_date: '2024-08-15',
    last_funding_amount_usd: 14000000, trigger_count: 3, created_at: now, updated_at: now
  },
  {
    id: uuidv4(), name: 'EmbedFi', sector: 'payments', hq_country: 'US',
    fte_min: 200, fte_max: 320, website: 'https://embedfi.com',
    linkedin_url: 'https://linkedin.com/company/embedfi',
    funding_stage: 'series-c', last_funding_date: '2024-12-19',
    last_funding_amount_usd: 60000000, trigger_count: 8, created_at: now, updated_at: now
  },
  {
    id: uuidv4(), name: 'SettleUp', sector: 'payments', hq_country: 'US',
    fte_min: 55, fte_max: 85, website: 'https://settleup.co',
    linkedin_url: 'https://linkedin.com/company/settleup',
    funding_stage: 'series-a', last_funding_date: '2024-07-03',
    last_funding_amount_usd: 10000000, trigger_count: 2, created_at: now, updated_at: now
  },
  {
    id: uuidv4(), name: 'POS Nexus', sector: 'payments', hq_country: 'US',
    fte_min: 130, fte_max: 200, website: 'https://posnexus.com',
    linkedin_url: 'https://linkedin.com/company/posnexus',
    funding_stage: 'series-b', last_funding_date: '2024-09-22',
    last_funding_amount_usd: 28000000, trigger_count: 4, created_at: now, updated_at: now
  },
  {
    id: uuidv4(), name: 'ClearSettle', sector: 'payments', hq_country: 'US',
    fte_min: 90, fte_max: 140, website: 'https://clearsettle.io',
    linkedin_url: 'https://linkedin.com/company/clearsettle',
    funding_stage: 'series-b', last_funding_date: '2025-03-01',
    last_funding_amount_usd: 35000000, trigger_count: 5, created_at: now, updated_at: now
  },
  {
    id: uuidv4(), name: 'Invoicely Pro', sector: 'payments', hq_country: 'US',
    fte_min: 65, fte_max: 100, website: 'https://invoicelypro.com',
    linkedin_url: 'https://linkedin.com/company/invoicely-pro',
    funding_stage: 'series-a', last_funding_date: '2024-06-11',
    last_funding_amount_usd: 12000000, trigger_count: 2, created_at: now, updated_at: now
  },
  {
    id: uuidv4(), name: 'APFlow', sector: 'payments', hq_country: 'US',
    fte_min: 110, fte_max: 170, website: 'https://apflow.com',
    linkedin_url: 'https://linkedin.com/company/apflow',
    funding_stage: 'series-b', last_funding_date: '2024-10-17',
    last_funding_amount_usd: 22000000, trigger_count: 3, created_at: now, updated_at: now
  },
  {
    id: uuidv4(), name: 'SplitStack', sector: 'payments', hq_country: 'US',
    fte_min: 70, fte_max: 110, website: 'https://splitstack.io',
    linkedin_url: 'https://linkedin.com/company/splitstack',
    funding_stage: 'series-a', last_funding_date: '2024-05-07',
    last_funding_amount_usd: 8000000, trigger_count: 2, created_at: now, updated_at: now
  },
  {
    id: uuidv4(), name: 'NativePay', sector: 'payments', hq_country: 'US',
    fte_min: 160, fte_max: 240, website: 'https://nativepay.io',
    linkedin_url: 'https://linkedin.com/company/nativepay',
    funding_stage: 'series-c', last_funding_date: '2025-02-28',
    last_funding_amount_usd: 48000000, trigger_count: 6, created_at: now, updated_at: now
  },
  {
    id: uuidv4(), name: 'CheckoutIQ', sector: 'payments', hq_country: 'US',
    fte_min: 50, fte_max: 80, website: 'https://checkoutiq.com',
    linkedin_url: 'https://linkedin.com/company/checkoutiq',
    funding_stage: 'seed', last_funding_date: '2024-02-20',
    last_funding_amount_usd: 4000000, trigger_count: 1, created_at: now, updated_at: now
  },
  {
    id: uuidv4(), name: 'MerchantMind', sector: 'payments', hq_country: 'US',
    fte_min: 85, fte_max: 130, website: 'https://merchantmind.co',
    linkedin_url: 'https://linkedin.com/company/merchantmind',
    funding_stage: 'series-b', last_funding_date: '2024-11-05',
    last_funding_amount_usd: 26000000, trigger_count: 4, created_at: now, updated_at: now
  }
];

module.exports = { companies };
