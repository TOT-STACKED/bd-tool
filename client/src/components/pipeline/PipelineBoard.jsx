import { PIPELINE_STAGES } from '../../lib/constants'
import PipelineCard from './PipelineCard'

export default function PipelineBoard({ outreach = [] }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
      {PIPELINE_STAGES.map(stage => {
        const cards = outreach.filter(o => o.stage === stage.value)
        return (
          <div key={stage.value} className="flex-shrink-0 w-56">
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${stage.color}`}>
                {stage.label}
              </span>
              <span className="text-xs text-gray-400">{cards.length}</span>
            </div>
            <div className="space-y-2">
              {cards.map(r => <PipelineCard key={r.id} record={r} />)}
              {!cards.length && (
                <div className="h-16 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-gray-300">Empty</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
