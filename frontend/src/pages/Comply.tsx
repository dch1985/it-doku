import { useState } from 'react';
import { useDocuments } from '@/hooks/useDocuments';
import { useCompliance } from '@/hooks/useCompliance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const FORMATS = ['MARKDOWN', 'ASCIIDOC', 'XML'];

export default function Comply() {
  const { documents } = useDocuments();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');

  const {
    schemasQuery,
    annotationsQuery,
    traceLinksQuery,
    findingsQuery,
    createSchema,
    createAnnotation,
    createTraceLink,
    updateQualityFinding,
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

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Struktur & Compliance</h1>
        <p className="text-muted-foreground">
          Erzwinge Templates, gewährleiste Nachvollziehbarkeit und dokumentiere Audit Trails – NIST/ISO-ready.
        </p>
      </header>

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
            <Button onClick={handleCreateSchema} disabled={createSchema.isLoading}>
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
              <Button onClick={handleCreateAnnotation} disabled={!selectedDocumentId || createAnnotation.isLoading}>
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
              <Button onClick={handleCreateTraceLink} disabled={createTraceLink.isLoading}>
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
            <div className="mt-4 max-h-[200px] space-y-2 overflow-y-auto pr-2">
              {findingsQuery.data?.map((finding) => (
                <article key={finding.id} className="rounded-lg border p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{finding.category}</span>
                    <Badge variant={finding.severity === 'ERROR' ? 'destructive' : 'secondary'}>{finding.severity}</Badge>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap">{finding.message}</p>
                  {finding.location && <p className="mt-1 text-[10px] text-muted-foreground">{finding.location}</p>}
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQualityFinding.mutate({ id: finding.id, resolution: 'Geprüft / ok' })}
                    >
                      Auf gelöst setzen
                    </Button>
                    {finding.resolution && (
                      <Badge variant="outline">{finding.resolution}</Badge>
                    )}
                  </div>
                </article>
              ))}
              {findingsQuery.data?.length === 0 && (
                <p className="text-sm text-muted-foreground">Keine Findings – gute Arbeit!</p>
              )}
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
