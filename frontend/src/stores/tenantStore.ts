import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  role: string; // OWNER, ADMIN, MEMBER, VIEWER
  subscriptionStatus: string;
  subscriptionPlan?: string | null;
  isActive: boolean;
  joinedAt?: string;
}

interface TenantStore {
  currentTenant: Tenant | null;
  tenants: Tenant[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentTenant: (tenant: Tenant | null) => void;
  setTenants: (tenants: Tenant[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  switchTenant: (tenantId: string) => void;
  clearTenant: () => void;
}

export const useTenantStore = create<TenantStore>()(
  persist(
    (set) => ({
      // Initial State
      currentTenant: null,
      tenants: [],
      isLoading: false,
      error: null,

      // Actions
      setCurrentTenant: (tenant) =>
        set({ currentTenant: tenant }),

      setTenants: (tenants) =>
        set({ tenants }),

      setLoading: (loading) =>
        set({ isLoading: loading }),

      setError: (error) =>
        set({ error }),

      switchTenant: (tenantId) => {
        set((state) => {
          const tenant = state.tenants.find((t) => t.id === tenantId);
          return { currentTenant: tenant || null };
        });
      },

      clearTenant: () =>
        set({ currentTenant: null }),
    }),
    {
      name: 'tenant-storage',
      partialize: (state) => ({
        currentTenant: state.currentTenant,
        tenants: state.tenants,
      }),
    }
  )
);

