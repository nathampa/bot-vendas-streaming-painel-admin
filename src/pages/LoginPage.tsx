import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(email, senha);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <div style={styles.header}>
          <div style={styles.logoWrapper}>
            <span style={styles.logoIcon}>🎬</span>
          </div>
          <h1 style={styles.title}>Ferreira Streamings</h1>
          <p style={styles.subtitle}>Painel Administrativo</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="seu@email.com"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              style={styles.input}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span style={styles.errorIcon}>⚠️</span>
              <span style={styles.errorText}>{error}</span>
            </div>
          )}

          <button type="submit" disabled={isLoading} style={styles.submitButton}>
            {isLoading ? (
              <>
                <span style={styles.spinner}>⏳</span>
                Entrando...
              </>
            ) : (
              'Entrar no Painel'
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Sistema seguro e protegido 🔒
          </p>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  loginBox: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80px',
    height: '80px',
    backgroundColor: '#f5f7fa',
    borderRadius: '20px',
    marginBottom: '16px',
  },
  logoIcon: {
    fontSize: '48px',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '28px',
    fontWeight: 700,
    color: '#1a1d29',
  },
  subtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: 500,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s ease',
    backgroundColor: '#fff',
    color: '#1a1d29',
    boxSizing: 'border-box',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
  },
  errorIcon: {
    fontSize: '18px',
  },
  errorText: {
    fontSize: '14px',
    color: '#991b1b',
    fontWeight: 500,
  },
  submitButton: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },
  footer: {
    marginTop: '24px',
    textAlign: 'center',
  },
  footerText: {
    margin: 0,
    fontSize: '13px',
    color: '#9ca3af',
  },
};