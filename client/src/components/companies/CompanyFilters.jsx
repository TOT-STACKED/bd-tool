import Input from '../ui/Input'
import Select from '../ui/Select'
import { Search } from 'lucide-react'

export default function CompanyFilters({ filters, onChange }) {
  const set = (key, value) => onChange({ ...filters, [key]: value || undefined })

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 sm:items-center">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search companies…"
          value={filters.search || ''}
          onChange={e => set('search', e.target.value)}
          className="pl-9 w-full sm:w-52"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        <Select value={filters.sector || ''} onChange={e => set('sector', e.target.value)}>
          <option value="">All sectors</option>
          <option value="hospo-saas">Hospo SaaS</option>
          <option value="payments">Payments</option>
        </Select>

        <Select value={filters.trigger_type || ''} onChange={e => set('trigger_type', e.target.value)}>
          <option value="">All triggers</option>
          <option value="funding">Funding</option>
          <option value="job_posting">Job Posting</option>
          <option value="new_hire">New Hire</option>
        </Select>

        <Select value={filters.sort || 'trigger_count'} onChange={e => set('sort', e.target.value)}>
          <option value="trigger_count">Most active</option>
          <option value="name">Name A–Z</option>
          <option value="last_funding_date">Latest funding</option>
        </Select>
      </div>
    </div>
  )
}
