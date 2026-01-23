'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ChipProps {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  icon?: string;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
}

export function Chip({
  children,
  selected = false,
  onClick,
  icon,
  onRemove,
  disabled = false,
  className,
}: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-12 px-6 items-center justify-center gap-x-2 rounded-xl transition-all',
        'border-2 cursor-pointer',
        selected
          ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary/30',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {selected && icon !== 'none' && (
        <span className="material-symbols-outlined text-sm">{icon || 'check_circle'}</span>
      )}
      <p className={cn('text-sm', selected ? 'font-bold' : 'font-medium')}>{children}</p>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-current hover:text-red-500 ml-1"
        >
          <span className="material-symbols-outlined text-xs">close</span>
        </button>
      )}
    </button>
  );
}

// Filter Chip (Dropdown style)
interface FilterChipProps {
  label: string;
  value?: string;
  onClick?: () => void;
  onClear?: () => void;
  active?: boolean;
  className?: string;
}

export function FilterChip({
  label,
  value,
  onClick,
  onClear,
  active = false,
  className,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg px-4',
        'border transition-all',
        active
          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-transparent hover:border-primary/30',
        className
      )}
    >
      <span className="text-sm font-medium">{value ? `${label}: ${value}` : label}</span>
      {active && onClear ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      ) : (
        <span className="material-symbols-outlined text-lg">expand_more</span>
      )}
    </button>
  );
}

// Tag Chip (Removable)
interface TagChipProps {
  children: React.ReactNode;
  onRemove?: () => void;
  className?: string;
}

export function TagChip({ children, onRemove, className }: TagChipProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg group',
        className
      )}
    >
      <span className="text-sm font-medium">{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500"
        >
          <span className="material-symbols-outlined text-xs">close</span>
        </button>
      )}
    </div>
  );
}
