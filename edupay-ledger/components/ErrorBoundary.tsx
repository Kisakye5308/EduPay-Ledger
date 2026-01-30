"use client";

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in child component tree
 * and displays a fallback UI instead of crashing
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { reportErrorBoundary } from "@/lib/services/error-reporting.service";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Send to error reporting service
    reportErrorBoundary(error, errorInfo, {
      page:
        typeof window !== "undefined" ? window.location.pathname : undefined,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Return custom fallback or default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback UI
interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
}

export function DefaultErrorFallback({
  error,
  errorInfo,
  onReset,
}: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-error-100 p-8 text-center">
        {/* Error Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error-50 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-error-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Error Title */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Something went wrong
        </h2>

        {/* Error Message */}
        <p className="text-gray-600 mb-6">
          We're sorry, but something unexpected happened. Please try again or
          contact support if the problem persists.
        </p>

        {/* Development Mode: Show Error Details */}
        {isDevelopment && error && (
          <div className="mb-6 text-left">
            <details className="bg-gray-50 rounded-lg p-4">
              <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                Error Details (Development Only)
              </summary>
              <div className="mt-3 space-y-2">
                <div className="text-sm">
                  <span className="font-medium text-error-600">Error: </span>
                  <code className="text-gray-800">{error.message}</code>
                </div>
                {error.stack && (
                  <pre className="text-xs text-gray-600 overflow-auto max-h-40 bg-white p-2 rounded border">
                    {error.stack}
                  </pre>
                )}
                {errorInfo?.componentStack && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-700">
                      Component Stack:
                    </span>
                    <pre className="text-xs text-gray-600 overflow-auto max-h-32 bg-white p-2 rounded border mt-1">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onReset}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Reload Page
          </button>
        </div>

        {/* Support Link */}
        <p className="mt-6 text-sm text-gray-500">
          Need help?{" "}
          <a href="/support" className="text-primary-600 hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}

// Page-level error fallback with more context
interface PageErrorFallbackProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function PageErrorFallback({
  title = "Page Error",
  message = "This page failed to load. Please try refreshing.",
  onRetry,
}: PageErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Illustration */}
        <div className="w-24 h-24 mx-auto mb-6">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-full h-full text-error-400"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M8 8l8 8M16 8l-8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">{title}</h1>
        <p className="text-gray-600 mb-8">{message}</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
          >
            Go Back
          </button>
          <a
            href="/dashboard"
            className="px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

// Network error fallback
export function NetworkErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Offline Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-warning-50 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-warning-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a5 5 0 01-7.072-7.072l1.414 1.414a3 3 0 004.243 4.243l1.414 1.414zm2.829-9.9a5 5 0 00-7.072 7.072l1.414-1.414a3 3 0 014.243-4.243L9.88 4.465z"
            />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Connection Lost
        </h2>
        <p className="text-gray-600 mb-6">
          Please check your internet connection and try again. Your data is safe
          and will sync when you're back online.
        </p>

        <button
          onClick={onRetry || (() => window.location.reload())}
          className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
        >
          Retry Connection
        </button>
      </div>
    </div>
  );
}

// Data loading error fallback
interface DataErrorFallbackProps {
  message?: string;
  onRetry?: () => void;
}

export function DataErrorFallback({
  message = "Failed to load data",
  onRetry,
}: DataErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-12 h-12 mb-4 rounded-full bg-error-50 flex items-center justify-center">
        <svg
          className="w-6 h-6 text-error-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <p className="text-gray-600 mb-4">{message}</p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorBoundary;
