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

// Dashboard
export const Dashboard = lazyLoad(() => import('@/pages/Dashboard'));

// Documents
export const Documents = lazyLoad(() => import('@/pages/Documents'));
export const DocumentDetail = lazyLoad(() => import('@/pages/DocumentDetail'));

// Settings
export const Settings = lazyLoad(() => import('@/pages/Settings'));

// Analytics
export const Analytics = lazyLoad(() => import('@/pages/Analytics'));



// ==========================================
// PRELOAD FUNCTIONS (für bessere UX)
// ==========================================

export const preloadDashboard = () => import('@/pages/Dashboard');
export const preloadDocuments = () => import('@/pages/Documents');
export const preloadSettings = () => import('@/pages/Settings');
export const preloadAnalytics = () => import('@/pages/Analytics');

// Beispiel: Preload on hover
// <button onMouseEnter={preloadDocuments}>Documents</button>
