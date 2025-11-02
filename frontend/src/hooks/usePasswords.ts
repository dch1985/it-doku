import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenantStore } from '@/stores/tenantStore';
import { getApiUrl, buildHeaders } from '@/lib/api';
import { toast } from 'sonner';

export interface Password {
  id: string;
  name: string;
  username?: string;
  url?: string;
  notes?: string;
  tags?: string;
  expiresAt?: string;
  lastChanged?: string;
  encrypted: boolean;
  tenantId?: string;
  userId: string;
  assetId?: string;
  asset?: {
    id: string;
    name: string;
    type: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PasswordReveal {
  id: string;
  name: string;
  username?: string;
  password: string; // Only when revealed
  url?: string;
  notes?: string;
  expiresAt?: string;
}

export function usePasswords() {
  const { currentTenant } = useTenantStore();
  const queryClient = useQueryClient();
  const API_URL = getApiUrl();
  const isDevMode = import.meta.env.VITE_DEV_AUTH_ENABLED === 'true';

  // Fetch passwords
  const {
    data: passwords = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Password[], Error>({
    queryKey: ['passwords', currentTenant?.id],
    queryFn: async () => {
      const headers = buildHeaders(currentTenant?.id);

      if (!currentTenant && !isDevMode) {
        throw new Error('Tenant context required for passwords in production mode.');
      }

      const response = await fetch(`${API_URL}/passwords`, { headers });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch passwords';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to fetch passwords (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    onError: (error) => {
      toast.error(`Passwords Error: ${error.message}`);
    },
  });

  // Reveal password (with audit log)
  const revealMutation = useMutation<PasswordReveal, Error, string>({
    mutationFn: async (passwordId: string) => {
      const headers = buildHeaders(currentTenant?.id);

      if (!currentTenant && !isDevMode) {
        throw new Error('Tenant context required for passwords in production mode.');
      }

      const response = await fetch(`${API_URL}/passwords/${passwordId}/reveal`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to reveal password';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to reveal password (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Password revealed (access logged)');
    },
    onError: (error) => {
      toast.error(`Failed to reveal password: ${error.message}`);
    },
  });

  // Create password
  const createMutation = useMutation<Password, Error, Partial<Password> & { password: string }>({
    mutationFn: async (data) => {
      const headers = buildHeaders(currentTenant?.id);

      if (!currentTenant && !isDevMode) {
        throw new Error('Tenant context required for passwords in production mode.');
      }

      const response = await fetch(`${API_URL}/passwords`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: data.name,
          username: data.username,
          password: data.password,
          url: data.url,
          notes: data.notes,
          tags: data.tags ? JSON.parse(data.tags) : undefined,
          expiresAt: data.expiresAt,
          assetId: data.assetId,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create password';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to create password (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passwords', currentTenant?.id] });
      toast.success('Password created successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to create password: ${error.message}`);
    },
  });

  // Update password
  const updateMutation = useMutation<Password, Error, { id: string; data: Partial<Password> & { password?: string } }>({
    mutationFn: async ({ id, data }) => {
      const headers = buildHeaders(currentTenant?.id);

      if (!currentTenant && !isDevMode) {
        throw new Error('Tenant context required for passwords in production mode.');
      }

      const response = await fetch(`${API_URL}/passwords/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: data.name,
          username: data.username,
          password: data.password,
          url: data.url,
          notes: data.notes,
          tags: data.tags ? JSON.parse(data.tags) : undefined,
          expiresAt: data.expiresAt,
          assetId: data.assetId,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update password';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to update password (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passwords', currentTenant?.id] });
      toast.success('Password updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update password: ${error.message}`);
    },
  });

  // Delete password
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      const headers = buildHeaders(currentTenant?.id);

      if (!currentTenant && !isDevMode) {
        throw new Error('Tenant context required for passwords in production mode.');
      }

      const response = await fetch(`${API_URL}/passwords/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete password';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to delete password (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passwords', currentTenant?.id] });
      toast.success('Password deleted successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to delete password: ${error.message}`);
    },
  });

  return {
    passwords,
    isLoading,
    error,
    refetch,
    revealPassword: revealMutation.mutate,
    isRevealing: revealMutation.isPending,
    createPassword: createMutation.mutate,
    isCreating: createMutation.isPending,
    updatePassword: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deletePassword: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}

