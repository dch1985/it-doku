import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenantStore } from '@/stores/tenantStore';
import { getApiUrl, buildHeaders } from '@/lib/api';
import { toast } from 'sonner';

export interface ProcessRecording {
  id: string;
  title: string;
  description?: string;
  processType: string;
  steps?: string;
  screenshots?: string;
  sopContent?: string;
  documentId?: string;
  status: string;
  metadata?: string;
  tenantId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export function useProcessRecordings(filters?: { processType?: string; status?: string; search?: string }) {
  const { currentTenant } = useTenantStore();
  const queryClient = useQueryClient();
  const API_URL = getApiUrl();
  const isDevMode = import.meta.env.VITE_DEV_AUTH_ENABLED === 'true';

  // Build query string
  const queryParams = new URLSearchParams();
  if (filters?.processType) queryParams.append('processType', filters.processType);
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.search) queryParams.append('search', filters.search);
  const queryString = queryParams.toString();
  const url = `${API_URL}/process-recordings${queryString ? `?${queryString}` : ''}`;

  const {
    data: recordings = [],
    isLoading,
    error,
    refetch,
  } = useQuery<ProcessRecording[], Error>({
    queryKey: ['processRecordings', currentTenant?.id, filters],
    queryFn: async () => {
      const headers = buildHeaders(currentTenant?.id);

      if (!currentTenant && !isDevMode) {
        throw new Error('Tenant context required for process recordings in production mode.');
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch process recordings';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to fetch process recordings (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 2,
    onError: (error) => {
      toast.error(`Process Recordings Error: ${error.message}`);
    },
  });

  // Get single recording
  const getRecording = async (id: string): Promise<ProcessRecording> => {
    const headers = buildHeaders(currentTenant?.id);
    const response = await fetch(`${API_URL}/process-recordings/${id}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch recording');
    return response.json();
  };

  // Create recording
  const createMutation = useMutation<ProcessRecording, Error, Partial<ProcessRecording>>({
    mutationFn: async (data) => {
      const headers = buildHeaders(currentTenant?.id);

      if (!currentTenant && !isDevMode) {
        throw new Error('Tenant context required for process recordings in production mode.');
      }

      const response = await fetch(`${API_URL}/process-recordings`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create process recording';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to create process recording (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processRecordings', currentTenant?.id] });
      toast.success('Process recording created successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to create process recording: ${error.message}`);
    },
  });

  // Update recording
  const updateMutation = useMutation<ProcessRecording, Error, { id: string; data: Partial<ProcessRecording> }>({
    mutationFn: async ({ id, data }) => {
      const headers = buildHeaders(currentTenant?.id);

      if (!currentTenant && !isDevMode) {
        throw new Error('Tenant context required for process recordings in production mode.');
      }

      const response = await fetch(`${API_URL}/process-recordings/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update process recording';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to update process recording (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processRecordings', currentTenant?.id] });
      toast.success('Process recording updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update process recording: ${error.message}`);
    },
  });

  // Delete recording
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      const headers = buildHeaders(currentTenant?.id);

      if (!currentTenant && !isDevMode) {
        throw new Error('Tenant context required for process recordings in production mode.');
      }

      const response = await fetch(`${API_URL}/process-recordings/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete process recording';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to delete process recording (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processRecordings', currentTenant?.id] });
      toast.success('Process recording deleted successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to delete process recording: ${error.message}`);
    },
  });

  return {
    recordings,
    isLoading,
    error,
    refetch,
    getRecording,
    createRecording: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateRecording: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteRecording: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}

