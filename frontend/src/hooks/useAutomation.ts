import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTenantStore } from '@/stores/tenantStore';

const getApiUrl = () => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
  return baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`;
};

const API_URL = getApiUrl();

interface SourceConnector {
  id: string;
  name: string;
  type: string;
  config: string;
  isActive: boolean;
  tenantId: string | null;
  updatedAt: string;
}

interface GenerationJob {
  id: string;
  status: string;
  intent: string;
  payload?: string;
  resultDraft?: string;
  documentId?: string | null;
  sourceConnectorId?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  suggestions: Array<UpdateSuggestion>;
  qualityFindings: Array<QualityFinding>;
}

interface UpdateSuggestion {
  id: string;
  title: string;
  status: string;
  summary?: string;
  diffPreview?: string;
  updatedAt: string;
}

interface QualityFinding {
  id: string;
  category: string;
  severity: string;
  message: string;
  location?: string;
  resolvedAt?: string | null;
}

type CreateConnectorPayload = {
  name: string;
  type: string;
  config?: Record<string, unknown>;
};

type CreateJobPayload = {
  intent?: string;
  documentId?: string;
  connectorId?: string;
  payload?: Record<string, unknown>;
  title?: string;
};

type UpdateSuggestionPayload = {
  status: string;
  resolution?: string;
};

export function useAutomation() {
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

  const connectorsQuery = useQuery<SourceConnector[]>({
    queryKey: ['automation', 'connectors', currentTenant?.id],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/automation/connectors`, {
        headers,
      });
      if (!response.ok) {
        throw new Error('Failed to load connectors');
      }
      return response.json();
    },
  });

  const jobsQuery = useQuery<GenerationJob[]>({
    queryKey: ['automation', 'jobs', currentTenant?.id],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/automation/jobs`, {
        headers,
      });
      if (!response.ok) {
        throw new Error('Failed to load jobs');
      }
      return response.json();
    },
  });

  const suggestionsQuery = useQuery<UpdateSuggestion[]>({
    queryKey: ['automation', 'suggestions', currentTenant?.id],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/automation/suggestions`, {
        headers,
      });
      if (!response.ok) {
        throw new Error('Failed to load suggestions');
      }
      return response.json();
    },
  });

  const createConnector = useMutation({
    mutationFn: async (payload: CreateConnectorPayload) => {
      const response = await fetch(`${API_URL}/automation/connectors`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Failed to create connector');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Connector gespeichert');
      queryClient.invalidateQueries({ queryKey: ['automation', 'connectors'] });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? 'Connector konnte nicht erstellt werden');
    },
  });

  const createJob = useMutation({
    mutationFn: async (payload: CreateJobPayload) => {
      const response = await fetch(`${API_URL}/automation/jobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Failed to start generation job');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Generierungsauftrag gestartet');
      queryClient.invalidateQueries({ queryKey: ['automation', 'jobs'] });
      queryClient.invalidateQueries({ queryKey: ['automation', 'suggestions'] });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? 'Job konnte nicht erstellt werden');
    },
  });

  const updateSuggestion = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateSuggestionPayload }) => {
      const response = await fetch(`${API_URL}/automation/suggestions/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Failed to update suggestion');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Vorschlag aktualisiert');
      queryClient.invalidateQueries({ queryKey: ['automation', 'suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['automation', 'jobs'] });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? 'Vorschlag konnte nicht aktualisiert werden');
    },
  });

  return {
    connectorsQuery,
    jobsQuery,
    suggestionsQuery,
    createConnector,
    createJob,
    updateSuggestion,
  };
}
