import { Button } from '@/components/ui/button'
import {
  ShieldCheck,
  Server,
  Network,
  DatabaseBackup,
  ScanSearch,
  Workflow,
  Sparkles,
  ArrowRight,
  Check,
} from 'lucide-react'
import { useAuthWrapper } from '@/hooks/useAuthWrapper'
import { useEffect } from 'react'

const skills = [
  { icon: Server, title: 'Server runbooks', desc: 'Standardized server documentation with recovery steps.' },
  { icon: Network, title: 'Network devices', desc: 'Firewalls, switches and routers documented consistently.' },
  { icon: Workflow, title: 'Infrastructure overview', desc: 'Topology assembled straight from your inventory.' },
  { icon: DatabaseBackup, title: 'Backup & DR', desc: 'RPO/RTO-driven recovery plans in seconds.' },
  { icon: ShieldCheck, title: 'Security baselines', desc: 'Hardening controls mapped to common frameworks.' },
  { icon: ScanSearch, title: 'Gap audits', desc: 'Find undocumented assets and stale docs automatically.' },
]

const benefits = [
  'Focused on servers, networks and infrastructure',
  'An expert agent that drafts — no chatbot to babysit',
  'Standardized, review-ready documents every time',
  'Coverage tracking so nothing slips through the cracks',
]

export function LandingPage() {
  const { isAuthenticated, isLoading, login } = useAuthWrapper()

  useEffect(() => {
    if (isAuthenticated && !isLoading) window.location.hash = ''
  }, [isAuthenticated, isLoading])

  const enter = async () => {
    await login()
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[hsl(199_89%_48%)]">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">TrustDoc</span>
          </div>
          <Button onClick={enter} className="gap-2">
            Enter Portal <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pb-24 pt-36 lg:pb-32 lg:pt-44">
        <div className="absolute inset-0 -z-10">
          <div className="blur-shape blur-shape-beige absolute -left-40 -top-40 h-[600px] w-[600px] opacity-30" />
          <div className="blur-shape blur-shape-dark absolute -bottom-40 -right-40 h-[600px] w-[600px] opacity-25" />
        </div>
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/60 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur">
              <Sparkles className="h-4 w-4 text-primary" />
              An agent for IT documentation
            </div>
            <h1 className="mb-6 text-5xl font-bold leading-[1.05] tracking-tight lg:text-7xl">
              Document your <span className="gradient-text">infrastructure</span> with confidence.
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground lg:text-xl">
              TrustDoc is the focused workspace for IT documentation of servers, networks and
              infrastructure — with an expert agent that drafts standardized docs for you.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" onClick={enter} className="h-auto gap-2 px-8 py-6 text-base">
                Enter Portal <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className="border-y border-border/40 bg-card/20 py-20 lg:py-28">
        <div className="container mx-auto px-6">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold lg:text-4xl">Expert skills, not a chatbot</h2>
            <p className="text-lg text-muted-foreground">
              Pick a skill, give it a few facts, and the agent produces a complete, review-ready
              document.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {skills.map((s) => {
              const Icon = s.icon
              return (
                <div
                  key={s.title}
                  className="card-hover rounded-2xl border bg-card p-6"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-1.5 text-lg font-semibold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-6">
          <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-3xl font-bold lg:text-4xl">
                Everything you need. Nothing you don’t.
              </h2>
              <ul className="space-y-4">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check className="h-4 w-4" />
                    </span>
                    <span className="text-muted-foreground">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[hsl(199_89%_48%)]">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Ready in seconds</h3>
              <p className="mb-6 text-muted-foreground">
                Sign in and the agent is ready with six documentation skills and a sample
                environment to explore.
              </p>
              <Button onClick={enter} className="gap-2">
                Enter Portal <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/40 py-10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="font-semibold">TrustDoc</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} TrustDoc · IT documentation, kept current.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
