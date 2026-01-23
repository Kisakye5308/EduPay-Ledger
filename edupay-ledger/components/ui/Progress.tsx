'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'emerald';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  showLabel = false,
  label,
  className,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-4',
  };

  const colors = {
    primary: 'bg-primary',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    emerald: 'bg-emerald-soft',
  };

  return (
    <div className={cn('space-y-2', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600 dark:text-slate-400 font-medium">
            {label || 'Progress'}
          </span>
          <span className="text-primary dark:text-white font-bold">
            {percentage.toFixed(1)}%
          </span>
        </div>
      )}
      <div className={cn('w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden', sizes[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colors[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Installment Progress
interface InstallmentProgressProps {
  installments: Array<{
    name: string;
    value: number;
    color?: 'success' | 'primary' | 'warning' | 'danger';
  }>;
  total: number;
  className?: string;
}

export function InstallmentProgress({ installments, total, className }: InstallmentProgressProps) {
  const colors = {
    success: 'bg-emerald-500',
    primary: 'bg-blue-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
  };

  return (
    <div className={cn('space-y-4', className)}>
      {installments.map((installment, index) => {
        const percentage = (installment.value / total) * 100;
        const color = installment.color || 'primary';

        return (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold text-slate-500">{installment.name}</span>
              <span className={cn('text-sm font-black', {
                'text-emerald-600': color === 'success',
                'text-blue-600': color === 'primary',
                'text-amber-600': color === 'warning',
                'text-red-600': color === 'danger',
              })}>
                {installment.value.toLocaleString()} Students
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
              <div
                className={cn('h-2 rounded-full', colors[color])}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Collection Progress (Large)
interface CollectionProgressProps {
  collected: number;
  target: number;
  currency?: string;
  showDetails?: boolean;
  outstanding?: number;
  overdue?: number;
  className?: string;
}

export function CollectionProgress({
  collected,
  target,
  currency = 'UGX',
  showDetails = true,
  outstanding,
  overdue,
  className,
}: CollectionProgressProps) {
  const percentage = (collected / target) * 100;

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    return amount.toLocaleString();
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-600 dark:text-slate-400 font-medium">Current Progress</span>
        <span className="text-primary dark:text-white font-bold">{percentage.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4">
        <div
          className="bg-emerald-soft h-4 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {showDetails && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          {outstanding !== undefined && (
            <div>
              <p className="text-xs text-slate-400">Outstanding</p>
              <p className="text-lg font-bold text-orange-600">{currency} {formatAmount(outstanding)}</p>
            </div>
          )}
          {overdue !== undefined && (
            <div>
              <p className="text-xs text-slate-400">Overdue (30d+)</p>
              <p className="text-lg font-bold text-red-600">{currency} {formatAmount(overdue)}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-400">Expected (Term End)</p>
            <p className="text-lg font-bold text-slate-600 dark:text-slate-300">{currency} {formatAmount(target)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
