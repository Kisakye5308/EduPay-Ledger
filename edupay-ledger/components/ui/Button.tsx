"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "success";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
  fullWidth?: boolean;
  /** Accessible label for icon-only buttons */
  "aria-label"?: string;
}

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  loading = false,
  fullWidth = false,
  disabled,
  "aria-label": ariaLabel,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-900";

  const variants = {
    primary: "bg-primary text-white hover:bg-primary/90 shadow-md",
    secondary: "bg-emerald-soft text-white hover:bg-emerald-soft/90 shadow-md",
    outline:
      "bg-white border border-gray-200 dark:border-gray-700 text-primary dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm",
    ghost:
      "text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-md",
    success: "bg-green-500 text-white hover:bg-green-600 shadow-md",
  };

  const sizes = {
    sm: "h-9 px-3 text-xs",
    md: "h-11 px-5 text-sm",
    lg: "h-12 px-6 text-base",
  };

  // Determine if button is icon-only
  const isIconOnly = icon && !children;

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
      disabled={disabled || loading}
      aria-label={isIconOnly ? ariaLabel : undefined}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <>
          <span
            className="material-symbols-outlined animate-spin text-lg"
            aria-hidden="true"
          >
            progress_activity
          </span>
          <span className="sr-only">Loading...</span>
        </>
      )}
      {!loading && icon && iconPosition === "left" && (
        <span aria-hidden="true">{icon}</span>
      )}
      {children}
      {!loading && icon && iconPosition === "right" && (
        <span aria-hidden="true">{icon}</span>
      )}
    </button>
  );
}
