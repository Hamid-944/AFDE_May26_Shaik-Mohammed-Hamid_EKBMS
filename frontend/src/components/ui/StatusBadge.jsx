import { STATUS_CONFIG } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function StatusBadge({ status, className }) {
  const config = STATUS_CONFIG[status] || { label: status, class: 'bg-gray-100 text-gray-600' }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', config.class, className)}>
      {config.label}
    </span>
  )
}
