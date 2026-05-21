import { cn } from '@/lib/utils'

export function Badge({ children, className, variant = 'default', ...props }) {
  const variants = {
    default: 'bg-indigo-100 text-indigo-700',
    secondary: 'bg-slate-100 text-slate-600',
    destructive: 'bg-red-100 text-red-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    outline: 'border border-slate-200 text-slate-600 bg-white',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
