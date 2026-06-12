import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Moon, Sun, Monitor, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useThemeStore } from '@/stores/themeStore'
import { useAuthWrapper } from '@/hooks/useAuthWrapper'
import { useTrustDocStore } from '../store'

export function Settings() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const { user } = useAuthWrapper()
  const resetDemoData = useTrustDocStore((s) => s.resetDemoData)

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your workspace preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Your account details.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input defaultValue={user?.name || 'IT Administrator'} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input defaultValue={user?.email || user?.username || 'admin@trustdoc.io'} />
          </div>
          <div className="space-y-2">
            <Label>Organization</Label>
            <Input defaultValue="TrustDoc" />
          </div>
          <div className="space-y-2">
            <Label>Default site</Label>
            <Input defaultValue="Frankfurt Data Center" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Choose how TrustDoc looks.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((opt) => {
              const Icon = opt.icon
              const active = theme === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={
                    'flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors ' +
                    (active
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'hover:bg-accent/60 text-muted-foreground')
                  }
                >
                  <Icon className="h-5 w-5" />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workspace data</CardTitle>
          <CardDescription>Demo data is stored locally in your browser.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Reset documents and infrastructure back to the sample data set.
          </p>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              resetDemoData()
              toast.success('Demo data reset')
            }}
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
