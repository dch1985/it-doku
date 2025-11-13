import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTenantStore } from '@/stores/tenantStore';

const API_ROOT = (() => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
  return baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`;
})();

export interface TemplateSchema {
  id: string;
  name: string;
  description?: string;
  format: string;
  schema: string;
  version?: string;
  isGlobal: boolean;
  updatedAt: string;
}

export interface Annotation {
  id: string;
  documentId: string;
  key: string;
  value: string;
  location?: string;
  createdAt: string;
}

export interface TraceLink {
  id: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  relationship?: string;
  metadata?: string;
  createdAt: string;
}

export interface QualityFinding {
  id: string;
  category: string;
  severity: string;
  message: string;
  location?: string;
  resolution?: string;
  resolvedAt?: string | null;
  createdAt: string;
}

type CreateSchemaPayload = {
  name: string;
  description?: string;
  format?: string;
  schema: string | Record<string, unknown>;
  isGlobal?: boolean;
};

type CreateAnnotationPayload = {
  documentId: string;
  key: string;
  value: string | Record<string, unknown>;
  location?: string;
};

type CreateTracePayload = {
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  relationship?: string;
  metadata?: Record<string, unknown>;
  sourceDocumentId?: string;
  targetDocumentId?: string;
};

type UpdateFindingPayload = {
  id: string;
  resolution?: string;
};

export function useCompliance(documentId?: string) {
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

  const schemasQuery = useQuery<TemplateSchema[]>({
    queryKey: ['compliance', 'schemas', currentTenant?.id],
    queryFn: async () => {
      const response = await fetch(`${API_ROOT}/compliance/schemas`, { headers });
      if (!response.ok) {
        throw new Error('Schemas konnten nicht geladen werden');
      }
      return response.json();
    },
  });

  const annotationsQuery = useQuery<Annotation[]>({
    queryKey: ['compliance', 'annotations', currentTenant?.id, documentId ?? 'all'],
    queryFn: async () => {
      const params = documentId ? `?documentId=${documentId}` : '';
      const response = await fetch(`${API_ROOT}/compliance/annotations${params}`, { headers });
      if (!response.ok) {
        throw new Error('Annotationen konnten nicht geladen werden');
      }
      return response.json();
    },
  });

  const traceLinksQuery = useQuery<TraceLink[]>({
    queryKey: ['compliance', 'trace-links', currentTenant?.id, documentId ?? 'all'],
    queryFn: async () => {
      const params = documentId ? `?documentId=${documentId}` : '';
      const response = await fetch(`${API_ROOT}/compliance/trace-links${params}`, { headers });
      if (!response.ok) {
        throw new Error('Trace Links konnten nicht geladen werden');
      }
      return response.json();
    },
  });

  const findingsQuery = useQuery<QualityFinding[]>({
    queryKey: ['compliance', 'quality', currentTenant?.id, documentId ?? 'all'],
    queryFn: async () => {
      const params = documentId ? `?documentId=${documentId}` : '';
      const response = await fetch(`${API_ROOT}/compliance/quality/findings${params}`, { headers });
      if (!response.ok) {
        throw new Error('Quality Findings konnten nicht geladen werden');
      }
      return response.json();
    },
  });

  const createSchema = useMutation({
    mutationFn: async (payload: CreateSchemaPayload) => {
      const response = await fetch(`${API_ROOT}/compliance/schemas`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Schema konnte nicht erstellt werden');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Schema gespeichert');
      queryClient.invalidateQueries({ queryKey: ['compliance', 'schemas'] });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? 'Schema konnte nicht gespeichert werden');
    },
  });

  const createAnnotation = useMutation({
    mutationFn: async (payload: CreateAnnotationPayload) => {
      const response = await fetch(`${API_ROOT}/compliance/annotations`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Annotation konnte nicht erstellt werden');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Annotation gespeichert');
      queryClient.invalidateQueries({ queryKey: ['compliance', 'annotations'] });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? 'Annotation konnte nicht gespeichert werden');
    },
  });

  const createTraceLink = useMutation({
    mutationFn: async (payload: CreateTracePayload) => {
      const response = await fetch(`${API_ROOT}/compliance/trace-links`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Trace Link konnte nicht erstellt werden');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Trace Link gespeichert');
      queryClient.invalidateQueries({ queryKey: ['compliance', 'trace-links'] });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? 'Trace Link konnte nicht gespeichert werden');
    },
  });

  const updateQualityFinding = useMutation({
    mutationFn: async (payload: UpdateFindingPayload) => {
      const response = await fetch(`${API_ROOT}/compliance/quality/findings/${payload.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ resolution: payload.resolution }),
      });
      if (!response.ok) {
        throw new Error('Quality Finding konnte nicht aktualisiert werden');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Quality Finding aktualisiert');
      queryClient.invalidateQueries({ queryKey: ['compliance', 'quality'] });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? 'Quality Finding konnte nicht aktualisiert werden');
    },
  });

  return {
    schemasQuery,
    annotationsQuery,
    traceLinksQuery,
    findingsQuery,
    createSchema,
    createAnnotation,
    createTraceLink,
    updateQualityFinding,
  };
}
