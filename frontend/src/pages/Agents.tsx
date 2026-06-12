import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Bot, Server, Network, Shield, HardDrive, AlertTriangle, Search,
  CheckCircle2, XCircle, Clock, ArrowRight, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAgents, AgentSkill } from '@/hooks/useAgents';
import { cn } from '@/lib/utils';

const categoryIcons: Record<string, typeof Server> = {
  server: Server,
  network: Network,
  security: Shield,
  backup: HardDrive,
  compliance: Search,
  operations: AlertTriangle,
};

const categoryColors: Record<string, string> = {
  server: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  network: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  security: 'bg-red-500/10 text-red-600 dark:text-red-400',
  backup: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  compliance: 'bg-green-500/10 text-green-600 dark:text-green-400',
  operations: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
};

const severityColors: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-600 border-red-200',
  high: 'bg-orange-500/10 text-orange-600 border-orange-200',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-200',
  low: 'bg-blue-500/10 text-blue-600 border-blue-200',
  info: 'bg-gray-500/10 text-gray-600 border-gray-200',
};

export function Agents() {
  const { skills, loading, running, lastResult, fetchSkills, runSkill, setLastResult } = useAgents();
  const [selectedSkill, setSelectedSkill] = useState<AgentSkill | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [resultOpen, setResultOpen] = useState(false);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const handleOpenSkill = (skill: AgentSkill) => {
    setSelectedSkill(skill);
    setFormValues({});
    setLastResult(null);
  };

  const handleRun = async () => {
    if (!selectedSkill) return;
    try {
      await runSkill(selectedSkill.id, formValues);
      setSelectedSkill(null);
      setResultOpen(true);
    } catch {
      // handled in hook
    }
  };

  const grouped = skills.reduce<Record<string, AgentSkill[]>>((acc, skill) => {
    (acc[skill.category] ||= []).push(skill);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl trust-gradient">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Trust Doc Agents</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Specialized IT documentation agents with expert skills. Run focused tasks — no chatbot, just results.
          </p>
        </div>
        {lastResult && (
          <Button variant="outline" onClick={() => setResultOpen(true)}>
            <Clock className="mr-2 h-4 w-4" />
            Last Result
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="trust-card border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{skills.length}</p>
                <p className="text-sm text-muted-foreground">Expert Skills</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="trust-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Server className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">6</p>
                <p className="text-sm text-muted-foreground">IT Domains</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="trust-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">NIST</p>
                <p className="text-sm text-muted-foreground">Compliant Output</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">Loading agent skills...</div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Skills</TabsTrigger>
            {Object.keys(grouped).map((cat) => (
              <TabsTrigger key={cat} value={cat} className="capitalize">{cat}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {skills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} onRun={() => handleOpenSkill(skill)} />
              ))}
            </div>
          </TabsContent>

          {Object.entries(grouped).map(([cat, catSkills]) => (
            <TabsContent key={cat} value={cat} className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {catSkills.map((skill) => (
                  <SkillCard key={skill.id} skill={skill} onRun={() => handleOpenSkill(skill)} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Skill Input Dialog */}
      <Dialog open={!!selectedSkill} onOpenChange={(open) => !open && setSelectedSkill(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedSkill && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    const Icon = categoryIcons[selectedSkill.category] || Bot;
                    return <Icon className="h-5 w-5 text-primary" />;
                  })()}
                  {selectedSkill.name}
                </DialogTitle>
                <DialogDescription>{selectedSkill.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {selectedSkill.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={field.key}
                        placeholder={field.placeholder}
                        value={formValues[field.key] || ''}
                        onChange={(e) => setFormValues((v) => ({ ...v, [field.key]: e.target.value }))}
                        rows={3}
                      />
                    ) : field.type === 'select' ? (
                      <Select
                        value={formValues[field.key] || ''}
                        onValueChange={(val) => setFormValues((v) => ({ ...v, [field.key]: val }))}
                      >
                        <SelectTrigger id={field.key}>
                          <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={field.key}
                        placeholder={field.placeholder}
                        value={formValues[field.key] || ''}
                        onChange={(e) => setFormValues((v) => ({ ...v, [field.key]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedSkill(null)}>Cancel</Button>
                <Button onClick={handleRun} disabled={running}>
                  {running ? 'Running...' : (
                    <>
                      Run Agent
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {lastResult && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  {lastResult.title}
                </DialogTitle>
                <DialogDescription>
                  Completed in {lastResult.metadata.durationMs}ms · {lastResult.metadata.sectionsGenerated} sections
                </DialogDescription>
              </DialogHeader>

              {lastResult.findings && lastResult.findings.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Findings</h3>
                  {lastResult.findings.map((f, i) => (
                    <div key={i} className={cn('rounded-lg border p-3 text-sm', severityColors[f.severity])}>
                      <div className="flex items-center gap-2 font-medium">
                        <Badge variant="outline" className="text-xs capitalize">{f.severity}</Badge>
                        {f.section}
                      </div>
                      <p className="mt-1">{f.message}</p>
                      <p className="mt-1 text-xs opacity-80">→ {f.recommendation}</p>
                    </div>
                  ))}
                </div>
              )}

              {lastResult.checklist && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Checklist</h3>
                  {lastResult.checklist.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                      <XCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <span>{item.item}</span>
                    </div>
                  ))}
                </div>
              )}

              <div
                className="prose prose-sm dark:prose-invert max-w-none rounded-xl border p-4 bg-muted/30"
                dangerouslySetInnerHTML={{ __html: lastResult.content }}
              />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setResultOpen(false)}>Close</Button>
                <Button onClick={() => {
                  navigator.clipboard.writeText(lastResult.content.replace(/<[^>]*>/g, ''));
                  toast.success('Copied to clipboard');
                }}>
                  Copy Result
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SkillCard({ skill, onRun }: { skill: AgentSkill; onRun: () => void }) {
  const Icon = categoryIcons[skill.category] || Bot;
  const colorClass = categoryColors[skill.category] || 'bg-gray-500/10 text-gray-600';

  return (
    <Card className="trust-card group cursor-pointer" onClick={onRun}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', colorClass)}>
            <Icon className="h-5 w-5" />
          </div>
          <Badge variant="outline" className="text-xs capitalize">{skill.outputType}</Badge>
        </div>
        <CardTitle className="text-base mt-3">{skill.name}</CardTitle>
        <CardDescription className="text-sm line-clamp-2">{skill.description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button variant="ghost" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          Run Agent
          <ArrowRight className="ml-2 h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default Agents;
