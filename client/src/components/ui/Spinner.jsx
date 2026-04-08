import { cn } from '../../lib/utils'

export default function Spinner({ className }) {
  return (
    <div className={cn('inline-block w-4 h-4 border-2 border-gray-300 border-t-sky-600 rounded-full animate-spin', className)} />
  )
}
