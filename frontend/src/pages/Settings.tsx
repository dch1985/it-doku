import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useThemeStore } from '@/stores/themeStore'
import { useAuthWrapper } from '@/hooks/useAuthWrapper'
import { toast } from 'sonner'
import { User, Bell, Palette, Sun, Moon, Monitor } from 'lucide-react'

export function Settings() {
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)
  const { user } = useAuthWrapper()

  const handleSave = () => {
    toast.success('Settings saved successfully!')
  }

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-3xl font-bold tracking-tight'>Settings</h2>
        <p className='text-muted-foreground'>Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue='profile' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='profile'>
            <User className='mr-2 h-4 w-4' />
            Profile
          </TabsTrigger>
          <TabsTrigger value='appearance'>
            <Palette className='mr-2 h-4 w-4' />
            Appearance
          </TabsTrigger>
          <TabsTrigger value='notifications'>
            <Bell className='mr-2 h-4 w-4' />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value='profile' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and profile settings</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='name'>Full Name</Label>
                <Input id='name' defaultValue={user?.name ?? ''} placeholder='Your name' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  defaultValue={(user && ('email' in user ? user.email : (user as any).username)) ?? ''}
                  placeholder='you@company.com'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='role'>Role</Label>
                <Input id='role' placeholder='e.g. IT Administrator' />
              </div>
              <Separator />
              <div className='flex justify-end gap-2'>
                <Button variant='outline'>Cancel</Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='appearance' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel of TrustDoc</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-4'>
                <Label>Theme</Label>
                <div className='grid grid-cols-3 gap-4'>
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    className='w-full gap-2'
                    onClick={() => setTheme('light')}
                  >
                    <Sun className='h-4 w-4' />
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    className='w-full gap-2'
                    onClick={() => setTheme('dark')}
                  >
                    <Moon className='h-4 w-4' />
                    Dark
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    className='w-full gap-2'
                    onClick={() => setTheme('system')}
                  >
                    <Monitor className='h-4 w-4' />
                    System
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='notifications' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Document Updates</Label>
                  <p className='text-sm text-muted-foreground'>Get notified when documents are updated</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Agent Findings</Label>
                  <p className='text-sm text-muted-foreground'>
                    Alerts when the documentation agent discovers new findings
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Review Reminders</Label>
                  <p className='text-sm text-muted-foreground'>Reminders when documents are due for review</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Settings
