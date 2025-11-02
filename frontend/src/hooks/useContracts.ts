import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenantStore } from '@/stores/tenantStore';
import { getApiUrl, buildHeaders } from '@/lib/api';
import { toast } from 'sonner';

export interface Contract {
  id: string;
  name: string;
  type: string;
  vendor?: string;
  contractNumber?: string;
  startDate?: string;
  endDate?: string;
  renewalDate?: string;
  autoRenew: boolean;
  monthlyCost?: number;
  annualCost?: number;
  currency?: string;
  assetId?: string;
  notifyDays?: number;
  notes?: string;
  metadata?: string;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
  asset?: {
    id: string;
    name: string;
    type: string;
  };
}

export function useContracts(filters?: { type?: string; vendor?: string; expiring?: boolean }) {
  const { currentTenant } = useTenantStore();
  const queryClient = useQueryClient();
  const API_URL = getApiUrl();
  const isDevMode = import.meta.env.VITE_DEV_AUTH_ENABLED === 'true';

  // Build query string
  const queryParams = new URLSearchParams();
  if (filters?.type) queryParams.append('type', filters.type);
  if (filters?.vendor) queryParams.append('vendor', filters.vendor);
  if (filters?.expiring) queryParams.append('expiring', 'true');
  const queryString = queryParams.toString();
  const url = `${API_URL}/contracts${queryString ? `?${queryString}` : ''}`;

  const {
    data: contracts = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Contract[], Error>({
    queryKey: ['contracts', currentTenant?.id, filters],
    queryFn: async () => {
      const headers = buildHeaders(currentTenant?.id);

      if (!currentTenant && !isDevMode) {
        throw new Error('Tenant context required for contracts in production mode.');
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch contracts';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to fetch contracts (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 2,
    onError: (error) => {
      toast.error(`Contracts Error: ${error.message}`);
    },
  });

  // Get expiring contracts
  const {
    data: expiringContracts = [],
    isLoading: isLoadingExpiring,
  } = useQuery<Contract[], Error>({
    queryKey: ['contracts', 'expiring', currentTenant?.id],
    queryFn: async () => {
      const headers = buildHeaders(currentTenant?.id);

      if (!currentTenant && !isDevMode) {
        throw new Error('Tenant context required for contracts in production mode.');
      }

      const response = await fetch(`${API_URL}/contracts/expiring?days=30`, { headers });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch expiring contracts';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to fetch expiring contracts (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get single contract
  const getContract = async (id: string): Promise<Contract> => {
    const headers = buildHeaders(currentTenant?.id);
    const response = await fetch(`${API_URL}/contracts/${id}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch contract');
    return response.json();
  };

  // Create contract
  const createMutation = useMutation<Contract, Error, Partial<Contract>>({
    mutationFn: async (data) => {
      const headers = buildHeaders(currentTenant?.id);

      if (!currentTenant && !isDevMode) {
        throw new Error('Tenant context required for contracts in production mode.');
      }

      const response = await fetch(`${API_URL}/contracts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create contract';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to create contract (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', currentTenant?.id] });
      toast.success('Contract created successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to create contract: ${error.message}`);
    },
  });

  // Update contract
  const updateMutation = useMutation<Contract, Error, { id: string; data: Partial<Contract> }>({
    mutationFn: async ({ id, data }) => {
      const headers = buildHeaders(currentTenant?.id);

      if (!currentTenant && !isDevMode) {
        throw new Error('Tenant context required for contracts in production mode.');
      }

      const response = await fetch(`${API_URL}/contracts/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update contract';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to update contract (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', currentTenant?.id] });
      toast.success('Contract updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update contract: ${error.message}`);
    },
  });

  // Renew contract
  const renewMutation = useMutation<Contract, Error, { id: string; endDate?: string; renewalDate?: string }>({
    mutationFn: async ({ id, endDate, renewalDate }) => {
      const headers = buildHeaders(currentTenant?.id);

      if (!currentTenant && !isDevMode) {
        throw new Error('Tenant context required for contracts in production mode.');
      }

      const response = await fetch(`${API_URL}/contracts/${id}/renew`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ endDate, renewalDate }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to renew contract';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to renew contract (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', currentTenant?.id] });
      toast.success('Contract renewed successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to renew contract: ${error.message}`);
    },
  });

  // Delete contract
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      const headers = buildHeaders(currentTenant?.id);

      if (!currentTenant && !isDevMode) {
        throw new Error('Tenant context required for contracts in production mode.');
      }

      const response = await fetch(`${API_URL}/contracts/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete contract';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to delete contract (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', currentTenant?.id] });
      toast.success('Contract deleted successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to delete contract: ${error.message}`);
    },
  });

  return {
    contracts,
    expiringContracts,
    isLoading,
    isLoadingExpiring,
    error,
    refetch,
    getContract,
    createContract: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateContract: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    renewContract: renewMutation.mutate,
    isRenewing: renewMutation.isPending,
    deleteContract: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}

