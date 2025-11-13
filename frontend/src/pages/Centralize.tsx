import { useMemo, useState } from 'react';
import { useDocuments } from '@/hooks/useDocuments';
import { useAssistant, AssistantCitation } from '@/hooks/useAssistant';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function openDocument(documentId?: string | null) {
  if (!documentId) return;
  window.location.hash = `document/${documentId}`;
}

const AUDIENCE_LEVELS = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'PRACTITIONER', label: 'Practitioner' },
  { value: 'EXPERT', label: 'Expert' },
];

export default function Centralize() {
  const { documents, loading } = useDocuments();
  const { conversationsQuery, tracesQuery, askMutation, activeConversationId, setActiveConversationId } = useAssistant();
  const { data: analyticsData, isLoading: analyticsLoading } = useAnalytics();
  const centralizeMetrics = analyticsData?.centralize;
  const systemDocs = analyticsData?.system.totalDocuments;

  const [question, setQuestion] = useState('');
  const [audience, setAudience] = useState<string>('PRACTITIONER');
  const [conversationTitle, setConversationTitle] = useState('');

  const activeConversation = useMemo(() => {
    return conversationsQuery.data?.find((conversation) => conversation.id === activeConversationId);
  }, [conversationsQuery.data, activeConversationId]);

  const handleAsk = () => {
    if (!question.trim()) return;
    askMutation.mutate({
      question: question.trim(),
      audience,
      conversationId: activeConversationId,
      title: conversationTitle || 'Assistant Session',
    });
    setQuestion('');
  };

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Zentralisierung & Wissenszugriff</h1>
        <p className="text-muted-foreground">
          Single Source of Truth: Alle Dokumente an einem Ort, ergänzt durch eine konversationelle KI mit kontextbewussten Antworten.
        </p>
      </header>

      <section className="rounded-xl border bg-card shadow-sm">
        <header className="border-b p-6">
          <h2 className="text-xl font-semibold">Dokumentenlandschaft</h2>
          <p className="text-sm text-muted-foreground">Schneller Überblick über die wichtigsten Wissensobjekte in deinem Tenant.</p>
        </header>
        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Dokumente</CardTitle>
              <CardDescription>Gesamtanzahl im SSoT</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{systemDocs ?? documents.length}</p>
              <p className="text-xs text-muted-foreground">
                Davon im Review: {documents.filter((document) => document.status === 'REVIEW').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Aktualisiert (7 Tage)</CardTitle>
              <CardDescription>Neue oder geänderte Dokumente</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">
                {
                  documents.filter(
                    (document) => Date.now() - new Date(document.updatedAt).getTime() < 1000 * 60 * 60 * 24 * 7,
                  ).length
                }
              </p>
              <p className="text-xs text-muted-foreground">Basierend auf Dokumentstamppeln</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Assistant Queries</CardTitle>
              <CardDescription>letzte 7 Tage</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{centralizeMetrics?.assistant.totalQueries ?? 0}</p>
              <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                {(centralizeMetrics?.assistant.byAudience ?? []).map((entry) => (
                  <div key={entry.audience} className="flex justify-between">
                    <span>{entry.audience}</span>
                    <span>{entry.count}</span>
                  </div>
                ))}
                {(centralizeMetrics?.assistant.byAudience?.length ?? 0) === 0 && <p>Keine Fragen gestellt.</p>}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Coverage</CardTitle>
              <CardDescription>Zugeordnete Nodes & Lücken</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{centralizeMetrics?.knowledge.documentsWithCoverage ?? 0}</p>
              <p className="text-xs text-muted-foreground">
                Ohne Coverage: {centralizeMetrics?.knowledge.documentsWithoutCoverage ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">
                Orphans: {centralizeMetrics?.knowledge.nodesWithoutDocument ?? 0}
              </p>
            </CardContent>
          </Card>
        </div>
        {analyticsLoading && (
          <p className="px-6 text-sm text-muted-foreground">Lade zentrale Kennzahlen…</p>
        )}
        <div className="border-t p-6">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Wichtigste Dokumente</h3>
          <div className="space-y-3">
            {loading && <p className="text-sm text-muted-foreground">Lade Dokumente…</p>}
            {!loading && documents.slice(0, 6).map((document) => (
              <article key={document.id} className="rounded-lg border p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-semibold">{document.title}</h4>
                  <Badge variant={document.status === 'PUBLISHED' ? 'default' : 'secondary'}>{document.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Kategorie: {document.category}</p>
                <p className="text-xs text-muted-foreground">Zuletzt geändert: {new Date(document.updatedAt).toLocaleString()}</p>
              </article>
            ))}
            {!loading && documents.length === 0 && (
              <p className="text-sm text-muted-foreground">Noch keine Dokumente vorhanden – starte mit dem Automations-Tab.</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Konversationen</h2>
            <p className="text-xs text-muted-foreground">Verlauf deiner KI-Anfragen.</p>
          </div>
          <div className="space-y-3">
            <Input
              placeholder="Session-Titel (optional)"
              value={conversationTitle}
              onChange={(event) => setConversationTitle(event.target.value)}
            />
            <div className="max-h-[360px] space-y-2 overflow-y-auto pr-2">
              {conversationsQuery.data?.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setActiveConversationId(conversation.id)}
                  className={cn('w-full rounded-lg border p-3 text-left text-sm transition hover:bg-muted/60', {
                    'border-primary bg-primary/10': conversation.id === activeConversationId,
                  })}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{conversation.title || 'Session'}</span>
                    <span className="text-[10px] uppercase text-muted-foreground">
                      {new Date(conversation.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {conversation.messages?.[0]?.content ?? '–'}
                  </p>
                </button>
              ))}
              {conversationsQuery.data?.length === 0 && (
                <p className="text-xs text-muted-foreground">Noch keine Konversationen gestartet.</p>
              )}
            </div>
          </div>
        </aside>

        <div className="rounded-xl border bg-card shadow-sm">
          <header className="border-b p-6">
            <h2 className="text-xl font-semibold">Konversationelle KI</h2>
            <p className="text-sm text-muted-foreground">
              Stelle Fragen in natürlicher Sprache. Antworten basieren auf verifizierten Dokumenten und werden dem Wissenslevel angepasst.
            </p>
          </header>
          <div className="flex flex-col gap-6 p-6">
            <div className="space-y-3">
              <Textarea
                placeholder="Frage an die KI…"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                className="min-h-[120px]"
              />
              <div className="flex flex-wrap items-center gap-3">
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Wissenslevel" />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAsk} disabled={askMutation.isPending}>
                  Frage stellen
                </Button>
              </div>
            </div>

            <div className="h-[360px] overflow-y-auto rounded-lg border bg-muted/30 p-4">
              {activeConversation ? (
                <div className="space-y-4">
                  {activeConversation.messages
                    .slice()
                    .reverse()
                    .map((message) => (
                      <div key={message.id} className="rounded-lg bg-background p-3 shadow-sm">
                        <p className="text-xs uppercase font-semibold text-muted-foreground">{message.role}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm">{message.content}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {new Date(message.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Keine aktive Konversation ausgewählt. Wähle links eine Session oder starte eine neue Frage.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Letzte Antworten mit Audit-Spuren</h3>
              <div className="max-h-[220px] space-y-2 overflow-y-auto pr-2">
                {tracesQuery.data?.map((trace) => (
                  <article key={trace.id} className="rounded-lg border p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{trace.audience ?? 'PRACTITIONER'}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(trace.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 font-medium">Q: {trace.question}</p>
                    <p className="mt-1 whitespace-pre-wrap">A: {trace.answer}</p>
                    {trace.citations && trace.citations.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-[10px] uppercase text-muted-foreground">Quellen</p>
                        <div className="space-y-1">
                          {trace.citations.map((citation) => (
                            <CitationItem key={`${trace.id}-${citation.id}`} citation={citation} />
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                ))}
                {tracesQuery.data?.length === 0 && (
                  <p className="text-xs text-muted-foreground">Noch keine Traces vorhanden.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function CitationItem({ citation }: { citation: AssistantCitation }) {
  const hasDocumentLink = Boolean(citation.documentId);
  const Wrapper = hasDocumentLink ? 'button' : 'div';
  const handleClick = () => {
    if (hasDocumentLink) {
      openDocument(citation.documentId);
    }
  };

  return (
    <Wrapper
      onClick={handleClick as any}
      className={cn(
        'w-full rounded-md border border-dashed border-primary/40 bg-background px-3 py-2 text-left transition',
        hasDocumentLink ? 'hover:border-primary hover:bg-primary/5 cursor-pointer' : 'opacity-90'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] uppercase">
            {citation.sourceType === 'document' ? 'Document' : citation.knowledgeType ?? 'Knowledge'}
          </Badge>
          <span className="font-semibold text-[11px] text-primary">
            {citation.title ?? (citation.sourceType === 'document' ? 'Unbenanntes Dokument' : 'Knowledge Node')}
          </span>
        </div>
        {hasDocumentLink && (
          <span className="text-[10px] uppercase text-muted-foreground">Zum Dokument</span>
        )}
      </div>
      {citation.excerpt && (
        <p className="mt-1 text-[11px] text-muted-foreground line-clamp-3">{citation.excerpt}</p>
      )}
    </Wrapper>
  );
}
