import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getApiErrorMessage } from '../utils/errors';

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
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Erro desconhecido.'));
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <div style={styles.header}>
          <div style={styles.logoWrapper}>
            <span style={styles.logoIcon}>FS</span>
          </div>
          <h1 style={styles.title}>Ferreira Streamings</h1>
          <p style={styles.subtitle}>Painel Administrativo</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="login-email" style={styles.label}>
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              style={styles.input}
              placeholder="seu@email.com"
              autoComplete="username"
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="login-password" style={styles.label}>
              Senha
            </label>
            <input
              id="login-password"
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              required
              style={styles.input}
              placeholder="Digite sua senha"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span style={styles.errorText}>{error}</span>
            </div>
          )}

          <button type="submit" disabled={isLoading} style={styles.submitButton}>
            {isLoading ? 'Entrando...' : 'Entrar no Painel'}
          </button>
        </form>
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
  },
  loginBox: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  header: { textAlign: 'center', marginBottom: '32px' },
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
  logoIcon: { fontSize: '24px', fontWeight: 700 },
  title: { margin: '0 0 8px 0', fontSize: '28px', fontWeight: 700, color: '#1a1d29' },
  subtitle: { margin: 0, fontSize: '14px', color: '#6b7280', fontWeight: 500 },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: 600, color: '#374151' },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#fff',
    color: '#1a1d29',
    boxSizing: 'border-box',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
  },
  errorText: { fontSize: '14px', color: '#991b1b', fontWeight: 500 },
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
  },
};

