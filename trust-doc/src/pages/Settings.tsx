import { useStore, type Theme } from '@/store/useStore'
import { Button, Card, Input, Label, Select } from '@/components/ui'
import { Download, Monitor, Moon, RotateCcw, Sun } from 'lucide-react'

const STANDARDS = ['ISO 27001', 'NIST CSF', 'BSI IT-Grundschutz', 'Internal baseline']

export function Settings() {
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const docs = useStore((s) => s.docs)
  const resetData = useStore((s) => s.resetData)

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(docs, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'trust-doc-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const themes: { id: Theme; label: string; icon: React.ElementType }[] = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ]

  return (
    <div className="max-w-2xl space-y-5 animate-fade-in">
      <Card className="p-5">
        <h3 className="text-sm font-semibold">Organization</h3>
        <p className="mb-4 text-xs text-muted-foreground">Used across the workspace and reports.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Organization name</Label>
            <Input value={settings.orgName} onChange={(e) => setSettings({ orgName: e.target.value })} />
          </div>
          <div>
            <Label>Compliance standard</Label>
            <Select value={settings.standard} onChange={(e) => setSettings({ standard: e.target.value })}>
              {STANDARDS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold">Appearance</h3>
        <p className="mb-4 text-xs text-muted-foreground">Choose how Trust Doc looks.</p>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((t) => {
            const Icon = t.icon
            const active = theme === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all ${
                  active ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon className="h-5 w-5" />
                {t.label}
              </button>
            )
          })}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold">Data</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Your documentation is stored locally in this browser. {docs.length} document(s).
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportJson}>
            <Download className="h-4 w-4" /> Export JSON
          </Button>
          <Button variant="outline" onClick={resetData}>
            <RotateCcw className="h-4 w-4" /> Reset to sample data
          </Button>
        </div>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Trust Doc · agentic IT documentation · no generative chatbot
      </p>
    </div>
  )
}
