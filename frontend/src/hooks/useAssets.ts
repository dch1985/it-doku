import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenantStore } from '@/stores/tenantStore';
import { getApiUrl, buildHeaders } from '@/lib/api';
import { toast } from 'sonner';

export interface Asset {
  id: string;
  name: string;
  type: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  assetTag?: string;
  ipAddress?: string;
  macAddress?: string;
  hostname?: string;
  location?: string;
  rack?: string;
  rackPosition?: string;
  status: string;
  purchaseDate?: string;
  warrantyExp?: string;
  tenantId?: string;
  userId?: string;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
  lastScannedAt?: string;
  contracts?: Contract[];
  networkDevices?: NetworkDevice[];
  _count?: {
    contracts: number;
    networkDevices: number;
  };
}

interface Contract {
  id: string;
  name: string;
  type: string;
  endDate?: string;
}

interface NetworkDevice {
  id: string;
  name: string;
  ipAddress: string;
  deviceType: string;
  isActive: boolean;
}

export function useAssets(filters?: { type?: string; status?: string; location?: string; search?: string }) {
  const { currentTenant } = useTenantStore();
  const queryClient = useQueryClient();
  const API_URL = getApiUrl();
  const isDevMode = import.meta.env.VITE_DEV_AUTH_ENABLED === 'true';

  // Build query string
  const queryParams = new URLSearchParams();
  if (filters?.type) queryParams.append('type', filters.type);
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.location) queryParams.append('location', filters.location);
  if (filters?.search) queryParams.append('search', filters.search);
  const queryString = queryParams.toString();
  const url = `${API_URL}/assets${queryString ? `?${queryString}` : ''}`;

  const {
    data: assets = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Asset[], Error>({
    queryKey: ['assets', currentTenant?.id, filters],
    queryFn: async () => {
      const headers = buildHeaders(currentTenant?.id);

      if (!currentTenant && !isDevMode) {
        throw new Error('Tenant context required for assets in production mode.');
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch assets';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to fetch assets (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 2,
    onError: (error) => {
      toast.error(`Assets Error: ${error.message}`);
    },
  });

  // Get asset types
  const {
    data: assetTypes = [],
  } = useQuery<string[], Error>({
    queryKey: ['assetTypes'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/assets/types`);
      if (!response.ok) throw new Error('Failed to fetch asset types');
      return response.json();
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Get single asset
  const getAsset = async (id: string): Promise<Asset> => {
    const headers = buildHeaders(currentTenant?.id);
    const response = await fetch(`${API_URL}/assets/${id}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch asset');
    return response.json();
  };

  // Create asset
  const createMutation = useMutation<Asset, Error, Partial<Asset>>({
    mutationFn: async (data) => {
      const headers = buildHeaders(currentTenant?.id);

      if (!currentTenant && !isDevMode) {
        throw new Error('Tenant context required for assets in production mode.');
      }

      const response = await fetch(`${API_URL}/assets`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create asset';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to create asset (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', currentTenant?.id] });
      toast.success('Asset created successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to create asset: ${error.message}`);
    },
  });

  // Update asset
  const updateMutation = useMutation<Asset, Error, { id: string; data: Partial<Asset> }>({
    mutationFn: async ({ id, data }) => {
      const headers = buildHeaders(currentTenant?.id);

      if (!currentTenant && !isDevMode) {
        throw new Error('Tenant context required for assets in production mode.');
      }

      const response = await fetch(`${API_URL}/assets/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update asset';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to update asset (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', currentTenant?.id] });
      toast.success('Asset updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update asset: ${error.message}`);
    },
  });

  // Delete asset
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      const headers = buildHeaders(currentTenant?.id);

      if (!currentTenant && !isDevMode) {
        throw new Error('Tenant context required for assets in production mode.');
      }

      const response = await fetch(`${API_URL}/assets/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete asset';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to delete asset (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', currentTenant?.id] });
      toast.success('Asset deleted successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to delete asset: ${error.message}`);
    },
  });

  return {
    assets,
    assetTypes,
    isLoading,
    error,
    refetch,
    getAsset,
    createAsset: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateAsset: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteAsset: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}

