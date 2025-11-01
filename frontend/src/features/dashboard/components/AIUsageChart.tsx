import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAnalytics } from '@/hooks/useAnalytics'

export function AIUsageChart() {
  const { data: analyticsData, isLoading } = useAnalytics()
  
  // For now, show placeholder - AI usage data can be added later
  const data = [
    { day: 'Mo', queries: 0 },
    { day: 'Di', queries: 0 },
    { day: 'Mi', queries: 0 },
    { day: 'Do', queries: 0 },
    { day: 'Fr', queries: 0 },
    { day: 'Sa', queries: 0 },
    { day: 'So', queries: 0 },
  ]

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI-Nutzung</CardTitle>
          <CardDescription>Chat-Anfragen der letzten 7 Tage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center h-[300px] text-muted-foreground'>
            Loading...
          </div>
        </CardContent>
      </Card>
    )
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Nutzung</CardTitle>
        <CardDescription>Chat-Anfragen der letzten 7 Tage</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width='100%' height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
            <XAxis dataKey='day' className='text-xs' />
            <YAxis className='text-xs' />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Bar 
              dataKey='queries' 
              fill='hsl(var(--primary))' 
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
