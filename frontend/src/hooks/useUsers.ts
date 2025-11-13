import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTenantStore } from '@/stores/tenantStore';

const getApiUrl = () => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
  return baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`;
};

const API_URL = getApiUrl();

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  tenantRole: string;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentTenant } = useTenantStore();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (currentTenant) {
        headers['X-Tenant-ID'] = currentTenant.id;
      }

      const response = await fetch(`${API_URL}/users`, {
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTenant?.id) {
      fetchUsers();
    } else {
      setUsers([]);
    }
  }, [currentTenant?.id]);

  return {
    users,
    loading,
    refetch: fetchUsers,
  };
}

