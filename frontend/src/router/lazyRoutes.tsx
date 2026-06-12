import { lazy, Suspense, ComponentType } from 'react';
import { Spinner } from '@/components/Loading';

// ==========================================
// LAZY LOAD HELPER
// ==========================================
function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback = <Spinner size="lg" />
) {
  const LazyComponent = lazy(importFunc);

  return (props: any) => (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">{fallback}</div>}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

// ==========================================
// LAZY LOADED PAGES
// ==========================================

export const LandingPage = lazyLoad(() => import('@/pages/LandingPage'));
export const Dashboard = lazyLoad(() => import('@/pages/Dashboard'));
export const Documents = lazyLoad(() => import('@/pages/Documents'));
export const DocumentDetail = lazyLoad(() => import('@/pages/DocumentDetail'));
export const Assets = lazyLoad(() => import('@/pages/Assets'));
export const Agent = lazyLoad(() => import('@/pages/Agent'));
export const Settings = lazyLoad(() => import('@/pages/Settings'));

// ==========================================
// PRELOAD FUNCTIONS
// ==========================================

export const preloadDashboard = () => import('@/pages/Dashboard');
export const preloadDocuments = () => import('@/pages/Documents');
export const preloadAssets = () => import('@/pages/Assets');
export const preloadAgent = () => import('@/pages/Agent');
export const preloadSettings = () => import('@/pages/Settings');
