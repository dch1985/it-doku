import { useMemo } from 'react'
import { useStore, type Page } from '@/store/useStore'
import { completeness, runAnalyzer, AGENTS } from '@/lib/agents'
import { DOC_TYPE_LIST, DOC_TYPE_ICON } from '@/lib/standards'
import { Badge, Button, Card, Progress, ScoreRing } from '@/components/ui'
import { SeverityIcon } from '@/components/badges'
import { relativeTime } from '@/lib/utils'
import { ArrowRight, Bot, FileText, FolderKanban, ShieldCheck, TriangleAlert } from 'lucide-react'

export function Dashboard({ onNavigate }: { onNavigate: (p: Page, agentId?: string) => void }) {
  const docs = useStore((s) => s.docs)
  const orgName = useStore((s) => s.settings.orgName)

  const audit = useMemo(() => runAnalyzer('auditor', docs), [docs])
  const compliance = useMemo(() => runAnalyzer('compliance', docs), [docs])

  const stats = useMemo(() => {
    const published = docs.filter((d) => d.status === 'published').length
    const critical = docs.filter((d) => d.criticality === 'critical').length
    return { total: docs.length, published, critical }
  }, [docs])

  const byType = useMemo(
    () =>
      DOC_TYPE_LIST.map((meta) => {
        const items = docs.filter((d) => d.type === meta.type)
        const avg = items.length
          ? Math.round(items.reduce((s, d) => s + completeness(d).score, 0) / items.length)
          : 0
        return { meta, count: items.length, avg }
      }),
    [docs],
  )

  const recent = useMemo(
    () => [...docs].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 5),
    [docs],
  )

  const topFindings = audit.findings.filter((f) => f.severity !== 'ok').slice(0, 4)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* hero */}
      <Card className="relative overflow-hidden border-0 brand-gradient p-6 text-white lg:p-8">
        <div className="relative z-10 max-w-xl">
          <Badge className="bg-white/20 text-white backdrop-blur">
            <Bot className="h-3 w-3" /> Agentic documentation
          </Badge>
          <h2 className="mt-3 text-2xl font-bold lg:text-3xl">Documentation that earns trust.</h2>
          <p className="mt-2 text-sm text-white/85">
            {orgName} has <b>{stats.total}</b> documented systems. Let the expert agents keep them
            complete, compliant and current — no chatbot required.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" className="bg-white text-primary hover:bg-white/90" onClick={() => onNavigate('agents')}>
              <Bot className="h-4 w-4" /> Run an agent
            </Button>
            <Button variant="outline" className="border-white/40 text-white hover:bg-white/10" onClick={() => onNavigate('documentation')}>
              <FolderKanban className="h-4 w-4" /> Open library
            </Button>
          </div>
        </div>
        <ShieldCheck className="pointer-events-none absolute -right-6 -top-6 h-56 w-56 text-white/10" />
      </Card>

      {/* score cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileText} label="Documented systems" value={String(stats.total)} hint={`${stats.published} published`} />
        <ScoreCard label="Coverage" value={audit.score} hint={audit.scoreLabel} onClick={() => onNavigate('agents', 'auditor')} />
        <ScoreCard label="Compliance" value={compliance.score} hint={`${compliance.stats[1].value} controls`} onClick={() => onNavigate('agents', 'compliance')} />
        <StatCard icon={TriangleAlert} label="Open gaps" value={audit.stats[3].value} hint="from last audit" tone="warning" onClick={() => onNavigate('agents', 'auditor')} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* coverage by type */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold">Documentation health by type</h3>
          <div className="space-y-3.5">
            {byType.map(({ meta, count, avg }) => {
              const Icon = DOC_TYPE_ICON[meta.type]
              return (
                <div key={meta.type} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium">{meta.label}</span>
                      <span className="text-muted-foreground">
                        {count} doc{count !== 1 ? 's' : ''} · {count ? `${avg}%` : '—'}
                      </span>
                    </div>
                    <Progress
                      value={avg}
                      barClassName={avg >= 75 ? 'bg-success' : avg >= 50 ? 'bg-warning' : 'bg-danger'}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* findings */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Top findings</h3>
            <button
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              onClick={() => onNavigate('agents', 'auditor')}
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {topFindings.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <ShieldCheck className="h-8 w-8 text-success" />
              <p className="text-sm text-muted-foreground">No open gaps. Documentation is healthy.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {topFindings.map((f, i) => (
                <li key={i} className="flex gap-2.5">
                  <SeverityIcon severity={f.severity} className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium leading-snug">{f.title}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{f.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* recent + agents */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold">Recently updated</h3>
          <div className="divide-y divide-border">
            {recent.map((d) => {
              const Icon = DOC_TYPE_ICON[d.type]
              const c = completeness(d)
              return (
                <button
                  key={d.id}
                  onClick={() => onNavigate('documentation')}
                  className="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate text-sm font-medium">{d.title}</span>
                  <span className="hidden text-xs text-muted-foreground sm:block">{relativeTime(d.updatedAt)}</span>
                  <Badge tone={c.score >= 75 ? 'success' : c.score >= 50 ? 'warning' : 'danger'}>{c.score}%</Badge>
                </button>
              )
            })}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold">Quick agents</h3>
          <div className="space-y-2">
            {AGENTS.slice(0, 4).map((a) => {
              const Icon = a.icon
              return (
                <button
                  key={a.id}
                  onClick={() => onNavigate('agents', a.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border p-2.5 text-left transition-all hover:border-primary/40 hover:bg-muted/40"
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${a.accent} text-white`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-xs font-medium leading-tight">{a.name}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'primary',
  onClick,
}: {
  icon: React.ElementType
  label: string
  value: string
  hint: string
  tone?: 'primary' | 'warning'
  onClick?: () => void
}) {
  return (
    <Card
      className={`p-5 ${onClick ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone === 'warning' ? 'bg-warning/15 text-warning' : 'bg-primary/10 text-primary'}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
    </Card>
  )
}

function ScoreCard({ label, value, hint, onClick }: { label: string; value: number; hint: string; onClick?: () => void }) {
  return (
    <Card className={`flex items-center gap-4 p-5 ${onClick ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}`} onClick={onClick}>
      <ScoreRing value={value} size={64} />
      <div>
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="mt-1 text-sm font-semibold">{hint}</div>
      </div>
    </Card>
  )
}
