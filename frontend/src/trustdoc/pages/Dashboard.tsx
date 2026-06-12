import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Server,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { useTrustDocStore } from '../store'
import { CategoryTag, StatusPill, AssetStatusPill } from '../ui'
import { timeAgo } from '../format'
import { agentSkills } from '../agent/skills'

function navigate(hash: string) {
  window.location.hash = hash
}

export function Dashboard() {
  const documents = useTrustDocStore((s) => s.documents)
  const assets = useTrustDocStore((s) => s.assets)

  const documentedAssetIds = new Set(
    documents.map((d) => d.linkedAssetId).filter(Boolean) as string[]
  )
  const coverage = assets.length
    ? Math.round((Array.from(documentedAssetIds).filter((id) => assets.some((a) => a.id === id)).length / assets.length) * 100)
    : 100
  const outdated = documents.filter((d) => d.status === 'Outdated').length
  const recent = [...documents]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)
  const attentionAssets = assets.filter((a) => a.status !== 'Operational')

  const stats = [
    {
      label: 'Documents',
      value: documents.length,
      hint: `${documents.filter((d) => d.status === 'Published').length} published`,
      icon: FileText,
      tone: 'text-blue-500 bg-blue-500/10',
    },
    {
      label: 'Coverage',
      value: `${coverage}%`,
      hint: 'Assets with documentation',
      icon: TrendingUp,
      tone: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      label: 'Infrastructure',
      value: assets.length,
      hint: `${assets.filter((a) => a.status === 'Operational').length} operational`,
      icon: Server,
      tone: 'text-violet-500 bg-violet-500/10',
    },
    {
      label: 'Needs review',
      value: outdated,
      hint: 'Outdated documents',
      icon: AlertTriangle,
      tone: 'text-amber-500 bg-amber-500/10',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-6 lg:p-8">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              IT documentation, kept current
            </div>
            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">Welcome back</h1>
            <p className="mt-2 text-muted-foreground">
              A focused workspace for server, network and infrastructure documentation — with an
              expert agent that drafts it for you.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={() => navigate('agent')} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Run the Agent
              </Button>
              <Button variant="outline" onClick={() => navigate('library')} className="gap-2">
                Browse Library
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="card-hover">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.tone}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-sm font-medium">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.hint}</div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent documents */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent documentation</CardTitle>
              <CardDescription>Latest updates across your library</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('library')} className="gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {recent.map((doc) => (
              <button
                key={doc.id}
                onClick={() => navigate(`document/${doc.id}`)}
                className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent/60"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Updated {timeAgo(doc.updatedAt)} · {doc.owner}
                  </p>
                </div>
                <CategoryTag category={doc.category} />
                <StatusPill status={doc.status} />
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Infrastructure attention */}
        <Card>
          <CardHeader>
            <CardTitle>Infrastructure health</CardTitle>
            <CardDescription>Assets needing attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {attentionAssets.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                All systems operational.
              </p>
            ) : (
              attentionAssets.map((a) => (
                <button
                  key={a.id}
                  onClick={() => navigate('infrastructure')}
                  className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-accent/60"
                >
                  <div>
                    <p className="text-sm font-medium">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.type}</p>
                  </div>
                  <AssetStatusPill status={a.status} />
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agent skills shortcut */}
      <Card>
        <CardHeader>
          <CardTitle>Start with an agent skill</CardTitle>
          <CardDescription>
            Generate standardized documentation in seconds — no chatbot, just expert output.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {agentSkills.slice(0, 6).map((skill) => {
            const Icon = skill.icon
            return (
              <button
                key={skill.id}
                onClick={() => navigate(`agent/${skill.id}`)}
                className="card-hover flex items-start gap-3 rounded-xl border p-4 text-left"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${skill.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{skill.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{skill.tagline}</p>
                </div>
              </button>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
