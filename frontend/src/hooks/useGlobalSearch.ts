import { useState } from 'react';
import { toast } from 'sonner';
import { useTenantStore } from '@/stores/tenantStore';

const getApiUrl = () => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
  return baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`;
};

const API_URL = getApiUrl();

export interface SearchResult {
  documents: Array<{
    id: string;
    title: string;
    category: string;
    status: string;
    updatedAt: string;
    user?: {
      name: string;
    };
  }>;
  assets: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    location?: string;
    updatedAt: string;
  }>;
  passwords: Array<{
    id: string;
    name: string;
    username?: string;
    url?: string;
    updatedAt: string;
  }>;
  contracts: Array<{
    id: string;
    name: string;
    type: string;
    vendor?: string;
    contractNumber?: string;
    endDate?: string;
    updatedAt: string;
  }>;
  networkDevices: Array<{
    id: string;
    name: string;
    ipAddress: string;
    deviceType: string;
    isActive: boolean;
    updatedAt: string;
  }>;
  total: number;
}

export function useGlobalSearch() {
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { currentTenant } = useTenantStore();

  const search = async (query: string, type?: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setSearchQuery(query);
    setLoading(true);

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (currentTenant) {
        headers['X-Tenant-ID'] = currentTenant.id;
      }

      const params = new URLSearchParams({ q: query });
      if (type) {
        params.append('type', type);
      }

      const response = await fetch(`${API_URL}/search?${params}`, {
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to perform search');
      }
      
      const data = await response.json();
      setSearchResults(data);
    } catch (error: any) {
      console.error('Error performing search:', error);
      toast.error('Failed to perform search');
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchResults(null);
    setSearchQuery('');
  };

  return {
    searchResults,
    loading,
    searchQuery,
    search,
    clearSearch,
  };
}

