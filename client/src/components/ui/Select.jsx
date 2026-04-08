import { cn } from '../../lib/utils'

export default function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        'block rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
        'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}
