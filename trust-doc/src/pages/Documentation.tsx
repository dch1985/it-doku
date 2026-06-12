import { useMemo, useState } from 'react'
import { useStore, type Page } from '@/store/useStore'
import type { DocType } from '@/lib/types'
import { DOC_TYPE_LIST, DOC_TYPE_ICON, DOC_TYPE_META } from '@/lib/standards'
import { completeness } from '@/lib/agents'
import { Badge, Button, Card, Input, Progress } from '@/components/ui'
import { CriticalityBadge, StatusBadge } from '@/components/badges'
import { DocEditor } from '@/components/DocEditor'
import { relativeTime, uid } from '@/lib/utils'
import { Bot, FileText, Plus, Search, Sparkles } from 'lucide-react'

export function Documentation({ onNavigate }: { onNavigate: (p: Page, agentId?: string) => void }) {
  const docs = useStore((s) => s.docs)
  const addDoc = useStore((s) => s.addDoc)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<DocType | 'all'>('all')
  const [openId, setOpenId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return docs
      .filter((d) => (typeFilter === 'all' ? true : d.type === typeFilter))
      .filter((d) =>
        q
          ? d.title.toLowerCase().includes(q) ||
            d.owner.toLowerCase().includes(q) ||
            d.tags.some((t) => t.includes(q)) ||
            Object.values(d.fields).some((v) => v.toLowerCase().includes(q))
          : true,
      )
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
  }, [docs, query, typeFilter])

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: docs.length }
    for (const meta of DOC_TYPE_LIST) m[meta.type] = docs.filter((d) => d.type === meta.type).length
    return m
  }, [docs])

  const createBlank = (type: DocType) => {
    const meta = DOC_TYPE_META[type]
    const now = new Date().toISOString()
    const id = uid('doc')
    addDoc({
      id,
      title: `New ${meta.label}`,
      type,
      status: 'draft',
      environment: 'production',
      criticality: 'medium',
      owner: 'Unassigned',
      tags: [type],
      fields: {},
      sections: meta.requiredSections.map((heading) => ({ heading, body: '' })),
      createdAt: now,
      updatedAt: now,
    })
    setOpenId(id)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, owner, IP, tag…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onNavigate('agents', 'server-builder')}>
            <Sparkles className="h-4 w-4" /> Generate with agent
          </Button>
          <NewMenu onCreate={createBlank} />
        </div>
      </div>

      {/* type filter pills */}
      <div className="flex flex-wrap gap-2">
        <FilterPill active={typeFilter === 'all'} label="All" count={counts.all} onClick={() => setTypeFilter('all')} />
        {DOC_TYPE_LIST.map((meta) => (
          <FilterPill
            key={meta.type}
            active={typeFilter === meta.type}
            label={meta.label}
            count={counts[meta.type] ?? 0}
            icon={DOC_TYPE_ICON[meta.type]}
            onClick={() => setTypeFilter(meta.type)}
          />
        ))}
      </div>

      {/* list */}
      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No documents match your filters.</p>
          <Button variant="outline" onClick={() => onNavigate('agents', 'server-builder')}>
            <Bot className="h-4 w-4" /> Build one with an agent
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((d) => {
            const Icon = DOC_TYPE_ICON[d.type]
            const c = completeness(d)
            return (
              <Card
                key={d.id}
                onClick={() => setOpenId(d.id)}
                className="group cursor-pointer p-4 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold">{d.title}</h3>
                      {d.generatedBy && <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent" />}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {DOC_TYPE_META[d.type].label} · {d.owner} · {relativeTime(d.updatedAt)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={d.status} />
                  <CriticalityBadge criticality={d.criticality} />
                  <Badge tone="muted" className="capitalize">{d.environment}</Badge>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Completeness</span>
                    <span className="font-semibold text-foreground">{c.score}%</span>
                  </div>
                  <Progress
                    value={c.score}
                    barClassName={c.score >= 75 ? 'bg-success' : c.score >= 50 ? 'bg-warning' : 'bg-danger'}
                  />
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {openId && <DocEditor docId={openId} onClose={() => setOpenId(null)} />}
    </div>
  )
}

function FilterPill({
  active,
  label,
  count,
  icon: Icon,
  onClick,
}: {
  active: boolean
  label: string
  count: number
  icon?: React.ElementType
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-muted-foreground hover:bg-muted'
      }`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
      <span className={`rounded-full px-1.5 text-[10px] ${active ? 'bg-primary/20' : 'bg-muted'}`}>{count}</span>
    </button>
  )
}

function NewMenu({ onCreate }: { onCreate: (t: DocType) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <Button onClick={() => setOpen((v) => !v)}>
        <Plus className="h-4 w-4" /> New
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lg animate-fade-in">
            {DOC_TYPE_LIST.map((meta) => {
              const Icon = DOC_TYPE_ICON[meta.type]
              return (
                <button
                  key={meta.type}
                  onClick={() => {
                    onCreate(meta.type)
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {meta.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
