import { cn } from '../../lib/utils'

export default function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400',
        'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500',
        className
      )}
      {...props}
    />
  )
}
