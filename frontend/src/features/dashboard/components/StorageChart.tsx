import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAnalytics } from '@/hooks/useAnalytics'

export function StorageChart() {
  const { data: analyticsData, isLoading } = useAnalytics()
  const centralize = analyticsData?.centralize
  const comply = analyticsData?.comply

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Knowledge &amp; Compliance</CardTitle>
          <CardDescription>Loading readiness metrics…</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='h-[220px] w-full animate-pulse rounded-md bg-muted' />
        </CardContent>
      </Card>
    )
  }

  if (!centralize || !comply) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Knowledge &amp; Compliance</CardTitle>
          <CardDescription>No metrics available yet.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Knowledge &amp; Compliance</CardTitle>
        <CardDescription>Single Source of Truth &amp; Audit readiness</CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid gap-3 md:grid-cols-3'>
          <div className='rounded-lg border border-border bg-muted/30 p-4'>
            <p className='text-xs uppercase text-muted-foreground'>Assistant Queries (7d)</p>
            <p className='text-2xl font-semibold'>{centralize.assistant.totalQueries}</p>
            <div className='mt-2 space-y-1 text-[11px] text-muted-foreground'>
              {centralize.assistant.byAudience.map((item) => (
                <div key={item.audience} className='flex justify-between'>
                  <span>{item.audience}</span>
                  <span>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className='rounded-lg border border-border bg-muted/30 p-4'>
            <p className='text-xs uppercase text-muted-foreground'>Knowledge Coverage</p>
            <p className='text-2xl font-semibold'>{centralize.knowledge.documentsWithCoverage}</p>
            <p className='text-xs text-muted-foreground'>Documents covered</p>
            <p className='text-[11px] text-muted-foreground'>Without coverage: {centralize.knowledge.documentsWithoutCoverage}</p>
          </div>
          <div className='rounded-lg border border-border bg-muted/30 p-4'>
            <p className='text-xs uppercase text-muted-foreground'>Req-ID Coverage</p>
            <p className='text-2xl font-semibold'>{comply.policies.reqIdCoveragePercent}%</p>
            <p className='text-xs text-muted-foreground'>Documents tagged: {comply.policies.documentsWithReqId}</p>
          </div>
        </div>

        <div className='grid gap-4 md:grid-cols-2'>
          <div>
            <p className='text-sm font-semibold'>Top Knowledge Types</p>
            <div className='mt-2 space-y-1 rounded-md border p-3 text-sm'>
              {centralize.knowledge.topTypes.length === 0 ? (
                <p className='text-xs text-muted-foreground'>No knowledge nodes recorded.</p>
              ) : (
                centralize.knowledge.topTypes.map((entry) => (
                  <div key={entry.type} className='flex justify-between'>
                    <span>{entry.type}</span>
                    <span>{entry.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div>
            <p className='text-sm font-semibold'>Open Findings by Severity</p>
            <div className='mt-2 space-y-1 rounded-md border p-3 text-sm'>
              {comply.findings.openBySeverity.length === 0 ? (
                <p className='text-xs text-muted-foreground'>No open findings.</p>
              ) : (
                comply.findings.openBySeverity.map((entry) => (
                  <div key={entry.severity} className='flex justify-between'>
                    <span>{entry.severity}</span>
                    <span>{entry.count}</span>
                  </div>
                ))
              )}
              <p className='mt-2 text-[11px] text-muted-foreground'>Avg resolution: {comply.findings.avgResolutionDays} days · Open reviews: {comply.reviews.openRequests} · Avg review cycle: {comply.reviews.avgCycleDays} days</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
