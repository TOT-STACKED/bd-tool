import { useState } from 'react'
import { PIPELINE_STAGES } from '../../lib/constants'
import PipelineCard from './PipelineCard'
import OutreachModal from './OutreachModal'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'

const STAGE_BG = {
  identified:      'border-gray-300 bg-gray-50',
  researching:     'border-blue-300 bg-blue-50',
  outreach_sent:   'border-purple-300 bg-purple-50',
  in_conversation: 'border-yellow-300 bg-yellow-50',
  proposal_sent:   'border-orange-300 bg-orange-50',
  closed_won:      'border-green-300 bg-green-50',
  closed_lost:     'border-red-200 bg-red-50',
}

const STAGE_DOT = {
  identified:      'bg-gray-400',
  researching:     'bg-blue-500',
  outreach_sent:   'bg-purple-500',
  in_conversation: 'bg-yellow-500',
  proposal_sent:   'bg-orange-500',
  closed_won:      'bg-green-500',
  closed_lost:     'bg-red-400',
}

export default function PipelineBoard({ outreach = [] }) {
  const [collapsed, setCollapsed] = useState({ closed_lost: true })
  const [addingStage, setAddingStage] = useState(null)

  const toggle = (stage) =>
    setCollapsed(prev => ({ ...prev, [stage]: !prev[stage] }))

  const active = PIPELINE_STAGES.filter(s => !['closed_won', 'closed_lost'].includes(s.value))
  const closed = PIPELINE_STAGES.filter(s => ['closed_won', 'closed_lost'].includes(s.value))

  const total = outreach.length
  const wonCount = outreach.filter(o => o.stage === 'closed_won').length

  return (
    <div className="space-y-3">
      {/* Summary strip */}
      <div className="flex gap-6 text-sm text-gray-500 mb-2 px-1">
        <span><span className="font-semibold text-gray-900">{total}</span> total</span>
        <span><span className="font-semibold text-green-600">{wonCount}</span> closed won</span>
        <span><span className="font-semibold text-gray-900">{total - wonCount}</span> in progress</span>
      </div>

      {/* Active stages */}
      {active.map(stage => {
        const cards = outreach.filter(o => o.stage === stage.value)
        const isCollapsed = collapsed[stage.value]
        return (
          <div key={stage.value} className={`rounded-xl border-2 ${STAGE_BG[stage.value]} overflow-hidden`}>
            {/* Stage header */}
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-80 transition-opacity"
              onClick={() => toggle(stage.value)}
            >
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${STAGE_DOT[stage.value]}`} />
              <span className="font-semibold text-gray-800 text-sm flex-1">{stage.label}</span>
              <span className="text-xs font-medium text-gray-500 bg-white/70 px-2 py-0.5 rounded-full">
                {cards.length}
              </span>
              {isCollapsed
                ? <ChevronRight className="w-4 h-4 text-gray-400" />
                : <ChevronDown className="w-4 h-4 text-gray-400" />
              }
            </button>

            {/* Cards grid */}
            {!isCollapsed && (
              <div className="px-4 pb-4">
                {cards.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {cards.map(r => <PipelineCard key={r.id} record={r} />)}
                    <button
                      onClick={() => setAddingStage(stage.value)}
                      className="h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-xs">Add</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingStage(stage.value)}
                    className="w-full h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center gap-2 text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-xs">Add company to {stage.label}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Closed stages — side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {closed.map(stage => {
          const cards = outreach.filter(o => o.stage === stage.value)
          const isCollapsed = collapsed[stage.value]
          return (
            <div key={stage.value} className={`rounded-xl border-2 ${STAGE_BG[stage.value]} overflow-hidden`}>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-80 transition-opacity"
                onClick={() => toggle(stage.value)}
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${STAGE_DOT[stage.value]}`} />
                <span className="font-semibold text-gray-800 text-sm flex-1">{stage.label}</span>
                <span className="text-xs font-medium text-gray-500 bg-white/70 px-2 py-0.5 rounded-full">
                  {cards.length}
                </span>
                {isCollapsed
                  ? <ChevronRight className="w-4 h-4 text-gray-400" />
                  : <ChevronDown className="w-4 h-4 text-gray-400" />
                }
              </button>
              {!isCollapsed && (
                <div className="px-4 pb-4">
                  {cards.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {cards.map(r => <PipelineCard key={r.id} record={r} />)}
                    </div>
                  ) : (
                    <div className="h-12 flex items-center justify-center text-xs text-gray-400">Empty</div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add modal */}
      {addingStage && (
        <OutreachModal
          stage={addingStage}
          onClose={() => setAddingStage(null)}
        />
      )}
    </div>
  )
}
