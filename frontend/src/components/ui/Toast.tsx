import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  description: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  show: (item: Omit<ToastItem, 'id'>) => string;
  dismiss: (id: string) => void;
  success: (description: string, title?: string) => string;
  error: (description: string, title?: string) => string;
  warning: (description: string, title?: string) => string;
  info: (description: string, title?: string) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((item: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { ...item, id };
    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const success = useCallback(
    (description: string, title?: string) => show({ type: 'success', description, title }),
    [show]
  );

  const error = useCallback(
    (description: string, title?: string) => show({ type: 'error', description, title }),
    [show]
  );

  const warning = useCallback(
    (description: string, title?: string) => show({ type: 'warning', description, title }),
    [show]
  );

  const info = useCallback(
    (description: string, title?: string) => show({ type: 'info', description, title }),
    [show]
  );

  return (
    <ToastContext.Provider value={{ toasts, show, dismiss, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full px-4 pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>,
    document.body
  );
};

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: () => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onDismiss }) => {
  const duration = toast.duration ?? 4000;

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const getStyle = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: CheckCircle2,
          iconColor: 'text-emerald-600',
          bg: 'bg-emerald-50/90',
          border: 'border-emerald-200',
          titleColor: 'text-emerald-950',
          textColor: 'text-emerald-800',
        };
      case 'error':
        return {
          icon: AlertCircle,
          iconColor: 'text-red-600',
          bg: 'bg-red-50/90',
          border: 'border-red-200',
          titleColor: 'text-red-950',
          textColor: 'text-red-800',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-amber-600',
          bg: 'bg-amber-50/90',
          border: 'border-amber-200',
          titleColor: 'text-amber-950',
          textColor: 'text-amber-800',
        };
      case 'info':
      default:
        return {
          icon: Info,
          iconColor: 'text-blue-600',
          bg: 'bg-blue-50/90',
          border: 'border-blue-200',
          titleColor: 'text-blue-950',
          textColor: 'text-blue-800',
        };
    }
  };

  const style = getStyle();
  const Icon = style.icon;

  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-2 ${style.bg} ${style.border}`}
    >
      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${style.iconColor}`} />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className={`text-xs font-bold leading-tight ${style.titleColor}`}>
            {toast.title}
          </h4>
        )}
        <p className={`text-xs font-medium leading-relaxed ${style.textColor} ${toast.title ? 'mt-0.5' : ''}`}>
          {toast.description}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="p-1 -mr-1 -mt-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors focus:outline-none"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ToastProvider;
