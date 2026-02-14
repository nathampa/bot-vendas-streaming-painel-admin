/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useEffect,
  useCallback,
  useContext,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

type Toast = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastContextType = {
  showToast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const variantStyles: Record<ToastVariant, CSSProperties> = {
  success: {
    backgroundColor: 'var(--status-success-bg)',
    color: 'var(--status-success-fg)',
    borderColor: 'var(--status-success-border)',
  },
  error: {
    backgroundColor: 'var(--status-error-bg)',
    color: 'var(--status-error-fg)',
    borderColor: 'var(--status-error-border)',
  },
  info: {
    backgroundColor: 'var(--status-info-bg)',
    color: 'var(--status-info-fg)',
    borderColor: 'var(--status-info-border)',
  },
  warning: {
    backgroundColor: 'var(--status-warning-bg)',
    color: 'var(--status-warning-fg)',
    borderColor: 'var(--status-warning-border)',
  },
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, message, variant }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3500);
  }, []);

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message?: string) => {
      const text = String(message ?? '');
      const lower = text.toLowerCase();
      const variant: ToastVariant =
        lower.includes('erro')
          ? 'error'
          : lower.includes('atenc')
            ? 'warning'
            : lower.includes('sucesso')
              ? 'success'
              : 'info';
      showToast(text, variant);
    };
    return () => {
      window.alert = originalAlert;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div style={styles.container} aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} style={{ ...styles.toast, ...variantStyles[toast.variant] }}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const styles: Record<string, CSSProperties> = {
  container: {
    position: 'fixed',
    top: 16,
    right: 16,
    zIndex: 10000,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    maxWidth: 380,
  },
  toast: {
    border: '1px solid',
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 14,
    fontWeight: 600,
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  },
};


