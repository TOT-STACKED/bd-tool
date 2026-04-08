import { useOutreach } from '../hooks/useOutreach'
import PipelineBoard from '../components/pipeline/PipelineBoard'
import Spinner from '../components/ui/Spinner'

export default function Pipeline() {
  const { data, isLoading } = useOutreach()
  const outreach = data?.data || []

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">BD Pipeline</h1>
        <p className="text-sm text-gray-500 mt-1">{outreach.length} active BD conversations</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner className="w-8 h-8" /></div>
      ) : (
        <PipelineBoard outreach={outreach} />
      )}
    </div>
  )
}
