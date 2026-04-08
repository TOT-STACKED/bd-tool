import { useTriggers } from '../../hooks/useTriggers'
import TriggerCard from './TriggerCard'
import Spinner from '../ui/Spinner'

export default function TriggerFeed({ limit = 15, companyId, showCompany = true }) {
  const params = { limit }
  if (companyId) params.company_id = companyId

  const { data, isLoading } = useTriggers(params)
  const triggers = data?.data || []

  if (isLoading) return (
    <div className="flex items-center justify-center py-8">
      <Spinner />
    </div>
  )

  if (!triggers.length) return (
    <p className="text-sm text-gray-400 py-4 text-center">No triggers yet</p>
  )

  return (
    <div>
      {triggers.map(t => (
        <TriggerCard key={t.id} trigger={t} showCompany={showCompany} />
      ))}
    </div>
  )
}
