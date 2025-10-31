import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { day: 'Mo', queries: 187 },
  { day: 'Di', queries: 214 },
  { day: 'Mi', queries: 156 },
  { day: 'Do', queries: 243 },
  { day: 'Fr', queries: 198 },
  { day: 'Sa', queries: 89 },
  { day: 'So', queries: 67 },
]

export function AIUsageChart() {
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
