/**
 * Performance Utilities
 * Helpers for lazy loading, code splitting, and performance optimizations
 */

import dynamic from 'next/dynamic';
import { ComponentType, lazy, Suspense } from 'react';

// ============================================================================
// Loading Components
// ============================================================================

/**
 * Generic loading spinner component
 */
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-slate-200 border-t-primary`}
      />
    </div>
  );
}

/**
 * Skeleton loader for cards
 */
export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 animate-pulse">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4" />
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2" />
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
    </div>
  );
}

/**
 * Skeleton loader for tables
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 animate-pulse" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="p-4 border-b border-slate-100 dark:border-slate-800 flex gap-4 animate-pulse"
        >
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/6" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/5" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/6" />
        </div>
      ))}
    </div>
  );
}

/**
 * Page loading skeleton
 */
export function PageSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <TableSkeleton rows={8} />
    </div>
  );
}

// ============================================================================
// Lazy Loading Helpers
// ============================================================================

/**
 * Create a dynamically imported component with loading state
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  LoadingComponent: ComponentType = LoadingSpinner
) {
  return dynamic(importFn, {
    loading: () => <LoadingComponent />,
    ssr: true,
  });
}

/**
 * Create a dynamically imported component without SSR (client-only)
 */
export function lazyLoadClient<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  LoadingComponent: ComponentType = LoadingSpinner
) {
  return dynamic(importFn, {
    loading: () => <LoadingComponent />,
    ssr: false,
  });
}

// ============================================================================
// Performance Hooks
// ============================================================================

/**
 * Debounce function for search inputs, etc.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for scroll events, etc.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ============================================================================
// Image Optimization
// ============================================================================

/**
 * Generate blur placeholder for images
 */
export function getBlurDataURL(width = 10, height = 10): string {
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if (!canvas) {
    // Return a simple gray placeholder for SSR
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }
  
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, width, height);
  }
  return canvas.toDataURL();
}

// ============================================================================
// Intersection Observer for Lazy Loading
// ============================================================================

/**
 * Check if IntersectionObserver is supported
 */
export function supportsIntersectionObserver(): boolean {
  return typeof window !== 'undefined' && 'IntersectionObserver' in window;
}

/**
 * Create an intersection observer for lazy loading
 */
export function createLazyObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (!supportsIntersectionObserver()) return null;

  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry);
      }
    });
  }, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  });
}

// ============================================================================
// Web Vitals
// ============================================================================

/**
 * Report Web Vitals to analytics
 */
export function reportWebVitals(metric: {
  id: string;
  name: string;
  value: number;
  label: 'web-vital' | 'custom';
}) {
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vital] ${metric.name}: ${metric.value}`);
  }

  // In production, send to analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      event_category: metric.label === 'web-vital' ? 'Web Vitals' : 'Custom Metric',
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }
}

// ============================================================================
// Preloading
// ============================================================================

/**
 * Preload critical routes
 */
export function preloadRoute(href: string): void {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Preload multiple routes
 */
export function preloadRoutes(routes: string[]): void {
  routes.forEach(preloadRoute);
}
