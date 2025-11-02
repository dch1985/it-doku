import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Shield, Sparkles, Users, Zap, Lock, Globe, Server, Layers, Network, GitBranch, CheckCircle2 } from 'lucide-react'
import { useAuthWrapper } from '@/hooks/useAuthWrapper'
import { useEffect } from 'react'

const platformPillars = [
  {
    title: 'Knowledge Graph',
    description: 'Structured entities for assets, apps, services, policies. Map your entire IT ecosystem.',
    icon: Network,
    details: 'Asset mapping • Service dependency tracking • Policy alignment'
  },
  {
    title: 'AI Engine',
    description: 'Context-aware drafting, refactoring, gap analysis. Private by design with on-premise options.',
    icon: Sparkles,
    details: 'AI-assisted authoring • Intelligent search • Gap analysis'
  },
  {
    title: 'Templates & Standards',
    description: 'Pre-built templates for servers, networks, M365, policies, DR, and SOPs. NIST-compliant by default.',
    icon: Layers,
    details: '15+ templates • Custom workflows • Version control'
  },
  {
    title: 'Governance',
    description: 'Versioning, approvals, and evidence trails. Audit-ready documentation at your fingertips.',
    icon: Shield,
    details: 'Review workflows • RBAC & SSO • Audit packs'
  },
  {
    title: 'Integrations',
    description: 'Connect Entra ID (Azure AD), Intune, CMDB, ITSM systems. Webhooks and API-first architecture.',
    icon: GitBranch,
    details: 'SSO/SCIM • API & webhooks • CMDB sync'
  }
]

const capabilities = [
  {
    title: 'AI-assisted authoring',
    description: 'Generate documentation from natural language prompts.',
    icon: Sparkles
  },
  {
    title: 'Smart templates',
    description: 'NIST-compliant templates that adapt to your needs.',
    icon: Layers
  },
  {
    title: 'Version history',
    description: 'Complete audit trail of all changes and reviews.',
    icon: CheckCircle2
  },
  {
    title: 'Review workflows',
    description: 'Approval chains and collaborative editing.',
    icon: Users
  },
  {
    title: 'RBAC & SSO',
    description: 'Enterprise-grade access control and authentication.',
    icon: Lock
  },
  {
    title: 'Multi-format export',
    description: 'PDF, DOCX, Markdown export with custom branding.',
    icon: FileText
  },
  {
    title: 'API & webhooks',
    description: 'Integrate with your existing toolchain seamlessly.',
    icon: GitBranch
  },
  {
    title: 'Audit packs',
    description: 'Generate compliance reports in under 60 seconds.',
    icon: Shield
  }
]

const solutions = [
  {
    title: 'MSPs',
    subtitle: 'Standardize client documentation',
    pain: 'Scattered documentation, slow onboarding, audit churn',
    outcome: 'Standardized client workspaces, faster onboarding, consistent deliverables',
    badge: 'Multi-tenant'
  },
  {
    title: 'Internal IT',
    subtitle: 'Maintain comprehensive IT docs',
    pain: 'Outdated documentation, knowledge gaps, compliance risk',
    outcome: 'Always up-to-date docs, knowledge retention, audit-ready',
    badge: null
  },
  {
    title: 'Cloud Admins',
    subtitle: 'Document infrastructure at scale',
    pain: 'Rapid infrastructure changes, complex dependencies, manual processes',
    outcome: 'Auto-synced documentation, dependency graphs, CI/CD integration',
    badge: 'Auto-sync'
  },
  {
    title: 'Security & Compliance',
    subtitle: 'Meet regulatory requirements',
    pain: 'Audit preparation time, compliance gaps, evidence collection',
    outcome: '<60s audit reports, gap analysis, evidence trails',
    badge: 'Compliance'
  }
]

const metrics = [
  { value: '15+', label: 'Prebuilt Templates', sublabel: 'Server, Network, M365, Policy' },
  { value: '99.9%', label: 'Uptime SLA', sublabel: 'Enterprise-grade reliability' },
  { value: '<60s', label: 'Audit Report Generation', sublabel: 'Fully automated' },
  { value: 'EU/US', label: 'Data Residency', sublabel: 'Your choice of region' }
]

