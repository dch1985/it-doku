import { useMemo, useState } from 'react';
import { useAutomation } from '@/hooks/useAutomation';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const connectorTypes = ['GIT', 'TICKET_SYSTEM', 'DOCUMENT_REPO', 'CUSTOM'];

export default function Automate() {
  const { connectorsQuery, jobsQuery, suggestionsQuery, createConnector, createJob, updateSuggestion } = useAutomation();
  const { data: analyticsData, isLoading: analyticsLoading } = useAnalytics();
  const automationMetrics = analyticsData?.automation;

  const connectorHealth = useMemo(() => {
    const base = { OK: 0, DEGRADED: 0, OFFLINE: 0 };
    if (!automationMetrics?.connectors) {
      return base;
    }
    automationMetrics.connectors.forEach((connector) => {
      base[connector.status] = (base[connector.status] ?? 0) + 1;
    });
    return base;
  }, [automationMetrics?.connectors]);

  const [connectorName, setConnectorName] = useState('');
  const [connectorType, setConnectorType] = useState<string>('GIT');
  const [connectorConfig, setConnectorConfig] = useState('');

  const [jobTitle, setJobTitle] = useState('');
  const [jobIntent, setJobIntent] = useState<string>('CREATE');
  const [jobDocumentId, setJobDocumentId] = useState('');
  const [jobConnectorId, setJobConnectorId] = useState('');
  const [jobPayload, setJobPayload] = useState('');

  const handleCreateConnector = () => {
    if (!connectorName) {
      return;
    }
    createConnector.mutate({
      name: connectorName,
      type: connectorType,
      config: connectorConfig ? parseMaybeJson(connectorConfig) : undefined,
    });
    setConnectorName('');
    setConnectorConfig('');
  };

  const handleCreateJob = () => {
    createJob.mutate({
      title: jobTitle || 'Automatischer Entwurf',
      intent: jobIntent,
      documentId: jobDocumentId || undefined,
      connectorId: jobConnectorId || undefined,
      payload: jobPayload ? parseMaybeJson(jobPayload) : undefined,
    });
    setJobTitle('');
    setJobDocumentId('');
    setJobConnectorId('');
    setJobPayload('');
  };

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Automatisierung & Effizienz</h1>
        <p className="text-muted-foreground">
          Verbinde Quellen, starte KI-Generierungen und behalte Vorschläge im Blick. Ziel: aktuelle Dokumentation ohne manuellen Aufwand.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {analyticsLoading && (
          <Card>
            <CardHeader>
              <CardTitle>Automation KPI</CardTitle>
              <CardDescription>Lade Kennzahlen…</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-20 animate-pulse rounded-md bg-muted" />
            </CardContent>
          </Card>
        )}
        {automationMetrics && !analyticsLoading && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Jobs gestartet</CardTitle>
                <CardDescription>letzte 7 Tage</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{automationMetrics.jobs.started}</p>
                <p className="text-xs text-muted-foreground">Abgeschlossen: {automationMetrics.jobs.completed}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Erfolgsquote</CardTitle>
                <CardDescription>Fertigstellungen vs. Fehler</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{automationMetrics.jobs.completionRate}%</p>
                <p className="text-xs text-muted-foreground">Fehlgeschlagen: {automationMetrics.jobs.failed}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Übernommene Vorschläge</CardTitle>
                <CardDescription>Geschätzte Zeitersparnis</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{automationMetrics.suggestions.applied}</p>
                <p className="text-xs text-muted-foreground">≈ {automationMetrics.suggestions.estimatedTimeSavedHours} Stunden</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Connector Health</CardTitle>
                <CardDescription>Aktiv / degradierte / offline</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="flex justify-between">
                  <span>OK</span>
                  <span>{connectorHealth.OK}</span>
                </p>
                <p className="flex justify-between text-amber-500">
                  <span>Degraded</span>
                  <span>{connectorHealth.DEGRADED}</span>
                </p>
                <Separator />
                <p className="flex justify-between text-red-500">
                  <span>Offline</span>
                  <span>{connectorHealth.OFFLINE}</span>
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Offene Findings: {automationMetrics.findingsOpen}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Quellen-Connectoren</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Verbinde Git-Repositories, Ticket-Systeme oder Wissensspeicher als Grundlage für automatische Dokumentation.
          </p>
          <div className="space-y-3">
            <Input
              placeholder="Connector Name"
              value={connectorName}
              onChange={(event) => setConnectorName(event.target.value)}
            />
            <Select value={connectorType} onValueChange={setConnectorType}>
              <SelectTrigger>
                <SelectValue placeholder="Connector Typ" />
              </SelectTrigger>
              <SelectContent>
                {connectorTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Konfiguration (JSON optional)"
              value={connectorConfig}
              onChange={(event) => setConnectorConfig(event.target.value)}
              className="min-h-[120px]"
            />
            <Button onClick={handleCreateConnector} disabled={createConnector.isPending}>
              Connector speichern
            </Button>
          </div>
          <div className="mt-6 space-y-3">
            <h3 className="font-medium">Aktive Connectoren</h3>
            <ul className="space-y-2">
              {connectorsQuery.data?.map((connector) => (
                <li key={connector.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{connector.name}</span>
                    <Badge>{connector.type}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Zuletzt aktualisiert: {new Date(connector.updatedAt).toLocaleString()}</p>
                </li>
              ))}
              {connectorsQuery.data?.length === 0 && (
                <p className="text-sm text-muted-foreground">Noch keine Connectoren hinterlegt.</p>
              )}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Generierungsjobs</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Starte KI-Drafts, Update-Synchronisation oder Qualitätsanalysen. Jobs lassen sich beliebig mit Dokumenten verknüpfen.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Titel / Beschreibung"
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
            />
            <Select value={jobIntent} onValueChange={setJobIntent}>
              <SelectTrigger>
                <SelectValue placeholder="Intent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CREATE">CREATE</SelectItem>
                <SelectItem value="UPDATE">UPDATE</SelectItem>
                <SelectItem value="SUMMARY">SUMMARY</SelectItem>
                <SelectItem value="QUALITY">QUALITY</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Dokument-ID (optional)"
              value={jobDocumentId}
              onChange={(event) => setJobDocumentId(event.target.value)}
            />
            <Select value={jobConnectorId} onValueChange={setJobConnectorId}>
              <SelectTrigger>
                <SelectValue placeholder="Connector (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Keiner</SelectItem>
                {connectorsQuery.data?.map((connector) => (
                  <SelectItem key={connector.id} value={connector.id}>
                    {connector.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="Payload (JSON optional)"
            value={jobPayload}
            onChange={(event) => setJobPayload(event.target.value)}
            className="mt-3 min-h-[120px]"
          />
          <Button className="mt-3" onClick={handleCreateJob} disabled={createJob.isPending}>
            Job starten
          </Button>

          <div className="mt-6 space-y-3">
            <h3 className="font-medium">Letzte Jobs</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
              {jobsQuery.data?.map((job) => (
                <article key={job.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{job.intent}</span>
                    <Badge variant={job.status === 'COMPLETED' ? 'default' : job.status === 'FAILED' ? 'destructive' : 'secondary'}>
                      {job.status}
                    </Badge>
                  </div>
                  {job.resultDraft && (
                    <p className="mt-2 whitespace-pre-wrap text-xs line-clamp-3">
                      {job.resultDraft}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Erstellt: {new Date(job.createdAt).toLocaleString()}
                  </p>
                  {job.completedAt && (
                    <p className="text-xs text-muted-foreground">Abgeschlossen: {new Date(job.completedAt).toLocaleString()}</p>
                  )}
                </article>
              ))}
              {jobsQuery.data?.length === 0 && (
                <p className="text-sm text-muted-foreground">Noch keine Jobs ausgeführt.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Update-Vorschläge</h2>
        <p className="text-sm text-muted-foreground mb-4">
          KI schlägt Änderungen vor. Entscheide, ob der Vorschlag übernommen, zurückgestellt oder verworfen wird.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {suggestionsQuery.data?.map((suggestion) => (
            <article key={suggestion.id} className="rounded-lg border p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold leading-snug">{suggestion.title}</h3>
                <Badge>{suggestion.status}</Badge>
              </div>
              {suggestion.summary && <p className="text-xs text-muted-foreground">{suggestion.summary}</p>}
              {suggestion.diffPreview && (
                <pre className="rounded-md bg-muted/60 p-2 text-[11px] overflow-x-auto">
                  {suggestion.diffPreview}
                </pre>
              )}
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => updateSuggestion.mutate({ id: suggestion.id, payload: { status: 'APPLIED', resolution: 'Übernommen' } })}
                >
                  Übernehmen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateSuggestion.mutate({ id: suggestion.id, payload: { status: 'DISMISSED', resolution: 'Verworfen' } })}
                >
                  Verwerfen
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">Zuletzt aktualisiert: {new Date(suggestion.updatedAt).toLocaleString()}</p>
            </article>
          ))}
        </div>
        {suggestionsQuery.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">Keine offenen Vorschläge – alles auf dem neuesten Stand!</p>
        )}
      </section>
    </div>
  );
}

function parseMaybeJson(value: string) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
}
