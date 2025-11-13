import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAnalytics } from '@/hooks/useAnalytics'
import { Zap, Database, ShieldCheck, Users } from 'lucide-react'

export function Analytics() {
  const { data, isLoading } = useAnalytics()

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>Analytics</h2>
          <p className='text-muted-foreground'>Loading operational insights…</p>
        </div>
        <div className='flex items-center justify-center py-12 text-muted-foreground'>Collecting metrics…</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className='space-y-6'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>Analytics</h2>
          <p className='text-muted-foreground'>No analytics data available yet.</p>
        </div>
      </div>
    )
  }

  const { system, automation, centralize, comply } = data

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-3xl font-bold tracking-tight'>Analytics</h2>
        <p className='text-muted-foreground'>KPIs aligned with Automate · Centralize · Comply.</p>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Documents</CardTitle>
            <Users className='h-5 w-5 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{system.totalDocuments}</div>
            <p className='text-xs text-muted-foreground'>Templates: {system.totalTemplates}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Automation Completion</CardTitle>
            <Zap className='h-5 w-5 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{automation.jobs.completionRate}%</div>
            <p className='text-xs text-muted-foreground'>Jobs started: {automation.jobs.started}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Assistant Queries (7d)</CardTitle>
            <Database className='h-5 w-5 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{centralize.assistant.totalQueries}</div>
            <p className='text-xs text-muted-foreground'>Knowledge docs: {centralize.knowledge.documentsWithCoverage}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Open Findings</CardTitle>
            <ShieldCheck className='h-5 w-5 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {comply.findings.openBySeverity.reduce((sum, item) => sum + item.count, 0)}
            </div>
            <p className='text-xs text-muted-foreground'>Req-ID coverage: {comply.policies.reqIdCoveragePercent}%</p>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Automation Stream</CardTitle>
            <CardDescription>Jobs, suggestions and connector health (7 Tage)</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4 text-sm'>
            <div className='rounded-md border p-3'>
              <p className='font-semibold'>Jobs</p>
              <p className='text-muted-foreground'>Started: {automation.jobs.started}, Completed: {automation.jobs.completed}, Failed: {automation.jobs.failed}</p>
            </div>
            <div className='rounded-md border p-3'>
              <p className='font-semibold'>Suggestions</p>
              <p className='text-muted-foreground'>Applied: {automation.suggestions.applied} · Dismissed: {automation.suggestions.dismissed}</p>
              <p className='text-[11px] text-muted-foreground'>Estimated time saved ≈ {automation.suggestions.estimatedTimeSavedHours} h</p>
            </div>
            <div className='rounded-md border p-3'>
              <p className='font-semibold'>Connector Health</p>
              <div className='mt-2 space-y-2'>
                {automation.connectors.length === 0 ? (
                  <p className='text-xs text-muted-foreground'>No connectors configured.</p>
                ) : (
                  automation.connectors.map((connector) => (
                    <div key={connector.id} className='flex items-center justify-between rounded border px-3 py-2'>
                      <div>
                        <p className='font-medium'>{connector.name}</p>
                        <p className='text-xs text-muted-foreground'>{connector.type}</p>
                      </div>
                      <div className='text-right'>
                        <p
                          className={
                            connector.status === 'OK'
                              ? 'text-xs font-semibold text-green-500'
                              : connector.status === 'OFFLINE'
                                ? 'text-xs font-semibold text-red-500'
                                : 'text-xs font-semibold text-amber-500'
                          }
                        >
                          {connector.status}
                        </p>
                        {connector.lastJob && (
                          <p className='text-[10px] text-muted-foreground'>
                            {new Date(connector.lastJob.createdAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Knowledge &amp; Compliance</CardTitle>
            <CardDescription>Single Source of Truth + Audit readiness</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4 text-sm'>
            <div className='rounded-md border p-3'>
              <p className='font-semibold'>Assistant Audience Mix</p>
              <div className='mt-2 space-y-1'>
                {centralize.assistant.byAudience.map((item) => (
                  <div key={item.audience} className='flex justify-between text-xs'>
                    <span>{item.audience}</span>
                    <span>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className='rounded-md border p-3'>
              <p className='font-semibold'>Knowledge Coverage</p>
              <p className='text-xs text-muted-foreground'>Documents without coverage: {centralize.knowledge.documentsWithoutCoverage}</p>
              <p className='text-xs text-muted-foreground'>Nodes without document: {centralize.knowledge.nodesWithoutDocument}</p>
              <div className='mt-2 space-y-1'>
                {centralize.knowledge.topTypes.map((entry) => (
                  <div key={entry.type} className='flex justify-between text-xs'>
                    <span>{entry.type}</span>
                    <span>{entry.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className='rounded-md border p-3'>
              <p className='font-semibold'>Compliance Snapshot</p>
              <p className='text-xs text-muted-foreground'>Average finding resolution: {comply.findings.avgResolutionDays} days</p>
              <p className='text-xs text-muted-foreground'>Open reviews: {comply.reviews.openRequests}</p>
              <p className='text-xs text-muted-foreground'>Average review cycle: {comply.reviews.avgCycleDays} days</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Analytics