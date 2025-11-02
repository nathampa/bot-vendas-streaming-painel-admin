// Componentes UI reutilizáveis para o sistema

// Card Container
export const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
    primary: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff' },
    secondary: { backgroundColor: '#f5f7fa', color: '#1a1d29' },
    success: { backgroundColor: '#10b981', color: '#fff' },
    danger: { backgroundColor: '#ef4444', color: '#fff' },
    warning: { backgroundColor: '#f59e0b', color: '#fff' },
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
        borderRadius: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
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
  style
}: { 
  label?: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', ...style }}>
    {label && (
      <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
        {label}
      </label>
    )}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      style={{
        padding: '12px 16px',
        fontSize: '15px',
        border: '2px solid #e5e7eb',
        borderRadius: '8px',
        outline: 'none',
        transition: 'all 0.2s ease',
        backgroundColor: disabled ? '#f5f7fa' : '#fff',
        width: '100%',
      }}
    />
  </div>
);

// Select Field
export const Select = ({ 
  label, 
  value,
  onChange,
  options,
  required,
  disabled,
  style
}: { 
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', ...style }}>
    {label && (
      <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
        {label}
      </label>
    )}
    <select
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      style={{
        padding: '12px 16px',
        fontSize: '15px',
        border: '2px solid #e5e7eb',
        borderRadius: '8px',
        outline: 'none',
        transition: 'all 0.2s ease',
        backgroundColor: disabled ? '#f5f7fa' : '#fff',
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

// Badge
export const Badge = ({ 
  children, 
  variant = 'default' 
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}) => {
  const variants = {
    default: { backgroundColor: '#e5e7eb', color: '#374151' },
    success: { backgroundColor: '#d1fae5', color: '#065f46' },
    warning: { backgroundColor: '#fef3c7', color: '#92400e' },
    error: { backgroundColor: '#fee2e2', color: '#991b1b' },
    info: { backgroundColor: '#dbeafe', color: '#1e40af' },
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
      border: '4px solid #e5e7eb',
      borderTop: '4px solid #667eea',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    }} />
    {text && <p style={{ fontSize: '16px', color: '#6b7280' }}>{text}</p>}
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
    <h3 style={{ margin: 0, fontSize: '18px', color: '#1a1d29' }}>{title}</h3>
    {description && <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>{description}</p>}
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
      backgroundColor: '#fee2e2', 
      border: '1px solid #fecaca', 
      color: '#991b1b',
      icon: '⚠️'
    },
    warning: { 
      backgroundColor: '#fef3c7', 
      border: '1px solid #fde68a', 
      color: '#92400e',
      icon: '⚠️'
    },
    success: { 
      backgroundColor: '#d1fae5', 
      border: '1px solid #a7f3d0', 
      color: '#065f46',
      icon: '✅'
    },
    info: { 
      backgroundColor: '#dbeafe', 
      border: '1px solid #bfdbfe', 
      color: '#1e40af',
      icon: 'ℹ️'
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
    borderBottom: '1px solid #e5e7eb',
  }}>
    <div>
      <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 700, color: '#1a1d29' }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
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
        backgroundColor: '#fff',
        borderRadius: '16px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{title}</h2>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '4px',
            color: '#6b7280',
          }}>
            ×
          </button>
        </div>
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};