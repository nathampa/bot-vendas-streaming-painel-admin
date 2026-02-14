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
  success: { backgroundColor: '#dcfce7', color: '#166534', borderColor: '#86efac' },
  error: { backgroundColor: '#fee2e2', color: '#991b1b', borderColor: '#fecaca' },
  info: { backgroundColor: '#dbeafe', color: '#1e40af', borderColor: '#bfdbfe' },
  warning: { backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fde68a' },
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
      const variant: ToastVariant =
        text.includes('❌') || text.toLowerCase().includes('erro')
          ? 'error'
          : text.includes('⚠') || text.toLowerCase().includes('atenc')
            ? 'warning'
            : text.includes('✅')
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

