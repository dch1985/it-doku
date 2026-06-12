import { lazy, Suspense, ComponentType } from 'react';
import { Spinner } from '@/components/Loading';

// ==========================================
// LAZY LOAD HELPER
// ==========================================
function lazyLoad<TProps extends object>(
  importFunc: () => Promise<{ default: ComponentType<TProps> }>,
  fallback = <Spinner size="lg" />
) {
  const LazyComponent = lazy(importFunc);
  
  return (props: TProps) => (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">{fallback}</div>}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

// ==========================================
// LAZY LOADED PAGES
// ==========================================

// Landing Page
export const LandingPage = lazyLoad(() => import('@/pages/LandingPage'));

// Dashboard
export const Dashboard = lazyLoad(() => import('@/pages/Dashboard'));

// Documents
export const Documents = lazyLoad(() => import('@/pages/Documents'));
export const DocumentDetail = lazyLoad(() => import('@/pages/DocumentDetail'));

// Trust Doc expert workspaces
export const AgentSkills = lazyLoad(() => import('@/pages/AgentSkills'));
export const Centralize = lazyLoad(() => import('@/pages/Centralize'));
export const Comply = lazyLoad(() => import('@/pages/Comply'));

// Settings
export const Settings = lazyLoad(() => import('@/pages/Settings'));

// Analytics
export const Analytics = lazyLoad(() => import('@/pages/Analytics'));

// Enterprise Features
export const Passwords = lazyLoad(() => import('@/pages/Passwords'));
export const Assets = lazyLoad(() => import('@/pages/Assets'));
export const Contracts = lazyLoad(() => import('@/pages/Contracts'));
export const NetworkDevices = lazyLoad(() => import('@/pages/NetworkDevices'));
export const CustomerPortals = lazyLoad(() => import('@/pages/CustomerPortals'));
export const ProcessRecordings = lazyLoad(() => import('@/pages/ProcessRecordings'));
