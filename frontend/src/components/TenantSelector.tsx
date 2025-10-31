import { useEffect, useState } from 'react';
import { useTenantStore } from '@/stores/tenantStore';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Building2, Check, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function TenantSelector() {
  const { isAuthenticated } = useAuth();
  const { currentTenant, tenants, isLoading, setCurrentTenant, setTenants, setLoading, setError } = useTenantStore();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch user's tenants
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const fetchTenants = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get access token from MSAL (would need to be implemented in AuthContext)
        const token = localStorage.getItem('msal-access-token') || '';
        
        const response = await fetch(`${API_URL}/tenants`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tenants');
        }

        const data = await response.json();
        setTenants(data);

        // Set current tenant if not set
        if (!currentTenant && data.length > 0) {
          // Try to get from localStorage first
          const savedTenantId = localStorage.getItem('current-tenant-id');
          const savedTenant = savedTenantId 
            ? data.find((t: any) => t.id === savedTenantId)
            : null;
          
          setCurrentTenant(savedTenant || data[0]);
          
          if (savedTenantId) {
            localStorage.setItem('current-tenant-id', savedTenant?.id || data[0].id);
          }
        }
      } catch (error: any) {
        console.error('[TenantSelector] Error fetching tenants:', error);
        setError(error.message);
        toast.error('Failed to load tenants');
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, [isAuthenticated, setLoading, setTenants, setError, currentTenant, setCurrentTenant]);

  const handleTenantSwitch = (tenant: any) => {
    setCurrentTenant(tenant);
    localStorage.setItem('current-tenant-id', tenant.id);
    setIsOpen(false);
    toast.success(`Switched to ${tenant.name}`);
    
    // Reload page to update tenant context
    window.location.reload();
  };

  const handleCreateTenant = () => {
    // Navigate to tenant creation page or open dialog
    toast.info('Tenant creation feature coming soon');
    setIsOpen(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (tenants.length === 0) {
    return (
      <Button variant="outline" onClick={handleCreateTenant}>
        <Plus className="mr-2 h-4 w-4" />
        Create Tenant
      </Button>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Building2 className="mr-2 h-4 w-4" />
          <span className="flex-1 text-left truncate">
            {currentTenant?.name || 'Select Tenant'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Your Tenants</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => handleTenantSwitch(tenant)}
            className="flex items-center justify-between"
          >
            <div className="flex-1">
              <p className="font-medium">{tenant.name}</p>
              <p className="text-xs text-muted-foreground">{tenant.role}</p>
            </div>
            {currentTenant?.id === tenant.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCreateTenant}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Tenant
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

