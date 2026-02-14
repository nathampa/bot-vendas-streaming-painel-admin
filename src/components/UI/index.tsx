import { useId } from 'react';

// Componentes UI reutilizáveis para o sistema

// Card Container
export const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    backgroundColor: 'var(--surface-base)',
    borderRadius: '14px',
    padding: '24px',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border-subtle)',
    ...style
  }}>
    {children}
  </div>
);

// Button Primary
export const Button = ({ 
  children, 
  onClick, 
  disabled, 
  variant = 'primary',
  type = 'button',
  style
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
}) => {
  const variants = {
    primary: { background: 'var(--brand-gradient)', color: 'var(--text-inverse)' },
    secondary: { backgroundColor: 'var(--surface-muted)', color: 'var(--text-primary)' },
    success: { backgroundColor: 'var(--success)', color: 'var(--text-inverse)' },
    danger: { backgroundColor: 'var(--error)', color: 'var(--text-inverse)' },
    warning: { backgroundColor: 'var(--warning)', color: 'var(--text-inverse)' },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '12px 24px',
        fontSize: '14px',
        fontWeight: 600,
        border: 'none',
        borderRadius: '10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast)',
        opacity: disabled ? 0.6 : 1,
        ...variants[variant],
        ...style
      }}
    >
      {children}
    </button>
  );
};

// Input Field
export const Input = ({ 
  label, 
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  disabled,
  id,
  style
}: { 
  label?: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  style?: React.CSSProperties;
}) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', ...style }}>
      {label && (
        <label htmlFor={inputId} style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        style={{
          padding: '12px 16px',
          fontSize: '15px',
          border: '2px solid var(--border-subtle)',
          borderRadius: '10px',
          transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
          backgroundColor: disabled ? 'var(--surface-muted)' : 'var(--surface-base)',
          width: '100%',
        }}
      />
    </div>
  );
};

// Select Field
export const Select = ({ 
  label, 
  value,
  onChange,
  options,
  required,
  disabled,
  id,
  style
}: { 
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
  id?: string;
  style?: React.CSSProperties;
}) => {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', ...style }}>
      {label && (
        <label htmlFor={selectId} style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        style={{
          padding: '12px 16px',
          fontSize: '15px',
          border: '2px solid var(--border-subtle)',
          borderRadius: '10px',
          transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
          backgroundColor: disabled ? 'var(--surface-muted)' : 'var(--surface-base)',
          width: '100%',
          cursor: 'pointer',
        }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
};

// Badge
export const Badge = ({ 
  children, 
  variant = 'default' 
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}) => {
  const variants = {
    default: { backgroundColor: 'var(--border-subtle)', color: 'var(--text-secondary)' },
    success: { backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success-fg)' },
    warning: { backgroundColor: 'var(--status-warning-bg)', color: 'var(--status-warning-fg)' },
    error: { backgroundColor: 'var(--status-error-bg)', color: 'var(--status-error-fg)' },
    info: { backgroundColor: 'var(--status-info-bg)', color: 'var(--status-info-fg)' },
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 12px',
      fontSize: '12px',
      fontWeight: 600,
      borderRadius: '6px',
      ...variants[variant]
    }}>
      {children}
    </span>
  );
};

// Loading Spinner
export const LoadingSpinner = ({ text }: { text?: string }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '16px',
  }}>
    <div style={{
      width: '48px',
      height: '48px',
      border: '4px solid var(--border-subtle)',
      borderTop: '4px solid var(--brand-500)',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    }} />
    {text && <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>{text}</p>}
  </div>
);

// Empty State
export const EmptyState = ({ 
  icon, 
  title, 
  description 
}: { 
  icon: string; 
  title: string; 
  description?: string;
}) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    gap: '12px',
  }}>
    <span style={{ fontSize: '64px', opacity: 0.5 }}>{icon}</span>
    <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>{title}</h3>
    {description && <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>{description}</p>}
  </div>
);

// Alert/Error Box
export const Alert = ({ 
  children, 
  variant = 'error' 
}: { 
  children: React.ReactNode; 
  variant?: 'error' | 'warning' | 'success' | 'info';
}) => {
  const variants = {
    error: { 
      backgroundColor: 'var(--status-error-bg)', 
      border: '1px solid var(--status-error-border)', 
      color: 'var(--status-error-fg)',
      icon: '!'
    },
    warning: { 
      backgroundColor: 'var(--status-warning-bg)', 
      border: '1px solid var(--status-warning-border)', 
      color: 'var(--status-warning-fg)',
      icon: '!'
    },
    success: { 
      backgroundColor: 'var(--status-success-bg)', 
      border: '1px solid var(--status-success-border)', 
      color: 'var(--status-success-fg)',
      icon: 'OK'
    },
    info: { 
      backgroundColor: 'var(--status-info-bg)', 
      border: '1px solid var(--status-info-border)', 
      color: 'var(--status-info-fg)',
      icon: 'i'
    },
  };

  const style = variants[variant];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 16px',
      borderRadius: '8px',
      ...style
    }}>
      <span style={{ fontSize: '18px' }}>{style.icon}</span>
      <div style={{ flex: 1, fontSize: '14px', fontWeight: 500 }}>
        {children}
      </div>
    </div>
  );
};

// Section Header
export const SectionHeader = ({ 
  title, 
  subtitle, 
  action 
}: { 
  title: string; 
  subtitle?: string; 
  action?: React.ReactNode;
}) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--border-subtle)',
  }}>
    <div>
      <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
          {subtitle}
        </p>
      )}
    </div>
    {action && <div>{action}</div>}
  </div>
);

// Modal/Dialog
export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode;
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px',
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'var(--surface-base)',
        borderRadius: '18px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: 'var(--shadow-xl)',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar modal" style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--text-secondary)',
          }}>
            x
          </button>
        </div>
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

