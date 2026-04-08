import { Link } from 'react-router-dom'
import { ExternalLink, ChevronRight } from 'lucide-react'
import TriggerBadge from '../triggers/TriggerBadge'
import { formatCurrency, formatDate, fteBand } from '../../lib/utils'
import { SECTORS } from '../../lib/constants'

export default function CompanyRow({ company }) {
  const sector = SECTORS.find(s => s.value === company.sector)

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-5 py-3">
        <Link to={`/companies/${company.id}`} className="font-medium text-gray-900 hover:text-sky-700">
          {company.name}
        </Link>
        {company.website && (
          <a href={company.website} target="_blank" rel="noreferrer"
            className="ml-1.5 text-gray-400 hover:text-sky-500 inline-flex items-center">
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </td>
      <td className="px-5 py-3">
        {sector && (
          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${sector.color}`}>
            {sector.label}
          </span>
        )}
      </td>
      <td className="px-5 py-3 text-sm text-gray-600">{fteBand(company.fte_min, company.fte_max)}</td>
      <td className="px-5 py-3 text-sm text-gray-600">
        {company.funding_stage ? company.funding_stage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '—'}
        {company.last_funding_amount_usd && (
          <span className="text-gray-400 ml-1">· {formatCurrency(company.last_funding_amount_usd)}</span>
        )}
      </td>
      <td className="px-5 py-3">
        <div className="flex flex-wrap gap-1">
          {company.trigger_count > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-100 text-sky-700">
              {company.trigger_count} signal{company.trigger_count !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </td>
      <td className="px-5 py-3 text-sm text-gray-400">{formatDate(company.last_funding_date)}</td>
      <td className="px-5 py-3 text-right">
        <Link to={`/companies/${company.id}`}
          className="text-gray-400 hover:text-sky-600 inline-flex items-center">
          <ChevronRight className="w-4 h-4" />
        </Link>
      </td>
    </tr>
  )
}
