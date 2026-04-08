import { TRIGGER_TYPES } from '../../lib/constants'

export default function TriggerBadge({ type }) {
  const cfg = TRIGGER_TYPES.find(t => t.value === type) || TRIGGER_TYPES[0]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${cfg.color}`}>
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  )
}
