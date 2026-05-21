import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export function Spinner({ className, size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8', xl: 'w-12 h-12' }
  return <Loader2 className={cn('animate-spin text-indigo-600', sizes[size], className)} />
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="xl" />
        <p className="text-sm text-slate-500 animate-pulse">Loading...</p>
      </div>
    </div>
  )
}
