import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenantStore } from '@/stores/tenantStore';
import { toast } from 'sonner';

const API_BASE = (() => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
  return baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`;
})();

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    createdAt: string;
  }>;
}

interface AssistantAnswer {
  conversationId: string;
  answer: string;
  audience: string;
  traceId: string;
}

interface ConversationTrace {
  id: string;
  question: string;
  answer: string;
  audience?: string;
  citations?: string;
  createdAt: string;
}

type AskPayload = {
  question: string;
  audience?: string;
  conversationId?: string;
  title?: string;
};

export function useAssistant() {
  const { currentTenant } = useTenantStore();
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();

  const headers = useMemo(() => {
    const result: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (currentTenant?.id) {
      result['X-Tenant-ID'] = currentTenant.id;
    }
    return result;
  }, [currentTenant?.id]);

  const conversationsQuery = useQuery<Conversation[]>({
    queryKey: ['assistant', 'conversations', currentTenant?.id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/assistant/conversations`, { headers });
      if (!response.ok) {
        throw new Error('Konversationen konnten nicht geladen werden');
      }
      const data = (await response.json()) as Conversation[];
      if (!activeConversationId && data.length > 0) {
        setActiveConversationId(data[0].id);
      }
      return data;
    },
  });

  const tracesQuery = useQuery<ConversationTrace[]>({
    queryKey: ['assistant', 'traces', currentTenant?.id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/assistant/traces`, { headers });
      if (!response.ok) {
        throw new Error('Traces konnten nicht geladen werden');
      }
      return response.json();
    },
  });

  const askMutation = useMutation({
    mutationFn: async (payload: AskPayload) => {
      const response = await fetch(`${API_BASE}/assistant/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Die Anfrage konnte nicht beantwortet werden');
      }
      return response.json() as Promise<AssistantAnswer>;
    },
    onSuccess: (data) => {
      toast.success('Antwort erhalten');
      setActiveConversationId(data.conversationId);
      queryClient.invalidateQueries({ queryKey: ['assistant', 'conversations'] });
      queryClient.invalidateQueries({ queryKey: ['assistant', 'traces'] });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? 'Assistant konnte die Frage nicht beantworten');
    },
  });

  return {
    conversationsQuery,
    tracesQuery,
    askMutation,
    activeConversationId,
    setActiveConversationId,
  };
}
