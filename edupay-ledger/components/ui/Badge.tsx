'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 
  | 'default' 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'info' 
  | 'primary'
  | 'secondary'
  | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  icon?: string;
  className?: string;
}

export function Badge({ 
  children, 
  variant = 'default', 
  size = 'sm',
  dot = false,
  icon,
  className 
}: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    success: 'bg-status-green/10 text-status-green',
    warning: 'bg-status-yellow/10 text-status-yellow',
    danger: 'bg-status-red/10 text-status-red',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    primary: 'bg-primary/10 text-primary dark:text-blue-300',
    secondary: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    outline: 'bg-transparent border border-current',
  };

  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  const dotColors: Record<BadgeVariant, string> = {
    default: 'bg-gray-500',
    success: 'bg-status-green',
    warning: 'bg-status-yellow',
    danger: 'bg-status-red',
    info: 'bg-blue-500',
    primary: 'bg-primary',
    secondary: 'bg-purple-500',
    outline: 'bg-current',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-bold',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />
      )}
      {icon && (
        <span className="material-symbols-outlined text-xs">{icon}</span>
      )}
      {children}
    </span>
  );
}

// Payment Status Badge
interface PaymentStatusBadgeProps {
  status: 'fully_paid' | 'partial' | 'overdue' | 'no_payment';
  className?: string;
}

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  const config: Record<string, { label: string; variant: BadgeVariant }> = {
    fully_paid: { label: 'Fully Paid', variant: 'success' },
    partial: { label: 'Partial Payment', variant: 'warning' },
    overdue: { label: 'Overdue', variant: 'danger' },
    no_payment: { label: 'No Payment', variant: 'danger' },
  };

  const { label, variant } = config[status] || config.no_payment;

  return (
    <Badge variant={variant} dot className={className}>
      {label}
    </Badge>
  );
}

// Severity Badge
interface SeverityBadgeProps {
  severity: 'high' | 'medium' | 'low';
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const config: Record<string, { label: string; variant: BadgeVariant }> = {
    high: { label: 'High', variant: 'danger' },
    medium: { label: 'Medium', variant: 'warning' },
    low: { label: 'Low', variant: 'info' },
  };

  const { label, variant } = config[severity];

  return (
    <Badge variant={variant} className={cn('uppercase', className)}>
      {label}
    </Badge>
  );
}

// Verification Badge
interface VerificationBadgeProps {
  verified: boolean;
  className?: string;
}

export function VerificationBadge({ verified, className }: VerificationBadgeProps) {
  return (
    <Badge 
      variant={verified ? 'success' : 'warning'} 
      icon={verified ? 'verified' : 'pending'}
      className={className}
    >
      {verified ? 'Verified' : 'Pending'}
    </Badge>
  );
}
