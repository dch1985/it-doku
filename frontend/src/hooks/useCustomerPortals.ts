import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenantStore } from '@/stores/tenantStore';
import { getApiUrl, buildHeaders } from '@/lib/api';
import { toast } from 'sonner';

export interface CustomerPortal {
  id: string;
  name: string;
  slug: string;
  metadata?: string;
  publicKey?: string;
  isActive: boolean;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
  // Parsed from metadata
  url?: string;
  customerName?: string;
  description?: string;
  status?: string;
  accessUrl?: string;
  credentials?: string;
}

function parsePortal(portal: any): CustomerPortal {
  const parsed: CustomerPortal = {
    id: portal.id,
    name: portal.name,
    slug: portal.slug,
    publicKey: portal.publicKey,
    isActive: portal.isActive,
    tenantId: portal.tenantId,
    createdAt: portal.createdAt,
    updatedAt: portal.updatedAt,
  };
  
  if (portal.metadata) {
    try {
      const meta = JSON.parse(portal.metadata);
      parsed.url = meta.url;
      parsed.customerName = meta.customerName;
      parsed.description = meta.description;
      parsed.status = meta.status;
      parsed.accessUrl = meta.accessUrl;
      parsed.credentials = meta.credentials;
    } catch (e) {
      console.error('Failed to parse portal metadata:', e);
    }
  }
  
  return parsed;
}

export function useCustomerPortals(filters?: { status?: string; search?: string }) {
  const { currentTenant } = useTenantStore();
  const queryClient = useQueryClient();
  const API_URL = getApiUrl();
  const isDevMode = import.meta.env.VITE_DEV_AUTH_ENABLED === 'true';

  // Build query string
  const queryParams = new URLSearchParams();
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.search) queryParams.append('search', filters.search);
  const queryString = queryParams.toString();
  const url = `${API_URL}/customer-portals${queryString ? `?${queryString}` : ''}`;

  const {
    data: portals = [],
    isLoading,
    error,
    refetch,
  } = useQuery<CustomerPortal[], Error>({
    queryKey: ['customerPortals', currentTenant?.id, filters],
    queryFn: async () => {
      const headers = buildHeaders(currentTenant?.id);

      if (!currentTenant && !isDevMode) {
        throw new Error('Tenant context required for customer portals in production mode.');
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch customer portals';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to fetch customer portals (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      return data.map(parsePortal);
    },
    staleTime: 1000 * 60 * 2,
    onError: (error) => {
      toast.error(`Customer Portals Error: ${error.message}`);
    },
  });

  // Get single portal
  const getPortal = async (id: string): Promise<CustomerPortal> => {
    const headers = buildHeaders(currentTenant?.id);
    const response = await fetch(`${API_URL}/customer-portals/${id}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch portal');
    const portal = await response.json();
    return parsePortal(portal);
  };

  // Create portal
  const createMutation = useMutation<CustomerPortal, Error, Partial<CustomerPortal>>({
    mutationFn: async (data) => {
      const headers = buildHeaders(currentTenant?.id);

      if (!currentTenant && !isDevMode) {
        throw new Error('Tenant context required for customer portals in production mode.');
      }

      const response = await fetch(`${API_URL}/customer-portals`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create customer portal';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to create customer portal (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      const portal = await response.json();
      return parsePortal(portal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerPortals', currentTenant?.id] });
      toast.success('Customer portal created successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to create customer portal: ${error.message}`);
    },
  });

  // Update portal
  const updateMutation = useMutation<CustomerPortal, Error, { id: string; data: Partial<CustomerPortal> }>({
    mutationFn: async ({ id, data }) => {
      const headers = buildHeaders(currentTenant?.id);

      if (!currentTenant && !isDevMode) {
        throw new Error('Tenant context required for customer portals in production mode.');
      }

      const response = await fetch(`${API_URL}/customer-portals/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update customer portal';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to update customer portal (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      const portal = await response.json();
      return parsePortal(portal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerPortals', currentTenant?.id] });
      toast.success('Customer portal updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update customer portal: ${error.message}`);
    },
  });

  // Delete portal
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      const headers = buildHeaders(currentTenant?.id);

      if (!currentTenant && !isDevMode) {
        throw new Error('Tenant context required for customer portals in production mode.');
      }

      const response = await fetch(`${API_URL}/customer-portals/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete customer portal';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to delete customer portal (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerPortals', currentTenant?.id] });
      toast.success('Customer portal deleted successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to delete customer portal: ${error.message}`);
    },
  });

  return {
    portals,
    isLoading,
    error,
    refetch,
    getPortal,
    createPortal: createMutation.mutate,
    isCreating: createMutation.isPending,
    updatePortal: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deletePortal: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
