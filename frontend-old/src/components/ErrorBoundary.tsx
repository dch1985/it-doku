/**
 * Error Boundary Component
 * Fängt JavaScript-Fehler in der Component-Tree und zeigt Fallback-UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../utils/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state damit nächster Render Fallback-UI zeigt
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log Error
    logger.error('Error Boundary caught an error:', error, {
      componentStack: errorInfo.componentStack,
    });

    // Update State mit Error Info
    this.setState({
      errorInfo,
    });

    // Custom Error Handler aufrufen falls vorhanden
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Hier könnte Integration mit Error-Tracking-Service
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     contexts: {
    //       react: {
    //         componentStack: errorInfo.componentStack,
    //       },
    //     },
    //   });
    // }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom Fallback rendern falls vorhanden
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Standard Error UI
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

/**
 * Standard Error Fallback UI
 */
interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onReset }) => {
  const isDevelopment = import.meta.env.MODE === 'development';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
          <svg
            className="w-6 h-6 text-red-600 dark:text-red-400"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
          Etwas ist schiefgelaufen
        </h2>

        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          Die Anwendung ist auf einen unerwarteten Fehler gestoßen.
        </p>

        {isDevelopment && error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
            <p className="text-sm font-mono text-red-800 dark:text-red-300 break-all">
              {error.toString()}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onReset}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Erneut versuchen
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
          >
            Seite neu laden
          </button>
        </div>

        <p className="text-xs text-center text-gray-500 dark:text-gray-500 mt-4">
          Falls das Problem weiterhin besteht, kontaktiere bitte den Support.
        </p>
      </div>
    </div>
  );
};

export default ErrorBoundary;
