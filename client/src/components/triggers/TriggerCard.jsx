import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import TriggerBadge from './TriggerBadge'
import { timeAgo } from '../../lib/utils'

export default function TriggerCard({ trigger, showCompany = true }) {
  const detail = trigger.detail ? JSON.parse(trigger.detail) : {}

  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <TriggerBadge type={trigger.type} />
          {showCompany && trigger.company_name && (
            <Link
              to={`/companies/${trigger.company_id}`}
              className="text-sm font-medium text-sky-700 hover:underline truncate"
            >
              {trigger.company_name}
            </Link>
          )}
          <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">{timeAgo(trigger.detected_at)}</span>
        </div>
        <p className="text-sm text-gray-800">{trigger.title}</p>
        {trigger.type === 'funding' && detail.investors?.length > 0 && (
          <p className="text-xs text-gray-500 mt-0.5">Led by {detail.investors[0]}</p>
        )}
        {trigger.type === 'new_hire' && detail.person_name && (
          <p className="text-xs text-gray-500 mt-0.5">{detail.person_name}</p>
        )}
        {trigger.source_url && (
          <a href={trigger.source_url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-sky-600 mt-0.5">
            <ExternalLink className="w-3 h-3" /> Source
          </a>
        )}
      </div>
    </div>
  )
}
