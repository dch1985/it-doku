import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAnalytics } from '@/hooks/useAnalytics'

export function DocumentsChart() {
  const { data: analyticsData, isLoading } = useAnalytics()
  const automation = analyticsData?.automation

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Automation Overview</CardTitle>
          <CardDescription>Loading automation metrics…</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='h-[220px] w-full animate-pulse rounded-md bg-muted' />
        </CardContent>
      </Card>
    )
  }

  if (!automation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Automation Overview</CardTitle>
          <CardDescription>No automation data available yet.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automation Overview</CardTitle>
        <CardDescription>Jobs &amp; suggestions from the last 7 days</CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid gap-3 md:grid-cols-3'>
          <div className='rounded-lg border border-border bg-muted/30 p-4'>
            <p className='text-xs uppercase text-muted-foreground'>Jobs Started</p>
            <p className='text-2xl font-semibold'>{automation.jobs.started}</p>
            <p className='text-xs text-muted-foreground'>Completed: {automation.jobs.completed}</p>
          </div>
          <div className='rounded-lg border border-border bg-muted/30 p-4'>
            <p className='text-xs uppercase text-muted-foreground'>Completion Rate</p>
            <p className='text-2xl font-semibold'>{automation.jobs.completionRate}%</p>
            <p className='text-xs text-muted-foreground'>Failed: {automation.jobs.failed}</p>
          </div>
          <div className='rounded-lg border border-border bg-muted/30 p-4'>
            <p className='text-xs uppercase text-muted-foreground'>Applied Suggestions</p>
            <p className='text-2xl font-semibold'>{automation.suggestions.applied}</p>
            <p className='text-xs text-muted-foreground'>Time saved ≈ {automation.suggestions.estimatedTimeSavedHours} h</p>
          </div>
        </div>

        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <p className='text-sm font-semibold'>Connector Health</p>
            <span className='text-xs text-muted-foreground'>Open findings: {automation.findingsOpen}</span>
          </div>
          <div className='space-y-1'>
            {automation.connectors.length === 0 ? (
              <p className='text-xs text-muted-foreground'>No connectors configured.</p>
            ) : (
              automation.connectors.map((connector) => (
                <div
                  key={connector.id}
                  className='flex items-center justify-between rounded-md border px-3 py-2 text-sm'
                >
                  <div>
                    <p className='font-medium'>{connector.name}</p>
                    <p className='text-xs text-muted-foreground'>{connector.type}</p>
                  </div>
                  <div className='text-right'>
                    <span
                      className={
                        connector.status === 'OK'
                          ? 'text-xs font-semibold text-green-500'
                          : connector.status === 'OFFLINE'
                            ? 'text-xs font-semibold text-red-500'
                            : 'text-xs font-semibold text-amber-500'
                      }
                    >
                      {connector.status}
                    </span>
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
  )
}
