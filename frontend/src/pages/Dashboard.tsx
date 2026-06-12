import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Bot, FileText, Gauge, Server, TimerReset } from 'lucide-react'
import { api } from '@/lib/api'
import { cn, timeAgo } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CategoryBadge, StatusBadge } from '@/components/badges'
import { navigate } from '@/lib/navigation'

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ['stats'], queryFn: api.stats })
  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => api.documents.list(),
  })

  const recent = (documents ?? []).slice(0, 6)
  const coverage = stats?.coverage
  const lastRun = stats?.lastAgentRun

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The current state of your IT documentation, kept honest by the agent.
          </p>
        </div>
        <Button onClick={() => navigate('agent')}>
          <Bot className="h-4 w-4" />
          Run the agent
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Documents"
          icon={FileText}
          loading={statsLoading}
          value={stats ? String(stats.documents.total) : ''}
          hint={stats ? `${stats.documents.byStatus.PUBLISHED ?? 0} published` : ''}
          onClick={() => navigate('documents')}
        />
        <KpiCard
          title="Coverage"
          icon={Gauge}
          loading={statsLoading}
          value={coverage ? `${coverage.percent}%` : ''}
          hint={coverage ? `${coverage.covered} of ${coverage.required} required docs` : ''}
          tone={coverage && coverage.percent < 70 ? 'warning' : 'default'}
          onClick={() => navigate('agent')}
        />
        <KpiCard
          title="Stale documents"
          icon={TimerReset}
          loading={statsLoading}
          value={stats ? String(stats.documents.stale) : ''}
          hint="past their review interval"
          tone={stats && stats.documents.stale > 0 ? 'destructive' : 'default'}
          onClick={() => navigate('documents')}
        />
        <KpiCard
          title="Assets"
          icon={Server}
          loading={statsLoading}
          value={stats ? String(stats.assets.total) : ''}
          hint="in the inventory"
          onClick={() => navigate('infrastructure')}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base">Recent documents</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('documents')}>
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {docsLoading &&
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            {!docsLoading && recent.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No documents yet. Let the agent generate the first drafts from your inventory.
              </p>
            )}
            {recent.map((doc) => (
              <button
                key={doc.id}
                onClick={() => navigate(`document/${doc.id}`)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent/60"
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">Updated {timeAgo(doc.updatedAt)}</p>
                </div>
                <CategoryBadge category={doc.category} />
                <StatusBadge status={doc.status} />
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Documentation coverage</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading && <Skeleton className="h-24 w-full" />}
              {coverage && (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight">{coverage.percent}%</span>
                    <span className="text-sm text-muted-foreground">
                      of required documents exist
                    </span>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        coverage.percent >= 90
                          ? 'bg-success'
                          : coverage.percent >= 70
                            ? 'bg-primary'
                            : 'bg-warning'
                      )}
                      style={{ width: `${coverage.percent}%` }}
                    />
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    Based on expert rules: servers need system &amp; backup docs, firewalls need
                    network &amp; security docs, critical assets need runbooks.
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Last agent run</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading && <Skeleton className="h-16 w-full" />}
              {!statsLoading && !lastRun && (
                <p className="text-sm text-muted-foreground">
                  The agent has not run yet. Start with a coverage analysis to see where
                  documentation is missing.
                </p>
              )}
              {lastRun && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{lastRun.skillName}</span>
                    <StatusBadge status={lastRun.status} />
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{lastRun.summary}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(lastRun.createdAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {stats && Object.keys(stats.documents.byCategory).length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Library by category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.documents.byCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => (
                  <div
                    key={category}
                    className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2"
                  >
                    <CategoryBadge category={category} />
                    <span className="text-sm font-semibold">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function KpiCard({
  title,
  icon: Icon,
  value,
  hint,
  loading,
  tone = 'default',
  onClick,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  value: string
  hint: string
  loading?: boolean
  tone?: 'default' | 'warning' | 'destructive'
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-muted-foreground">{title}</span>
        <Icon
          className={cn(
            'h-4 w-4',
            tone === 'warning'
              ? 'text-warning'
              : tone === 'destructive'
                ? 'text-destructive'
                : 'text-muted-foreground'
          )}
        />
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-16" />
      ) : (
        <p
          className={cn(
            'mt-1.5 text-2xl font-bold tracking-tight',
            tone === 'warning' && 'text-warning',
            tone === 'destructive' && value !== '0' && 'text-destructive'
          )}
        >
          {value}
        </p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </button>
  )
}
