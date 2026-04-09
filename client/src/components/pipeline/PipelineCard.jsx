import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Calendar, User } from 'lucide-react'
import { SECTORS } from '../../lib/constants'
import OutreachModal from './OutreachModal'

export default function PipelineCard({ record }) {
  const [showEdit, setShowEdit] = useState(false)
  const sector = SECTORS.find(s => s.value === record.company_sector)

  const nextDate = record.next_action_date
    ? new Date(record.next_action_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : null

  const isOverdue = record.next_action_date && new Date(record.next_action_date) < new Date()

  return (
    <>
      <div
        className="bg-white rounded-lg border border-gray-200 p-3.5 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all group"
        onClick={() => setShowEdit(true)}
      >
        {/* Company name + link */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="font-semibold text-gray-900 text-sm leading-snug">{record.company_name}</p>
          <Link
            to={`/companies/${record.company_id}`}
            onClick={e => e.stopPropagation()}
            className="text-gray-300 hover:text-sky-500 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Sector badge */}
        {sector && (
          <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${sector.color}`}>
            {sector.label}
          </span>
        )}

        {/* Contact */}
        {record.contact_name && (
          <div className="flex items-center gap-1 mt-2">
            <User className="w-3 h-3 text-gray-300 shrink-0" />
            <p className="text-xs text-gray-500 truncate">{record.contact_name}</p>
          </div>
        )}

        {/* Notes */}
        {record.notes && (
          <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">{record.notes}</p>
        )}

        {/* Footer: next action + owner */}
        <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-end justify-between gap-2">
          <div className="min-w-0">
            {record.next_action && (
              <p className="text-xs text-sky-600 truncate font-medium">→ {record.next_action}</p>
            )}
            {nextDate && (
              <div className={`flex items-center gap-1 mt-0.5 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                <Calendar className="w-3 h-3 shrink-0" />
                <span className="text-xs">{isOverdue ? 'Overdue · ' : ''}{nextDate}</span>
              </div>
            )}
          </div>
          {record.owner && (
            <span className="text-xs text-gray-400 shrink-0 bg-gray-50 px-1.5 py-0.5 rounded">
              {record.owner.split(' ')[0]}
            </span>
          )}
        </div>
      </div>

      {showEdit && (
        <OutreachModal
          companyId={record.company_id}
          record={record}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  )
}
