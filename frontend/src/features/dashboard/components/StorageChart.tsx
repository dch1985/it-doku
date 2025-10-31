import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { month: 'Jan', storage: 0.3 },
  { month: 'Feb', storage: 0.5 },
  { month: 'Mar', storage: 0.7 },
  { month: 'Apr', storage: 0.9 },
  { month: 'Mai', storage: 1.2 },
  { month: 'Jun', storage: 1.5 },
  { month: 'Jul', storage: 1.7 },
  { month: 'Aug', storage: 1.9 },
  { month: 'Sep', storage: 2.1 },
  { month: 'Okt', storage: 2.3 },
  { month: 'Nov', storage: 2.4 },
  { month: 'Dez', storage: 2.4 },
]

export function StorageChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Speicher-Nutzung</CardTitle>
        <CardDescription>Storage-Entwicklung in GB</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width='100%' height={300}>
          <AreaChart data={data}>
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
