import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, FileText, Clock, Calendar } from 'lucide-react'

const documentGrowthData = [
  { month: 'Jan', documents: 45, users: 12 },
  { month: 'Feb', documents: 52, users: 15 },
  { month: 'Mar', documents: 61, users: 18 },
  { month: 'Apr', documents: 73, users: 22 },
  { month: 'Mai', documents: 89, users: 28 },
  { month: 'Jun', documents: 102, users: 31 },
  { month: 'Jul', documents: 124, users: 35 },
  { month: 'Aug', documents: 156, users: 38 },
  { month: 'Sep', documents: 178, users: 40 },
  { month: 'Okt', documents: 203, users: 42 },
  { month: 'Nov', documents: 227, users: 44 },
  { month: 'Dez', documents: 245, users: 42 },
]

const categoryData = [
  { name: 'Infrastructure', value: 89, color: '#3b82f6' },
  { name: 'Security', value: 67, color: '#ef4444' },
  { name: 'Network', value: 43, color: '#10b981' },
  { name: 'Development', value: 32, color: '#f59e0b' },
  { name: 'Operations', value: 14, color: '#8b5cf6' },
]

const activityByHourData = [
  { hour: '00:00', activity: 2 },
  { hour: '03:00', activity: 1 },
  { hour: '06:00', activity: 5 },
  { hour: '09:00', activity: 45 },
  { hour: '12:00', activity: 38 },
  { hour: '15:00', activity: 52 },
  { hour: '18:00', activity: 28 },
  { hour: '21:00', activity: 15 },
]

const aiUsageByTypeData = [
  { type: 'Documentation', queries: 487 },
  { type: 'Code Review', queries: 312 },
  { type: 'Troubleshooting', queries: 234 },
  { type: 'Templates', queries: 189 },
  { type: 'Search', queries: 62 },
]

const userEngagementData = [
  { week: 'Week 1', active: 38, new: 5 },
  { week: 'Week 2', active: 40, new: 3 },
  { week: 'Week 3', active: 41, new: 4 },
  { week: 'Week 4', active: 42, new: 2 },
]

export function Analytics() {
  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-3xl font-bold tracking-tight'>Analytics</h2>
        <p className='text-muted-foreground'>
          Deep insights into your documentation and AI usage
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Growth Rate</CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>+18.2%</div>
            <p className='text-xs text-muted-foreground'>vs. last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Avg. Response Time</CardTitle>
            <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>2.4s</div>
            <p className='text-xs text-muted-foreground'>AI chat responses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Documents/User</CardTitle>
            <FileText className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>5.8</div>
            <p className='text-xs text-muted-foreground'>Average per user</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Peak Hour</CardTitle>
            <Calendar className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>15:00</div>
            <p className='text-xs text-muted-foreground'>Most active time</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='documents'>Documents</TabsTrigger>
          <TabsTrigger value='ai'>AI Usage</TabsTrigger>
          <TabsTrigger value='users'>Users</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle>Document & User Growth</CardTitle>
                <CardDescription>Combined growth over the last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <AreaChart data={documentGrowthData}>
                    <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                    <XAxis dataKey='month' className='text-xs' />
                    <YAxis className='text-xs' />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                    <Legend />
                    <Area
                      type='monotone'
                      dataKey='documents'
                      stackId='1'
                      stroke='hsl(var(--primary))'
                      fill='hsl(var(--primary))'
                      fillOpacity={0.6}
                    />
                    <Area
                      type='monotone'
                      dataKey='users'
                      stackId='2'
                      stroke='hsl(142.1 76.2% 36.3%)'
                      fill='hsl(142.1 76.2% 36.3%)'
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documents by Category</CardTitle>
                <CardDescription>Distribution across different categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      label={({ name, percent }: any) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill='#8884d8'
                      dataKey='value'
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Activity by Time of Day</CardTitle>
              <CardDescription>User activity distribution throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={300}>
                <BarChart data={activityByHourData}>
                  <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                  <XAxis dataKey='hour' className='text-xs' />
                  <YAxis className='text-xs' />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                  <Bar dataKey='activity' fill='hsl(var(--primary))' radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='documents' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle>Document Growth Trend</CardTitle>
                <CardDescription>Monthly document creation over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <LineChart data={documentGrowthData}>
                    <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                    <XAxis dataKey='month' className='text-xs' />
                    <YAxis className='text-xs' />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                    <Line
                      type='monotone'
                      dataKey='documents'
                      stroke='hsl(var(--primary))'
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Categories</CardTitle>
                <CardDescription>Most popular documentation categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <BarChart data={categoryData} layout='vertical'>
                    <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                    <XAxis type='number' className='text-xs' />
                    <YAxis dataKey='name' type='category' className='text-xs' width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                    <Bar dataKey='value' fill='hsl(var(--primary))' radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='ai' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle>AI Queries by Type</CardTitle>
                <CardDescription>Breakdown of AI assistant usage</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <BarChart data={aiUsageByTypeData}>
                    <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                    <XAxis dataKey='type' className='text-xs' angle={-45} textAnchor='end' height={80} />
                    <YAxis className='text-xs' />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                    <Bar dataKey='queries' fill='hsl(142.1 76.2% 36.3%)' radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Query Distribution</CardTitle>
                <CardDescription>AI usage by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <PieChart>
                    <Pie
                      data={aiUsageByTypeData}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      label={({ name, percent }: any) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill='#8884d8'
                      dataKey='queries'
                    >
                      {aiUsageByTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 70}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='users' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>User Engagement</CardTitle>
              <CardDescription>Active users and new signups over the last 4 weeks</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={300}>
                <BarChart data={userEngagementData}>
                  <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                  <XAxis dataKey='week' className='text-xs' />
                  <YAxis className='text-xs' />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey='active' fill='hsl(var(--primary))' radius={[8, 8, 0, 0]} />
                  <Bar dataKey='new' fill='hsl(142.1 76.2% 36.3%)' radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Analytics