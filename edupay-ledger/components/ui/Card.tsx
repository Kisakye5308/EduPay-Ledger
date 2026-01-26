'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, padding = 'md', shadow = true, onClick }: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 rounded-xl border border-border-light dark:border-slate-800',
        shadow && 'shadow-sm',
        paddingStyles[padding],
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function CardHeader({ children, className, action }: CardHeaderProps) {
  return (
    <div className={cn('flex justify-between items-start mb-4', className)}>
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  subtitle?: string;
}

export function CardTitle({ children, className, subtitle }: CardTitleProps) {
  return (
    <div className={className}>
      <h3 className="text-lg font-bold text-primary dark:text-white">{children}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn('', className)}>{children}</div>;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('mt-6 pt-4 border-t border-slate-100 dark:border-slate-800', className)}>
      {children}
    </div>
  );
}

// Stats Card
interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  className,
}: StatsCardProps) {
  const variantStyles = {
    default: '',
    primary: 'bg-primary/5 dark:bg-primary/10 border-primary/10',
    success: 'bg-status-green/5 border-status-green/10',
    warning: 'bg-status-yellow/5 border-status-yellow/10',
    danger: 'bg-status-red/5 border-status-red/10',
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-500',
  };

  const trendIcons = {
    up: 'trending_up',
    down: 'trending_down',
    neutral: 'trending_flat',
  };

  return (
    <Card className={cn(variantStyles[variant], className)}>
      <div className="flex justify-between items-start mb-4">
        {icon && (
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <span className="material-symbols-outlined text-primary dark:text-blue-400">
              {icon}
            </span>
          </div>
        )}
        {trend && (
          <div className={cn('flex items-center gap-1 text-sm font-bold', trendColors[trend.direction])}>
            <span className="material-symbols-outlined text-sm">{trendIcons[trend.direction]}</span>
            <span>{trend.value}</span>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{value}</h3>
      {subtitle && <p className="text-xs text-gray-400 mt-2">{subtitle}</p>}
    </Card>
  );
}