export function LandingPage() {
  const { isAuthenticated, isLoading, login } = useAuthWrapper()

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      window.location.hash = ''
    }
  }, [isAuthenticated, isLoading])

  const handleGetStarted = async () => {
    await login()
  }

  const handleTalkToSales = () => {
    // TODO: Open contact modal or redirect to contact page
    window.alert('Contact our sales team: sales@trustdoc.com')
  }

  const scrollToPlatform = () => {
    document.getElementById('platform')?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToSolutions = () => {
    document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 backdrop-blur-md bg-background/80">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold tracking-tight">TrustDoc</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <button onClick={scrollToPlatform} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Platform
              </button>
              <button onClick={scrollToSolutions} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Solutions
              </button>
              <Button onClick={handleGetStarted} variant="ghost" className="text-sm">
                Portal
              </Button>
              <Button onClick={handleGetStarted} className="text-sm">
                Start Free Trial
              </Button>
            </div>
            <div className="md:hidden">
              <Button onClick={handleGetStarted} size="sm">
                Start
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-24 lg:pt-40 lg:pb-32">
        <div className="absolute inset-0 -z-10">
          <div className="blur-shape blur-shape-beige absolute -top-40 -left-40 w-[600px] h-[600px] opacity-20" />
          <div className="blur-shape blur-shape-dark absolute -bottom-40 -right-40 w-[600px] h-[600px] opacity-20" />
        </div>
        
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50 backdrop-blur-sm mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">AI-powered IT documentation</span>
            </div>

            <h1 className="text-6xl lg:text-8xl font-bold tracking-tight mb-6 leading-none">
              Document with confidence.<br />
              <span className="bg-gradient-to-r from-primary to-muted-foreground bg-clip-text text-transparent">
                Operate with proof.
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mb-4 leading-relaxed">
              TrustDoc is the documentation platform engineered for <strong className="text-foreground">MSPs and IT teams</strong> — combining a knowledge graph, AI, and governance to deliver audit-ready documentation at scale.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-12">
              <Button 
                size="lg" 
                className="text-lg px-10 py-7 h-auto bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleGetStarted}
              >
                Start Free Trial
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-10 py-7 h-auto"
                onClick={handleTalkToSales}
              >
                Talk to Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Bar */}
      <section className="border-y border-border/40 bg-card/30">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {metrics.map((metric, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold mb-2">{metric.value}</div>
                <div className="text-sm font-medium text-foreground uppercase tracking-wide mb-1">{metric.label}</div>
                <div className="text-xs text-muted-foreground">{metric.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Pillars Section */}
      <section id="platform" className="py-24 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto mb-20 text-center">
            <p className="text-lg text-muted-foreground mb-4">Our Platform</p>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              Built for <span className="text-primary">mission-critical</span> IT operations
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              We take a knowledge-first, innovation-driven approach to developing the infrastructure that underpins the breakthrough technologies of today and tomorrow.
            </p>
          </div>

          <div className="space-y-6 max-w-5xl mx-auto">
            {platformPillars.map((pillar, index) => (
              <Card key={index} className="glass-card border border-border/50 hover:border-primary/50 transition-all duration-300">
                <CardHeader className="pb-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <pillar.icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-3">{pillar.title}</CardTitle>
                      <CardDescription className="text-base leading-relaxed mb-4">
                        {pillar.description}
                      </CardDescription>
                      <div className="text-sm text-primary font-medium">
                        {pillar.details}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section className="py-24 lg:py-32 border-y border-border/40 bg-card/20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Everything you need
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              A comprehensive solution for your entire IT documentation lifecycle
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {capabilities.map((capability, index) => (
              <Card 
                key={index} 
                className="glass-card border border-border/50 hover:border-primary/50 transition-all duration-300 group"
              >
                <CardHeader>
                  <capability.icon className="h-10 w-10 mb-4 text-primary group-hover:scale-110 transition-transform duration-300" />
                  <CardTitle className="text-base mb-2">{capability.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {capability.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="py-24 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto mb-20 text-center">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Built for your use case
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Flexible by design, engineered to evolve alongside new technologies
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {solutions.map((solution, index) => (
              <Card 
                key={index} 
                className="glass-card border border-border/50 hover:border-primary/50 transition-all duration-300"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <CardTitle className="text-2xl mb-1">{solution.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mb-4">{solution.subtitle}</p>
                    </div>
                    {solution.badge && (
                      <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                        {solution.badge}
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Challenge</p>
                      <p className="text-sm">{solution.pain}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Outcome</p>
                      <p className="text-sm font-medium">{solution.outcome}</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Teaser */}
      <section className="py-24 lg:py-32 border-y border-border/40 bg-card/20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-3xl font-bold">Security & Compliance</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="font-medium mb-2">SSO/SCIM</p>
                <p className="text-sm text-muted-foreground">Enterprise-grade authentication and provisioning</p>
              </div>
              <div>
                <p className="font-medium mb-2">Encryption</p>
                <p className="text-sm text-muted-foreground">At-rest and in-transit encryption, EU hosting option</p>
              </div>
              <div>
                <p className="font-medium mb-2">Audit Logs</p>
                <p className="text-sm text-muted-foreground">Complete audit trails and DPA compliance</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32 border-t border-border/40">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <Card className="glass-card border-2 border-primary/20 bg-gradient-to-br from-card to-card/50">
              <CardHeader className="space-y-6 pb-8">
                <Sparkles className="h-16 w-16 mx-auto text-primary" />
                <CardTitle className="text-4xl lg:text-5xl">
                  Ready to get started?
                </CardTitle>
                <CardDescription className="text-xl text-muted-foreground">
                  Start your free trial today or talk to our sales team.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="text-lg px-10 py-7 h-auto"
                  onClick={handleGetStarted}
                >
                  Start Free Trial
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-10 py-7 h-auto"
                  onClick={handleTalkToSales}
                >
                  Book a Demo
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-12">
              <div className="flex items-center gap-2 mb-4 md:mb-0">
                <FileText className="h-6 w-6 text-primary" />
                <span className="text-xl font-semibold">TrustDoc</span>
              </div>
              <div className="flex items-center gap-6">
                <button onClick={scrollToPlatform} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Platform
                </button>
                <button onClick={scrollToSolutions} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Solutions
                </button>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Resources
                </a>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Security
                </a>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Pricing
                </a>
              </div>
            </div>
            
            <div className="pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
              © 2025 TrustDoc Inc. | Privacy | Terms | DPA | Status
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
