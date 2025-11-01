import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAnalytics } from '@/hooks/useAnalytics'

export function DocumentsChart() {
  const { data: analyticsData, isLoading } = useAnalytics()
  
  // Use real data from analytics or empty array
  const chartData = analyticsData?.charts?.documentGrowth || []
  
  // If no data, show placeholder
  const displayData = chartData.length > 0 
    ? chartData.map(item => ({ month: item.month, documents: item.documents }))
    : [{ month: 'No Data', documents: 0 }]

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dokumenten-Entwicklung</CardTitle>
          <CardDescription>Anzahl der Dokumente über die letzten 12 Monate</CardDescription>
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
        <CardTitle>Dokumenten-Entwicklung</CardTitle>
        <CardDescription>Anzahl der Dokumente über die letzten 12 Monate</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width='100%' height={300}>
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
            <XAxis dataKey='month' className='text-xs' />
            <YAxis className='text-xs' />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Line 
              type='monotone' 
              dataKey='documents' 
              stroke='hsl(var(--primary))' 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
