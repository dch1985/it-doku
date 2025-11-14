import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTenantStore } from '@/stores/tenantStore';

const getApiUrl = () => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
  return baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`;
};

const API_URL = getApiUrl();

export interface KnowledgeNode {
  id: string;
  content: string;
  type: string;
  documentId?: string | null;
  document?: {
    id: string;
    title: string | null;
  } | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
  connections?: unknown;
  createdAt: string;
  updatedAt: string;
}

type CreateKnowledgeNodePayload = {
  content: string;
  type: string;
  documentId?: string | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
  connections?: unknown;
};

type UpdateKnowledgeNodePayload = {
  id: string;
  payload: {
    content?: string;
    type?: string;
    documentId?: string | null;
    tags?: string[];
    metadata?: Record<string, unknown>;
    connections?: unknown;
  };
};

export function useKnowledgeNodes(documentId?: string) {
  const { currentTenant } = useTenantStore();
  const queryClient = useQueryClient();

  const headers = useMemo(() => {
    const result: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (currentTenant?.id) {
      result['X-Tenant-ID'] = currentTenant.id;
    }
    return result;
  }, [currentTenant?.id]);

  const knowledgeQuery = useQuery<KnowledgeNode[]>({
    queryKey: ['knowledge-nodes', currentTenant?.id, documentId ?? 'all'],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (documentId) {
        params.append('documentId', documentId);
      }
      const response = await fetch(`${API_URL}/knowledge${params.toString() ? `?${params}` : ''}`, {
        headers,
      });
      if (!response.ok) {
        throw new Error('Knowledge Nodes konnten nicht geladen werden');
      }
      return response.json();
    },
    refetchInterval: 30000,
  });

  const createNode = useMutation({
    mutationFn: async (payload: CreateKnowledgeNodePayload) => {
      const response = await fetch(`${API_URL}/knowledge`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Knowledge Node konnte nicht erstellt werden');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Knowledge Node erstellt');
      queryClient.invalidateQueries({ queryKey: ['knowledge-nodes'] });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? 'Knowledge Node konnte nicht erstellt werden');
    },
  });

  const updateNode = useMutation({
    mutationFn: async ({ id, payload }: UpdateKnowledgeNodePayload) => {
      const response = await fetch(`${API_URL}/knowledge/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Knowledge Node konnte nicht aktualisiert werden');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Knowledge Node aktualisiert');
      queryClient.invalidateQueries({ queryKey: ['knowledge-nodes'] });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? 'Knowledge Node konnte nicht aktualisiert werden');
    },
  });

  const deleteNode = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/knowledge/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) {
        throw new Error('Knowledge Node konnte nicht gelöscht werden');
      }
      return true;
    },
    onSuccess: () => {
      toast.success('Knowledge Node gelöscht');
      queryClient.invalidateQueries({ queryKey: ['knowledge-nodes'] });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? 'Knowledge Node konnte nicht gelöscht werden');
    },
  });

  return {
    knowledgeQuery,
    createNode,
    updateNode,
    deleteNode,
  };
}

