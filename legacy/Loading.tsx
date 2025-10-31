import React from 'react';
import { Loader2 } from 'lucide-react';

// ==========================================
// SPINNER COMPONENT
// ==========================================
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <Loader2
      className={`animate-spin text-cyan-500 ${sizeClasses[size]} ${className}`}
    />
  );
}

// ==========================================
// LOADING OVERLAY
// ==========================================
interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  className?: string;
}

export function LoadingOverlay({
  isLoading,
  message = 'Loading...',
  className = '',
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div
      className={`
        absolute inset-0 z-50 flex items-center justify-center
        bg-gray-950/80 backdrop-blur-sm
        ${className}
      `}
    >
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-gray-300 text-sm">{message}</p>
      </div>
    </div>
  );
}

// ==========================================
// SKELETON COMPONENTS
// ==========================================
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`
        animate-pulse bg-gray-800 rounded
        ${className}
      `}
    />
  );
}

// Skeleton variants
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
      <Skeleton className="h-6 w-1/2" />
      <SkeletonText lines={3} />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-gray-900 rounded-lg">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-4" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4 p-4 bg-gray-900/50 rounded-lg">
          {Array.from({ length: 4 }).map((_, j) => (
            <Skeleton key={j} className="h-4" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 bg-gray-900 rounded-lg">
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ==========================================
// LOADING STATES
// ==========================================
interface LoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
  spinner?: boolean;
}

export function LoadingState({
  isLoading,
  children,
  skeleton,
  spinner = false,
}: LoadingStateProps) {
  if (!isLoading) {
    return <>{children}</>;
  }

  if (spinner) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return skeleton ? <>{skeleton}</> : <SkeletonCard />;
}

// ==========================================
// PROGRESS BAR
// ==========================================
interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export function ProgressBar({
  progress,
  label,
  showPercentage = true,
  className = '',
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={className}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2 text-sm">
          {label && <span className="text-gray-400">{label}</span>}
          {showPercentage && (
            <span className="text-cyan-400 font-medium">{clampedProgress}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}

// ==========================================
// EMPTY STATE
// ==========================================
interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && (
        <div className="bg-gray-800 rounded-full p-4 mb-4">
          <Icon className="w-8 h-8 text-gray-500" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-300 mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-6 max-w-md">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
