/**
 * Skeleton Loading Components
 * Provides visual feedback during content loading
 */

import React from 'react';
import { cn } from '@/lib/utils';

// Base Skeleton component
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'shimmer' | 'none';
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    shimmer: 'skeleton-shimmer',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? '1rem' : undefined),
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
      aria-hidden="true"
      role="presentation"
    />
  );
}

// Text Line Skeleton
interface TextSkeletonProps {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}

export function TextSkeleton({
  lines = 3,
  className,
  lastLineWidth = '75%',
}: TextSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? lastLineWidth : '100%'}
          height={16}
        />
      ))}
    </div>
  );
}

// Avatar Skeleton
interface AvatarSkeletonProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function AvatarSkeleton({ size = 'md', className }: AvatarSkeletonProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <Skeleton
      variant="circular"
      className={cn(sizeClasses[size], className)}
    />
  );
}

// Card Skeleton
interface CardSkeletonProps {
  showImage?: boolean;
  lines?: number;
  className?: string;
}

export function CardSkeleton({
  showImage = true,
  lines = 3,
  className,
}: CardSkeletonProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 overflow-hidden',
        className
      )}
    >
      {showImage && (
        <Skeleton variant="rectangular" className="w-full h-48" />
      )}
      <div className="p-4 space-y-4">
        <Skeleton variant="text" height={24} width="60%" />
        <TextSkeleton lines={lines} />
      </div>
    </div>
  );
}

// Table Row Skeleton
interface TableRowSkeletonProps {
  columns?: number;
  className?: string;
}

export function TableRowSkeleton({
  columns = 5,
  className,
}: TableRowSkeletonProps) {
  return (
    <tr className={cn('border-b border-gray-100', className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton
            variant="text"
            height={16}
            width={i === 0 ? '80%' : i === columns - 1 ? '60%' : '70%'}
          />
        </td>
      ))}
    </tr>
  );
}

// Table Skeleton
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
  showHeader = true,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200', className)}>
      <table className="w-full">
        {showHeader && (
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-4 py-3 text-left">
                  <Skeleton variant="text" height={14} width="70%" />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Stats Card Skeleton
export function StatsCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 p-6',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="text" height={14} width={100} />
        <Skeleton variant="circular" className="w-10 h-10" />
      </div>
      <Skeleton variant="text" height={32} width={140} className="mb-2" />
      <Skeleton variant="text" height={12} width={80} />
    </div>
  );
}

// Dashboard Stats Grid Skeleton
export function DashboardStatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatsCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Chart Skeleton
interface ChartSkeletonProps {
  height?: number;
  className?: string;
}

export function ChartSkeleton({
  height = 300,
  className,
}: ChartSkeletonProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 p-6',
        className
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <Skeleton variant="text" height={20} width={150} />
        <Skeleton variant="rectangular" height={32} width={120} className="rounded-lg" />
      </div>
      <Skeleton
        variant="rectangular"
        height={height}
        className="w-full rounded-lg"
      />
    </div>
  );
}

// Student Profile Skeleton
export function StudentProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <AvatarSkeleton size="xl" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" height={28} width={200} />
            <Skeleton variant="text" height={16} width={150} />
            <div className="flex gap-2 mt-3">
              <Skeleton variant="rectangular" height={24} width={80} className="rounded-full" />
              <Skeleton variant="rectangular" height={24} width={100} className="rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>

      {/* Payment History Table */}
      <TableSkeleton rows={5} columns={5} />
    </div>
  );
}

// Payment Form Skeleton
export function PaymentFormSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <Skeleton variant="text" height={24} width={200} className="mb-4" />
      
      {/* Form Fields */}
      <div className="space-y-4">
        {/* Student Select */}
        <div>
          <Skeleton variant="text" height={14} width={80} className="mb-2" />
          <Skeleton variant="rectangular" height={44} className="rounded-lg" />
        </div>

        {/* Amount */}
        <div>
          <Skeleton variant="text" height={14} width={60} className="mb-2" />
          <Skeleton variant="rectangular" height={44} className="rounded-lg" />
        </div>

        {/* Payment Method */}
        <div>
          <Skeleton variant="text" height={14} width={120} className="mb-2" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={60}
                className="rounded-lg"
              />
            ))}
          </div>
        </div>

        {/* Reference */}
        <div>
          <Skeleton variant="text" height={14} width={100} className="mb-2" />
          <Skeleton variant="rectangular" height={44} className="rounded-lg" />
        </div>
      </div>

      {/* Submit Button */}
      <Skeleton variant="rectangular" height={48} className="rounded-lg" />
    </div>
  );
}

// List Item Skeleton
export function ListItemSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200',
        className
      )}
    >
      <AvatarSkeleton size="md" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" height={16} width="60%" />
        <Skeleton variant="text" height={12} width="40%" />
      </div>
      <Skeleton variant="rectangular" height={32} width={80} className="rounded-lg" />
    </div>
  );
}

// Sidebar Skeleton
export function SidebarSkeleton() {
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full p-4 space-y-6">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2">
        <Skeleton variant="circular" className="w-10 h-10" />
        <Skeleton variant="text" height={20} width={100} />
      </div>

      {/* Nav Items */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <Skeleton variant="rectangular" className="w-5 h-5 rounded" />
            <Skeleton variant="text" height={14} width={i % 2 === 0 ? 80 : 100} />
          </div>
        ))}
      </div>

      {/* User Section */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <AvatarSkeleton size="sm" />
          <div className="flex-1">
            <Skeleton variant="text" height={14} width={80} />
            <Skeleton variant="text" height={10} width={60} className="mt-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Full Page Loading Skeleton
export function PageLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Page Header */}
      <div className="mb-8">
        <Skeleton variant="text" height={32} width={250} className="mb-2" />
        <Skeleton variant="text" height={16} width={400} />
      </div>

      {/* Stats Grid */}
      <DashboardStatsSkeleton count={4} />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2">
          <ChartSkeleton height={350} />
        </div>
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <Skeleton variant="text" height={20} width={120} className="mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <ListItemSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline Loading Spinner
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <svg
      className={cn('animate-spin text-primary-600', sizeClasses[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      data-testid="loading-spinner"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Full screen loading overlay
export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
}

export default Skeleton;
