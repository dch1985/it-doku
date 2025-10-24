import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useThemeStore } from '@/stores/themeStore'
import { toast } from 'sonner'
import { User, Key, Bell, Palette, Database, Github } from 'lucide-react'

export function Settings() {
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)

  const handleSave = () => {
    toast.success('Settings saved successfully!')
  }

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-3xl font-bold tracking-tight'>Settings</h2>
        <p className='text-muted-foreground'>
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue='profile' className='space-y-4'>
        <TabsList className='grid w-full grid-cols-6'>
          <TabsTrigger value='profile'>
            <User className='mr-2 h-4 w-4' />
            Profile
          </TabsTrigger>
          <TabsTrigger value='api'>
            <Key className='mr-2 h-4 w-4' />
            API Keys
          </TabsTrigger>
          <TabsTrigger value='appearance'>
            <Palette className='mr-2 h-4 w-4' />
            Appearance
          </TabsTrigger>
          <TabsTrigger value='notifications'>
            <Bell className='mr-2 h-4 w-4' />
            Notifications
          </TabsTrigger>
          <TabsTrigger value='integrations'>
            <Github className='mr-2 h-4 w-4' />
            Integrations
          </TabsTrigger>
          <TabsTrigger value='storage'>
            <Database className='mr-2 h-4 w-4' />
            Storage
          </TabsTrigger>
        </TabsList>

        <TabsContent value='profile' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and profile settings
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='name'>Full Name</Label>
                <Input id='name' defaultValue='Driss Chaouat' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <Input id='email' type='email' defaultValue='driss.chaouat@example.com' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='role'>Role</Label>
                <Input id='role' defaultValue='IT Consultant' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='company'>Company</Label>
                <Input id='company' defaultValue='EnBW AG / Westenergie AG' />
              </div>
              <Separator />
              <div className='flex justify-end gap-2'>
                <Button variant='outline'>Cancel</Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='api' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Azure OpenAI Configuration</CardTitle>
              <CardDescription>
                Manage your Azure OpenAI API credentials
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='endpoint'>Azure Endpoint</Label>
                <Input 
                  id='endpoint' 
                  defaultValue='https://trustdocs.openai.azure.com/' 
                  placeholder='https://your-resource.openai.azure.com'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='api-key'>API Key</Label>
                <Input 
                  id='api-key' 
                  type='password' 
                  defaultValue='••••••••••••••••'
                  placeholder='Your Azure OpenAI API Key'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='deployment'>Deployment Name</Label>
                <Input id='deployment' defaultValue='gpt-4' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='api-version'>API Version</Label>
                <Input id='api-version' defaultValue='2024-02-01' />
              </div>
              <Separator />
              <div className='flex justify-end gap-2'>
                <Button variant='outline'>Test Connection</Button>
                <Button onClick={handleSave}>Save API Keys</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='appearance' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize the look and feel of your application
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-4'>
                <Label>Theme</Label>
                <div className='grid grid-cols-3 gap-4'>
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    className='w-full'
                    onClick={() => setTheme('light')}
                  >
                    ☀️ Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    className='w-full'
                    onClick={() => setTheme('dark')}
                  >
                    🌙 Dark
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    className='w-full'
                    onClick={() => setTheme('system')}
                  >
                    💻 System
                  </Button>
                </div>
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Compact Mode</Label>
                  <p className='text-sm text-muted-foreground'>
                    Reduce spacing and make UI more compact
                  </p>
                </div>
                <Switch />
              </div>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Animations</Label>
                  <p className='text-sm text-muted-foreground'>
                    Enable smooth transitions and animations
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='notifications' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Document Updates</Label>
                  <p className='text-sm text-muted-foreground'>
                    Get notified when documents are updated
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>AI Chat Responses</Label>
                  <p className='text-sm text-muted-foreground'>
                    Notifications for AI chat completions
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>New Templates</Label>
                  <p className='text-sm text-muted-foreground'>
                    Alert when new templates are available
                  </p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>System Updates</Label>
                  <p className='text-sm text-muted-foreground'>
                    Important system and maintenance notifications
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='integrations' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>GitHub Integration</CardTitle>
              <CardDescription>
                Connect your GitHub repositories for code documentation
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='github-token'>GitHub Personal Access Token</Label>
                <Input 
                  id='github-token' 
                  type='password' 
                  placeholder='ghp_xxxxxxxxxxxx'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='github-org'>Organization/Username</Label>
                <Input id='github-org' placeholder='your-org-name' />
              </div>
              <Separator />
              <div className='flex justify-end gap-2'>
                <Button variant='outline'>Disconnect</Button>
                <Button onClick={handleSave}>Connect GitHub</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='storage' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Storage Management</CardTitle>
              <CardDescription>
                Monitor and manage your storage usage
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span>Storage Used</span>
                  <span className='font-medium'>2.4 GB / 15 GB</span>
                </div>
                <div className='h-2 w-full rounded-full bg-muted'>
                  <div className='h-2 w-[16%] rounded-full bg-primary' />
                </div>
              </div>
              <Separator />
              <div className='space-y-2'>
                <Label>Storage Breakdown</Label>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span>Documents</span>
                    <span className='text-muted-foreground'>1.8 GB</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Images</span>
                    <span className='text-muted-foreground'>450 MB</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Attachments</span>
                    <span className='text-muted-foreground'>150 MB</span>
                  </div>
                </div>
              </div>
              <Separator />
              <div className='flex justify-end gap-2'>
                <Button variant='outline'>Clear Cache</Button>
                <Button variant='destructive'>Delete Old Files</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}