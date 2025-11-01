import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, FileText, Clock, Calendar } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'

// Placeholder data for AI usage (can be replaced later with real data)
const aiUsageByTypeData = [
  { type: 'Documentation', queries: 487 },
  { type: 'Code Review', queries: 312 },
  { type: 'Troubleshooting', queries: 234 },
  { type: 'Templates', queries: 189 },
  { type: 'Search', queries: 62 },
]

export function Analytics() {
  const { data, isLoading } = useAnalytics()

  // Use real data if available, otherwise use empty arrays
  const documentGrowthData = data?.charts?.documentGrowth || []
  const categoryData = data?.charts?.categoryDistribution || []
  const activityByHourData = data?.charts?.activityByHour || []
  const userEngagementData = data?.charts?.userEngagement || []
  
  const stats = data?.stats || {
    growthRate: 0,
    avgResponseTime: 0,
    documentsPerUser: 0,
    peakHour: '09:00'
  }

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>Analytics</h2>
          <p className='text-muted-foreground'>
            Deep insights into your documentation and AI usage
          </p>
        </div>
        <div className='flex items-center justify-center py-12'>
          <div className='text-lg text-muted-foreground'>Loading analytics...</div>
        </div>
      </div>
    )
  }
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
            <div className='text-2xl font-bold'>{stats.growthRate >= 0 ? '+' : ''}{stats.growthRate.toFixed(1)}%</div>
            <p className='text-xs text-muted-foreground'>vs. last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Avg. Response Time</CardTitle>
            <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.avgResponseTime.toFixed(1)}s</div>
            <p className='text-xs text-muted-foreground'>AI chat responses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Documents/User</CardTitle>
            <FileText className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.documentsPerUser.toFixed(1)}</div>
            <p className='text-xs text-muted-foreground'>Average per user</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Peak Hour</CardTitle>
            <Calendar className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.peakHour}</div>
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
                  <AreaChart data={documentGrowthData.length > 0 ? documentGrowthData : [{ month: 'No Data', documents: 0, users: 0 }]}>
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
                  {categoryData.length > 0 ? (
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
                  ) : (
                    <div className='flex items-center justify-center h-full text-muted-foreground'>
                      No category data available
                    </div>
                  )}
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
                <BarChart data={activityByHourData.length > 0 ? activityByHourData : [{ hour: 'No Data', activity: 0 }]}>
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
                <LineChart data={documentGrowthData.length > 0 ? documentGrowthData : [{ month: 'No Data', documents: 0 }]}>
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
                <BarChart data={categoryData.length > 0 ? categoryData : [{ name: 'No Data', value: 0 }]} layout='vertical'>
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
                <BarChart data={userEngagementData.length > 0 ? userEngagementData : [{ week: 'No Data', active: 0, new: 0 }]}>
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