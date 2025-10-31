import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { month: 'Jan', documents: 45 },
  { month: 'Feb', documents: 52 },
  { month: 'Mar', documents: 61 },
  { month: 'Apr', documents: 73 },
  { month: 'Mai', documents: 89 },
  { month: 'Jun', documents: 102 },
  { month: 'Jul', documents: 124 },
  { month: 'Aug', documents: 156 },
  { month: 'Sep', documents: 178 },
  { month: 'Okt', documents: 203 },
  { month: 'Nov', documents: 227 },
  { month: 'Dez', documents: 245 },
]

export function DocumentsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dokumenten-Entwicklung</CardTitle>
        <CardDescription>Anzahl der Dokumente über die letzten 12 Monate</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width='100%' height={300}>
          <LineChart data={data}>
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
