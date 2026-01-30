"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

// ============================================================================
// Context
// ============================================================================

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// ============================================================================
// Provider
// ============================================================================

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

export function ToastProvider({ children, maxToasts = 5 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newToast: Toast = {
        ...toast,
        id,
        duration: toast.duration ?? 5000,
      };

      setToasts((prev) => {
        const updated = [...prev, newToast];
        // Keep only the latest maxToasts
        return updated.slice(-maxToasts);
      });

      return id;
    },
    [maxToasts],
  );

  const success = useCallback(
    (title: string, message?: string) => {
      addToast({ type: "success", title, message });
    },
    [addToast],
  );

  const error = useCallback(
    (title: string, message?: string) => {
      addToast({ type: "error", title, message, duration: 8000 }); // Errors stay longer
    },
    [addToast],
  );

  const warning = useCallback(
    (title: string, message?: string) => {
      addToast({ type: "warning", title, message });
    },
    [addToast],
  );

  const info = useCallback(
    (title: string, message?: string) => {
      addToast({ type: "info", title, message });
    },
    [addToast],
  );

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// ============================================================================
// Toast Container
// ============================================================================

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

// ============================================================================
// Toast Item
// ============================================================================

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, toast.duration - 300); // Start exit animation before removal

      const removeTimer = setTimeout(() => {
        onRemove(toast.id);
      }, toast.duration);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [toast.id, toast.duration, onRemove]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const icons: Record<ToastType, string> = {
    success: "check_circle",
    error: "error",
    warning: "warning",
    info: "info",
  };

  const styles: Record<
    ToastType,
    { bg: string; icon: string; border: string }
  > = {
    success: {
      bg: "bg-green-50 dark:bg-green-900/20",
      icon: "text-green-500",
      border: "border-green-200 dark:border-green-800",
    },
    error: {
      bg: "bg-red-50 dark:bg-red-900/20",
      icon: "text-red-500",
      border: "border-red-200 dark:border-red-800",
    },
    warning: {
      bg: "bg-amber-50 dark:bg-amber-900/20",
      icon: "text-amber-500",
      border: "border-amber-200 dark:border-amber-800",
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      icon: "text-blue-500",
      border: "border-blue-200 dark:border-blue-800",
    },
  };

  const style = styles[toast.type];

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm",
        "transform transition-all duration-300 ease-out",
        style.bg,
        style.border,
        isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100",
      )}
      role="alert"
    >
      <span
        className={cn(
          "material-symbols-outlined text-xl flex-shrink-0",
          style.icon,
        )}
      >
        {icons[toast.type]}
      </span>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white text-sm">
          {toast.title}
        </p>
        {toast.message && (
          <p className="text-gray-600 dark:text-gray-300 text-sm mt-0.5">
            {toast.message}
          </p>
        )}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="mt-2 text-sm font-medium text-accent hover:text-accent-hover"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
}

// ============================================================================
// Standalone Toast Function (for use outside React components)
// ============================================================================

let globalAddToast: ((toast: Omit<Toast, "id">) => string) | null = null;

export function setGlobalToastHandler(handler: typeof globalAddToast) {
  globalAddToast = handler;
}

export const toast = {
  success: (title: string, message?: string) => {
    globalAddToast?.({ type: "success", title, message });
  },
  error: (title: string, message?: string) => {
    globalAddToast?.({ type: "error", title, message, duration: 8000 });
  },
  warning: (title: string, message?: string) => {
    globalAddToast?.({ type: "warning", title, message });
  },
  info: (title: string, message?: string) => {
    globalAddToast?.({ type: "info", title, message });
  },
};

export default ToastProvider;
