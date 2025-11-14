import { useState } from 'react';
import { useDocuments } from '@/hooks/useDocuments';
import { useCompliance } from '@/hooks/useCompliance';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useUsers } from '@/hooks/useUsers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const FORMATS = ['MARKDOWN', 'ASCIIDOC', 'XML'];
const REVIEW_STATUSES = ['PENDING', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED'];

export default function Comply() {
  const { documents } = useDocuments();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const { data: analyticsData, isLoading: analyticsLoading } = useAnalytics();
  const complyMetrics = analyticsData?.comply;
  const { users, loading: usersLoading } = useUsers();

  const {
    schemasQuery,
    annotationsQuery,
    traceLinksQuery,
    findingsQuery,
    createSchema,
    createAnnotation,
    createTraceLink,
    updateQualityFinding,
    reviewsQuery,
    createReviewRequest,
    updateReviewRequest,
    runQualityCheck,
  } = useCompliance(selectedDocumentId || undefined);

  const [schemaName, setSchemaName] = useState('');
  const [schemaFormat, setSchemaFormat] = useState(FORMATS[0]);
  const [schemaDescription, setSchemaDescription] = useState('');
  const [schemaContent, setSchemaContent] = useState('');

  const [annotationKey, setAnnotationKey] = useState('REQ-ID');
  const [annotationValue, setAnnotationValue] = useState('');
  const [annotationLocation, setAnnotationLocation] = useState('');

  const [traceSourceType, setTraceSourceType] = useState('REQUIREMENT');
  const [traceSourceId, setTraceSourceId] = useState('');
  const [traceTargetType, setTraceTargetType] = useState('DOCUMENT');
  const [traceTargetId, setTraceTargetId] = useState('');
  const [reviewReviewerId, setReviewReviewerId] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const handleCreateSchema = () => {
    if (!schemaName || !schemaContent) return;
    createSchema.mutate({
      name: schemaName,
      description: schemaDescription,
      format: schemaFormat,
      schema: safeParse(schemaContent),
    });
    setSchemaName('');
    setSchemaDescription('');
    setSchemaContent('');
  };

  const handleCreateAnnotation = () => {
    if (!selectedDocumentId || !annotationKey || !annotationValue) return;
    createAnnotation.mutate({
      documentId: selectedDocumentId,
      key: annotationKey,
      value: safeParse(annotationValue),
      location: annotationLocation,
    });
    setAnnotationValue('');
    setAnnotationLocation('');
  };

  const handleCreateTraceLink = () => {
    if (!traceSourceId || !traceTargetId) return;
    createTraceLink.mutate({
      sourceType: traceSourceType,
      sourceId: traceSourceId,
      targetType: traceTargetType,
      targetId: traceTargetId,
      sourceDocumentId: selectedDocumentId || undefined,
    });
    setTraceSourceId('');
    setTraceTargetId('');
  };

  const handleCreateReview = () => {
    if (!selectedDocumentId) {
      toast.error('Bitte wähle ein Dokument aus.');
      return;
    }
    if (!reviewReviewerId) {
      toast.error('Bitte wähle einen Reviewer aus.');
      return;
    }
    createReviewRequest.mutate(
      {
        documentId: selectedDocumentId,
        reviewerId: reviewReviewerId,
        comments: reviewComment.trim() ? reviewComment.trim() : undefined,
      },
      {
        onSuccess: () => {
          setReviewComment('');
        },
      },
    );
  };

  const handleRunQualityCheck = () => {
    if (!selectedDocumentId) {
      toast.error('Bitte wähle ein Dokument aus.');
      return;
    }
    runQualityCheck.mutate(selectedDocumentId);
  };

  const reviewRequests = reviewsQuery.data ?? [];

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Struktur & Compliance</h1>
        <p className="text-muted-foreground">
          Erzwinge Templates, gewährleiste Nachvollziehbarkeit und dokumentiere Audit Trails – NIST/ISO-ready.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {analyticsLoading && (
          <Card>
            <CardHeader>
              <CardTitle>Compliance KPI</CardTitle>
              <CardDescription>lade Kennzahlen…</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-16 animate-pulse rounded-md bg-muted" />
            </CardContent>
          </Card>
        )}
        {complyMetrics && !analyticsLoading && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Offene Findings</CardTitle>
                <CardDescription>nach Severity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {complyMetrics.findings.openBySeverity.map((entry) => (
                  <p key={entry.severity} className="flex justify-between">
                    <span>{entry.severity}</span>
                    <span>{entry.count}</span>
                  </p>
                ))}
                {complyMetrics.findings.openBySeverity.length === 0 && (
                  <p className="text-xs text-muted-foreground">Keine offenen Findings.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Quality Cycle</CardTitle>
                <CardDescription>Durchschnittliche Zeiten (Tage)</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{complyMetrics.findings.avgResolutionDays}</p>
                <p className="text-xs text-muted-foreground">
                  Review-Dauer: {complyMetrics.reviews.avgCycleDays} Tage
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Offene Reviews</CardTitle>
                <CardDescription>Aktionen erforderlich</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{complyMetrics.reviews.openRequests}</p>
                <p className="text-xs text-muted-foreground">Pending bzw. Changes Requested</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Req-ID Coverage</CardTitle>
                <CardDescription>Dokumente mit Pflichtannotation</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{complyMetrics.policies.reqIdCoveragePercent}%</p>
                <p className="text-xs text-muted-foreground">
                  Dokumente mit REQ-ID: {complyMetrics.policies.documentsWithReqId}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </section>

      <section className="rounded-xl border bg-card shadow-sm">
        <header className="border-b p-6">
          <h2 className="text-xl font-semibold">Template-Schemata</h2>
          <p className="text-sm text-muted-foreground">Definiere verbindliche Strukturen für Projekte und Assets.</p>
        </header>
        <div className="grid gap-6 p-6 lg:grid-cols-2">
          <div className="space-y-3">
            <Input placeholder="Name" value={schemaName} onChange={(event) => setSchemaName(event.target.value)} />
            <Select value={schemaFormat} onValueChange={setSchemaFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.map((format) => (
                  <SelectItem key={format} value={format}>
                    {format}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Beschreibung (optional)"
              value={schemaDescription}
              onChange={(event) => setSchemaDescription(event.target.value)}
            />
            <Textarea
              placeholder="Schema (JSON, YAML oder XML)"
              value={schemaContent}
              onChange={(event) => setSchemaContent(event.target.value)}
              className="min-h-[150px]"
            />
            <Button onClick={handleCreateSchema} disabled={createSchema.isPending}>
              Schema speichern
            </Button>
          </div>
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
            {schemasQuery.data?.map((schema) => (
              <article key={schema.id} className="rounded-lg border p-4 text-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{schema.name}</h3>
                  <Badge>{schema.format}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Stand: {new Date(schema.updatedAt).toLocaleString()}</p>
                <p className="mt-2 text-xs text-muted-foreground line-clamp-3">{schema.description || '—'}</p>
              </article>
            ))}
            {schemasQuery.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">Noch keine Schemata definiert.</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Annotationen & Traceability</h2>
          <p className="text-sm text-muted-foreground">
            Wähle zuerst ein Dokument, um Anforderungen, Controls oder Testfälle zu verlinken.
          </p>
          <Select value={selectedDocumentId} onValueChange={setSelectedDocumentId}>
            <SelectTrigger className="mt-3">
              <SelectValue placeholder="Dokument auswählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Keines</SelectItem>
              {documents.map((document) => (
                <SelectItem key={document.id} value={document.id}>
                  {document.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="mt-4 grid gap-4">
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-medium text-sm">Annotation hinzufügen</h3>
              <Input value={annotationKey} onChange={(event) => setAnnotationKey(event.target.value)} placeholder="Key" />
              <Textarea
                value={annotationValue}
                onChange={(event) => setAnnotationValue(event.target.value)}
                placeholder="Wert (z.B. @ID)"
                className="min-h-[100px]"
              />
              <Input
                value={annotationLocation}
                onChange={(event) => setAnnotationLocation(event.target.value)}
                placeholder="Location (optional)"
              />
              <Button onClick={handleCreateAnnotation} disabled={!selectedDocumentId || createAnnotation.isPending}>
                Annotation speichern
              </Button>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-medium text-sm">Trace Link</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="Source Typ"
                  value={traceSourceType}
                  onChange={(event) => setTraceSourceType(event.target.value.toUpperCase())}
                />
                <Input
                  placeholder="Source ID"
                  value={traceSourceId}
                  onChange={(event) => setTraceSourceId(event.target.value)}
                />
                <Input
                  placeholder="Target Typ"
                  value={traceTargetType}
                  onChange={(event) => setTraceTargetType(event.target.value.toUpperCase())}
                />
                <Input
                  placeholder="Target ID"
                  value={traceTargetId}
                  onChange={(event) => setTraceTargetId(event.target.value)}
                />
              </div>
              <Button onClick={handleCreateTraceLink} disabled={createTraceLink.isPending}>
                Trace Link speichern
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Aktive Annotationen</h2>
            <div className="mt-4 max-h-[220px] space-y-2 overflow-y-auto pr-2">
              {annotationsQuery.data?.map((annotation) => (
                <article key={annotation.id} className="rounded-lg border p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{annotation.key}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(annotation.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap">{annotation.value}</p>
                  {annotation.location && <p className="mt-1 text-[10px] text-muted-foreground">Location: {annotation.location}</p>}
                </article>
              ))}
              {annotationsQuery.data?.length === 0 && (
                <p className="text-sm text-muted-foreground">Keine Annotationen gefunden.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Trace Links</h2>
            <div className="mt-4 max-h-[220px] space-y-2 overflow-y-auto pr-2">
              {traceLinksQuery.data?.map((link) => (
                <article key={link.id} className="rounded-lg border p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{link.relationship ?? 'RELATES_TO'}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(link.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-1">{link.sourceType} → {link.targetType}</p>
                  <p className="text-[11px] text-muted-foreground">{link.sourceId} → {link.targetId}</p>
                </article>
              ))}
              {traceLinksQuery.data?.length === 0 && (
                <p className="text-sm text-muted-foreground">Keine Trace Links vorhanden.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Quality Findings</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleRunQualityCheck} disabled={runQualityCheck.isPending}>
                Quality Check erneut ausführen
              </Button>
              {runQualityCheck.isPending && <span className="text-xs text-muted-foreground">Prüfung läuft…</span>}
            </div>
            <div className="mt-4 max-h-[200px] space-y-2 overflow-y-auto pr-2">
              {findingsQuery.data?.map((finding) => (
                <article key={finding.id} className="rounded-lg border p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{finding.category}</span>
                    <Badge variant={finding.severity === 'ERROR' ? 'destructive' : 'secondary'}>{finding.severity}</Badge>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap">{finding.message}</p>
                  {finding.location && <p className="mt-1 text-[10px] text-muted-foreground">{finding.location}</p>}
                  <div className="mt-2 space-y-2">
                    <Textarea
                      placeholder="Kommentar oder Maßnahmen (optional)"
                      value={resolutionNotes[finding.id] ?? ''}
                      onChange={(event) =>
                        setResolutionNotes((prev) => ({
                          ...prev,
                          [finding.id]: event.target.value,
                        }))
                      }
                      className="min-h-[80px] text-xs"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      {finding.resolvedAt ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateQualityFinding.mutate(
                                { id: finding.id, action: 'REOPEN' },
                                {
                                  onSuccess: () =>
                                    setResolutionNotes((prev) => ({
                                      ...prev,
                                      [finding.id]: '',
                                    })),
                                },
                              )
                            }
                          >
                            Wieder öffnen
                          </Button>
                          <Badge variant="outline">Gelöst am {new Date(finding.resolvedAt).toLocaleDateString()}</Badge>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() =>
                            updateQualityFinding.mutate(
                              {
                                id: finding.id,
                                action: 'RESOLVE',
                                resolution: resolutionNotes[finding.id]?.trim()
                                  ? resolutionNotes[finding.id]!.trim()
                                  : undefined,
                              },
                              {
                                onSuccess: () =>
                                  setResolutionNotes((prev) => ({
                                    ...prev,
                                    [finding.id]: '',
                                  })),
                              },
                            )
                          }
                        >
                          Als gelöst markieren
                        </Button>
                      )}
                      {finding.resolution && <Badge variant="outline">{finding.resolution}</Badge>}
                    </div>
                  </div>
                </article>
              ))}
              {findingsQuery.data?.length === 0 && (
                <p className="text-sm text-muted-foreground">Keine Findings – gute Arbeit!</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Review Workflow</h2>
            <p className="text-sm text-muted-foreground">
              Weise Reviewer zu und dokumentiere Entscheidungen für Audit-Sicherheit.
            </p>
            <div className="mt-4 space-y-3">
              <Select value={reviewReviewerId} onValueChange={setReviewReviewerId} disabled={usersLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={usersLoading ? 'Lade Reviewer…' : 'Reviewer auswählen'} />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
                  {users.length === 0 && <SelectItem value="" disabled>Keine Benutzer gefunden</SelectItem>}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Hinweise oder Ziele für den Review (optional)"
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                className="min-h-[100px]"
              />
              <Button onClick={handleCreateReview} disabled={createReviewRequest.isPending}>
                Review anstoßen
              </Button>
            </div>

            <div className="mt-6 space-y-3 max-h-[240px] overflow-y-auto pr-2">
              {reviewsQuery.isLoading && <p className="text-sm text-muted-foreground">Lade Review Requests…</p>}
              {!reviewsQuery.isLoading && reviewRequests.length === 0 && (
                <p className="text-sm text-muted-foreground">Keine Reviews vorhanden.</p>
              )}
              {reviewRequests.map((request) => {
                const noteValue = reviewNotes[request.id] ?? '';
                return (
                  <article key={request.id} className="rounded-lg border p-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">{request.document?.title ?? 'Dokument'}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Reviewer: {request.reviewer.name} • Angefragt von {request.requester.name}
                        </p>
                      </div>
                      <Badge variant={request.status === 'PENDING' ? 'secondary' : 'outline'}>
                        {request.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    {request.comments && (
                      <p className="mt-2 whitespace-pre-wrap text-[11px] text-muted-foreground">
                        Kommentar: {request.comments}
                      </p>
                    )}
                    <Textarea
                      placeholder="Kommentar zur Entscheidung (optional)"
                      value={noteValue}
                      onChange={(event) =>
                        setReviewNotes((prev) => ({
                          ...prev,
                          [request.id]: event.target.value,
                        }))
                      }
                      className="mt-2 min-h-[80px]"
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {REVIEW_STATUSES.map((status) => (
                        <Button
                          key={status}
                          size="sm"
                          variant={status === request.status ? 'secondary' : 'outline'}
                          onClick={() =>
                            updateReviewRequest.mutate(
                              {
                                id: request.id,
                                status,
                                comments: noteValue.trim() ? noteValue.trim() : undefined,
                              },
                              {
                                onSuccess: () =>
                                  setReviewNotes((prev) => ({
                                    ...prev,
                                    [request.id]: '',
                                  })),
                              },
                            )
                          }
                        >
                          {status.replace('_', ' ')}
                        </Button>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function safeParse(value: string | Record<string, unknown>) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
}
