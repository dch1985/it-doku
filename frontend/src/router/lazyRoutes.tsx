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

// Landing Page
export const LandingPage = lazyLoad(() => import('@/pages/LandingPage'));

// Dashboard
export const Dashboard = lazyLoad(() => import('@/pages/Dashboard'));

// Documents
export const Documents = lazyLoad(() => import('@/pages/Documents'));
export const DocumentDetail = lazyLoad(() => import('@/pages/DocumentDetail'));

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



// ==========================================
// PRELOAD FUNCTIONS (für bessere UX)
// ==========================================

export const preloadLandingPage = () => import('@/pages/LandingPage');
export const preloadDashboard = () => import('@/pages/Dashboard');
export const preloadDocuments = () => import('@/pages/Documents');
export const preloadSettings = () => import('@/pages/Settings');
export const preloadAnalytics = () => import('@/pages/Analytics');
export const preloadPasswords = () => import('@/pages/Passwords');
export const preloadAssets = () => import('@/pages/Assets');
export const preloadContracts = () => import('@/pages/Contracts');
export const preloadNetworkDevices = () => import('@/pages/NetworkDevices');
export const preloadCustomerPortals = () => import('@/pages/CustomerPortals');
export const preloadProcessRecordings = () => import('@/pages/ProcessRecordings');

// Beispiel: Preload on hover
// <button onMouseEnter={preloadDocuments}>Documents</button>
