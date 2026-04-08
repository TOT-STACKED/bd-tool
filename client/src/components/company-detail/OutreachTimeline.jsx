import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PIPELINE_STAGES } from '../../lib/constants'
import { formatDate } from '../../lib/utils'
import Button from '../ui/Button'
import OutreachModal from '../pipeline/OutreachModal'

const ACTIVITY_ICONS = {
  email: '📧', linkedin: '💼', call: '📞', meeting: '🤝', note: '📝'
}

export default function OutreachTimeline({ outreach = [], companyId, contacts = [] }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700">Activity ({outreach.length})</h3>
        <Button size="sm" variant="secondary" onClick={() => setShowModal(true)}>
          <Plus className="w-3 h-3" /> Log Activity
        </Button>
      </div>

      {!outreach.length && (
        <p className="text-sm text-gray-400 py-4">No outreach logged yet</p>
      )}

      <div className="space-y-3">
        {outreach.map(o => {
          const stage = PIPELINE_STAGES.find(s => s.value === o.stage)
          return (
            <div key={o.id} className="flex gap-3 text-sm">
              <div className="text-lg leading-none mt-0.5">
                {ACTIVITY_ICONS[o.activity_type] || '📝'}
              </div>
              <div className="flex-1 bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  {stage && (
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${stage.color}`}>
                      {stage.label}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{o.owner} · {formatDate(o.created_at)}</span>
                </div>
                {o.notes && <p className="text-gray-700 text-xs">{o.notes}</p>}
                {o.next_action && (
                  <p className="text-xs text-sky-600 mt-1">
                    Next: {o.next_action}
                    {o.next_action_date && ` · ${formatDate(o.next_action_date)}`}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <OutreachModal
          companyId={companyId}
          contacts={contacts}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
