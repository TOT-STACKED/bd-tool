const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  // Companies
  getCompanies: (params = {}) => request('/companies?' + new URLSearchParams(params)),
  getCompany: (id) => request(`/companies/${id}`),
  createCompany: (data) => request('/companies', { method: 'POST', body: data }),
  updateCompany: (id, data) => request(`/companies/${id}`, { method: 'PATCH', body: data }),

  // Contacts
  getContacts: (params = {}) => request('/contacts?' + new URLSearchParams(params)),
  createContact: (data) => request('/contacts', { method: 'POST', body: data }),
  updateContact: (id, data) => request(`/contacts/${id}`, { method: 'PATCH', body: data }),
  deleteContact: (id) => request(`/contacts/${id}`, { method: 'DELETE' }),

  // Triggers
  getTriggers: (params = {}) => request('/triggers?' + new URLSearchParams(params)),
  createTrigger: (data) => request('/triggers', { method: 'POST', body: data }),

  // Outreach
  getOutreach: (params = {}) => request('/outreach?' + new URLSearchParams(params)),
  createOutreach: (data) => request('/outreach', { method: 'POST', body: data }),
  updateOutreach: (id, data) => request(`/outreach/${id}`, { method: 'PATCH', body: data }),

  // Scraper
  getScraperStatus: () => request('/scraper/status'),
  runScraper: (scraper) => request('/scraper/run', { method: 'POST', body: { scraper } }),

  // Health
  health: () => request('/health'),
}
