import { cn } from '@/lib/utils'
import type { AssetStatus, DocCategory, DocStatus } from './types'

const docStatusStyles: Record<DocStatus, string> = {
  Published: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
  'In Review': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20',
  Draft: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 ring-slate-500/20',
  Outdated: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20',
}

const assetStatusStyles: Record<AssetStatus, string> = {
  Operational: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
  Degraded: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20',
  Maintenance: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20',
  Offline: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20',
}

export function StatusPill({ status }: { status: DocStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        docStatusStyles[status]
      )}
    >
      {status}
    </span>
  )
}

export function AssetStatusPill({ status }: { status: AssetStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        assetStatusStyles[status]
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  )
}

const categoryStyles: Record<DocCategory, string> = {
  Server: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  Network: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  Security: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'Backup & DR': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  Infrastructure: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  Runbook: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  Application: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
}

export function CategoryTag({ category }: { category: DocCategory }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        categoryStyles[category]
      )}
    >
      {category}
    </span>
  )
}
