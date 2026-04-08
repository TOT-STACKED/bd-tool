import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { SECTORS } from '../../lib/constants'
import OutreachModal from './OutreachModal'

export default function PipelineCard({ record }) {
  const [showEdit, setShowEdit] = useState(false)
  const sector = SECTORS.find(s => s.value === record.company_sector)

  return (
    <>
      <div
        className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow"
        onClick={() => setShowEdit(true)}
      >
        <div className="flex items-start justify-between gap-1 mb-1.5">
          <p className="font-medium text-gray-900 text-sm leading-tight">{record.company_name}</p>
          <Link
            to={`/companies/${record.company_id}`}
            onClick={e => e.stopPropagation()}
            className="text-gray-300 hover:text-sky-500 shrink-0 mt-0.5"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {sector && (
          <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${sector.color}`}>
            {sector.label}
          </span>
        )}
        {record.contact_name && (
          <p className="text-xs text-gray-500 mt-1.5 truncate">{record.contact_name}</p>
        )}
        {record.notes && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{record.notes}</p>
        )}
        {record.next_action && (
          <p className="text-xs text-sky-600 mt-1.5 truncate">→ {record.next_action}</p>
        )}
        {record.owner && (
          <div className="mt-2 flex justify-end">
            <span className="text-xs text-gray-400">{record.owner}</span>
          </div>
        )}
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
