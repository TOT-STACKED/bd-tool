import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import CompanyRow from './CompanyRow'
import Spinner from '../ui/Spinner'
import { SECTORS } from '../../lib/constants'
import { fteBand, formatCurrency } from '../../lib/utils'

const HEADERS = ['Company', 'Sector', 'FTE', 'Funding', 'Signals', 'Last Raise', '']

function CompanyCard({ company }) {
  const sector = SECTORS.find(s => s.value === company.sector)
  return (
    <Link
      to={`/companies/${company.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-medium text-gray-900 truncate text-sm">{company.name}</span>
          {sector && (
            <span className={`inline-flex px-1.5 py-0 rounded text-xs font-medium shrink-0 ${sector.color}`}>
              {sector.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{fteBand(company.fte_min, company.fte_max)} FTE</span>
          {company.funding_stage && (
            <span>· {company.funding_stage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
          )}
          {company.last_funding_amount_usd && (
            <span>· {formatCurrency(company.last_funding_amount_usd)}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {company.trigger_count > 0 && (
          <span className="text-xs bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-medium">
            {company.trigger_count} ⚡
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </div>
    </Link>
  )
}

export default function CompanyTable({ companies = [], isLoading }) {
  if (isLoading) return (
    <div className="flex justify-center py-16"><Spinner className="w-6 h-6" /></div>
  )

  if (!companies.length) return (
    <div className="text-center py-16 text-gray-400 text-sm">No companies match your filters</div>
  )

  return (
    <>
      {/* Mobile card list */}
      <div className="sm:hidden divide-y divide-gray-100">
        {companies.map(co => <CompanyCard key={co.id} company={co} />)}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {HEADERS.map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {companies.map(co => <CompanyRow key={co.id} company={co} />)}
          </tbody>
        </table>
      </div>
    </>
  )
}
