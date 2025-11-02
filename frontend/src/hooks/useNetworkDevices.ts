import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenantStore } from '@/stores/tenantStore';
import { getApiUrl, buildHeaders } from '@/lib/api';
import { toast } from 'sonner';

export interface NetworkDevice {
  id: string;
  name: string;
  ipAddress: string;
  macAddress?: string;
  hostname?: string;
  deviceType: string;
  manufacturer?: string;
  model?: string;
  firmware?: string;
  serialNumber?: string;
  subnet?: string;
  gateway?: string;
  dnsServers?: string;
  discoveredAt: string;
  lastSeen: string;
  isActive: boolean;
  assetId?: string;
  tenantId?: string;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
  asset?: {
    id: string;
    name: string;
    type: string;
  };
}

export function useNetworkDevices(filters?: { deviceType?: string; isActive?: boolean; assetId?: string; search?: string }) {
  const { currentTenant } = useTenantStore();
  const queryClient = useQueryClient();
  const API_URL = getApiUrl();
  const isDevMode = import.meta.env.VITE_DEV_AUTH_ENABLED === 'true';

  // Build query string
  const queryParams = new URLSearchParams();
  if (filters?.deviceType) queryParams.append('deviceType', filters.deviceType);
  if (filters?.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());
  if (filters?.assetId) queryParams.append('assetId', filters.assetId);
  if (filters?.search) queryParams.append('search', filters.search);
  const queryString = queryParams.toString();
  const url = `${API_URL}/network-devices${queryString ? `?${queryString}` : ''}`;

  const {
    data: devices = [],
    isLoading,
    error,
    refetch,
  } = useQuery<NetworkDevice[], Error>({
    queryKey: ['networkDevices', currentTenant?.id, filters],
    queryFn: async () => {
      const headers = buildHeaders(currentTenant?.id);

      if (!currentTenant && !isDevMode) {
        throw new Error('Tenant context required for network devices in production mode.');
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch network devices';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to fetch network devices (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 2,
    onError: (error) => {
      toast.error(`Network Devices Error: ${error.message}`);
    },
  });

  // Get device types
  const {
    data: deviceTypes = [],
  } = useQuery<string[], Error>({
    queryKey: ['networkDeviceTypes'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/network-devices/types`);
      if (!response.ok) throw new Error('Failed to fetch device types');
      return response.json();
    },
    staleTime: 1000 * 60 * 60,
  });

  // Get single device
  const getDevice = async (id: string): Promise<NetworkDevice> => {
    const headers = buildHeaders(currentTenant?.id);
    const response = await fetch(`${API_URL}/network-devices/${id}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch device');
    return response.json();
  };

  // Create or update device (discovery)
  const createMutation = useMutation<NetworkDevice, Error, Partial<NetworkDevice>>({
    mutationFn: async (data) => {
      const headers = buildHeaders(currentTenant?.id);

      if (!currentTenant && !isDevMode) {
        throw new Error('Tenant context required for network devices in production mode.');
      }

      const response = await fetch(`${API_URL}/network-devices`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create/update network device';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to create/update network device (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['networkDevices', currentTenant?.id] });
      toast.success('Network device created/updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to create/update network device: ${error.message}`);
    },
  });

  // Update device
  const updateMutation = useMutation<NetworkDevice, Error, { id: string; data: Partial<NetworkDevice> }>({
    mutationFn: async ({ id, data }) => {
      const headers = buildHeaders(currentTenant?.id);

      if (!currentTenant && !isDevMode) {
        throw new Error('Tenant context required for network devices in production mode.');
      }

      const response = await fetch(`${API_URL}/network-devices/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update network device';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to update network device (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['networkDevices', currentTenant?.id] });
      toast.success('Network device updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update network device: ${error.message}`);
    },
  });

  // Ping device
  const pingMutation = useMutation<NetworkDevice, Error, string>({
    mutationFn: async (id: string) => {
      const headers = buildHeaders(currentTenant?.id);

      if (!currentTenant && !isDevMode) {
        throw new Error('Tenant context required for network devices in production mode.');
      }

      const response = await fetch(`${API_URL}/network-devices/${id}/ping`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to ping network device';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to ping network device (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['networkDevices', currentTenant?.id] });
      toast.success('Device pinged successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to ping device: ${error.message}`);
    },
  });

  // Delete device
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      const headers = buildHeaders(currentTenant?.id);

      if (!currentTenant && !isDevMode) {
        throw new Error('Tenant context required for network devices in production mode.');
      }

      const response = await fetch(`${API_URL}/network-devices/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete network device';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to delete network device (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['networkDevices', currentTenant?.id] });
      toast.success('Network device deleted successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to delete network device: ${error.message}`);
    },
  });

  return {
    devices,
    deviceTypes,
    isLoading,
    error,
    refetch,
    getDevice,
    createDevice: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateDevice: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    pingDevice: pingMutation.mutate,
    isPinging: pingMutation.isPending,
    deleteDevice: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}

