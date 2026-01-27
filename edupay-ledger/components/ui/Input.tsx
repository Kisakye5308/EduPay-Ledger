'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  prefix?: string;
  suffix?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, prefix, suffix, type = 'text', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-primary dark:text-gray-200 text-base font-medium">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              {icon}
            </div>
          )}
          {prefix && (
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-gray-500 font-bold">{prefix}</span>
            </div>
          )}
          <input
            type={type}
            className={cn(
              'form-input block w-full rounded-lg border-gray-300 dark:border-gray-700',
              'bg-gray-50 dark:bg-gray-800 text-primary dark:text-white',
              'focus:border-primary focus:ring-1 focus:ring-primary',
              'placeholder:text-gray-500',
              icon && 'pl-10',
              prefix && 'pl-16',
              suffix && 'pr-10',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              className
            )}
            ref={ref}
            {...props}
          />
          {suffix && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {suffix}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-gray-500">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-primary dark:text-gray-200 text-base font-medium">
            {label}
          </label>
        )}
        <textarea
          className={cn(
            'form-textarea block w-full rounded-lg border-gray-300 dark:border-gray-700',
            'bg-gray-50 dark:bg-gray-800 text-primary dark:text-white',
            'focus:border-primary focus:ring-1 focus:ring-primary',
            'placeholder:text-gray-500 min-h-[100px] resize-y',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-gray-500">{hint}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: Array<{ value: string; label: string }>;
  children?: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-primary dark:text-gray-200 text-base font-medium">
            {label}
          </label>
        )}
        <select
          className={cn(
            'form-select block w-full rounded-lg border-gray-300 dark:border-gray-700',
            'bg-gray-50 dark:bg-gray-800 text-primary dark:text-white',
            'focus:border-primary focus:ring-1 focus:ring-primary',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        >
          {options ? options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          )) : children}
        </select>
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
