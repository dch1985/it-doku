import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAnalytics } from '@/hooks/useAnalytics'

export function StorageChart() {
  const { data: analyticsData, isLoading } = useAnalytics()
  
  // For now, show placeholder - Storage data can be calculated from attachments later
  // Using document growth as approximation for storage growth
  const chartData = analyticsData?.charts?.documentGrowth || []
  const storageData = chartData.length > 0
    ? chartData.map(item => ({ 
        month: item.month, 
        storage: Math.round((item.documents * 0.01) * 100) / 100 // Approximate: 0.01 GB per document
      }))
    : [{ month: 'No Data', storage: 0 }]

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Speicher-Nutzung</CardTitle>
          <CardDescription>Storage-Entwicklung in GB</CardDescription>
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
        <CardTitle>Speicher-Nutzung</CardTitle>
        <CardDescription>Storage-Entwicklung in GB</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width='100%' height={300}>
          <AreaChart data={storageData}>
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
            <Area 
              type='monotone' 
              dataKey='storage' 
              stroke='hsl(var(--primary))' 
              fill='hsl(var(--primary))' 
              fillOpacity={0.2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
