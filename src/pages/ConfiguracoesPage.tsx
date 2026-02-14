import { useEffect, useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { getAdminConfig, updateAdminConfig } from '../services/apiClient';
import type { IConfiguracao } from '../types/api.types';
import { getApiErrorMessage } from '../utils/errors';

const initialState: IConfiguracao = {
  id: '',
  afiliado_ativo: false,
  afiliado_gatilho: 'primeira_recarga',
  afiliado_tipo_premio: 'cashback_pendente',
  afiliado_valor_premio: '0',
};

const globalStyles = `
  .config-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  .config-switch input:checked + .config-slider {
    background-color: var(--brand-500);
  }
  .config-slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
  .config-switch input:checked + .config-slider:before {
    transform: translateX(22px);
  }
`;

export const ConfiguracoesPage = () => {
  const { showToast } = useToast();
  const [config, setConfig] = useState<IConfiguracao>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const styleId = 'config-page-styles';
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.innerHTML = globalStyles;
      document.head.appendChild(styleEl);
    }
  }, []);

  useEffect(() => {
    const carregarConfiguracoes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getAdminConfig();
        setConfig(response.data);
      } catch {
        setError('Falha ao carregar configuracoes. A API pode estar offline.');
      } finally {
        setIsLoading(false);
      }
    };

    carregarConfiguracoes();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setConfig((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await updateAdminConfig({
        ...config,
        afiliado_valor_premio: parseFloat(config.afiliado_valor_premio) || 0,
      });
      setConfig(response.data);
      showToast('Configuracoes salvas com sucesso.', 'success');
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, 'Falha ao salvar configuracoes.');
      setError(message);
      showToast(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getValorLabel = () => {
    if (config.afiliado_tipo_premio === 'cashback_pendente') return 'Valor do bonus (%)';
    if (config.afiliado_tipo_premio === 'giftcard_imediato') return 'Valor do gift card (R$)';
    return 'Valor do premio';
  };

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Carregando configuracoes...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Configuracoes do Sistema</h1>
          <p style={styles.subtitle}>Gerencie regras do bot e afiliados</p>
        </div>
      </div>

      {error && (
        <div style={styles.alertError}>
          <span style={styles.alertIcon}>!</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.formCard}>
        <h2 style={styles.formSectionTitle}>Programa de Afiliados</h2>

        <div style={styles.checkboxGroup}>
          <label htmlFor="afiliado_ativo" style={styles.switchLabel}>
            Ativar sistema de afiliados
          </label>
          <div className="config-switch" style={styles.switch}>
            <input
              type="checkbox"
              id="afiliado_ativo"
              name="afiliado_ativo"
              checked={config.afiliado_ativo}
              onChange={handleChange}
            />
            <span className="config-slider" style={styles.slider} />
          </div>
        </div>

        <hr style={styles.hr} />

        {config.afiliado_ativo && (
          <div style={styles.optionsGrid}>
            <div style={styles.inputGroup}>
              <label htmlFor="afiliado_gatilho" style={styles.label}>
                Gatilho do premio
              </label>
              <select
                id="afiliado_gatilho"
                name="afiliado_gatilho"
                value={config.afiliado_gatilho}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="primeira_recarga">Na primeira recarga paga</option>
                <option value="primeira_compra">Na primeira compra realizada</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="afiliado_tipo_premio" style={styles.label}>
                Tipo de premio
              </label>
              <select
                id="afiliado_tipo_premio"
                name="afiliado_tipo_premio"
                value={config.afiliado_tipo_premio}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="cashback_pendente">Bonus % na proxima recarga</option>
                <option value="giftcard_imediato">Gerar gift card (valor fixo)</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="afiliado_valor_premio" style={styles.label}>
                {getValorLabel()}
              </label>
              <input
                type="number"
                id="afiliado_valor_premio"
                step="0.01"
                min="0"
                name="afiliado_valor_premio"
                value={config.afiliado_valor_premio}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
          </div>
        )}

        <div style={styles.formActions}>
          <button type="submit" style={styles.submitButton} disabled={isSaving || isLoading}>
            {isSaving ? 'Salvando...' : 'Salvar configuracoes'}
          </button>
        </div>
      </form>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1000px', margin: '0 auto' },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '16px',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid var(--border-subtle)',
    borderTop: '4px solid var(--brand-500)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: { fontSize: '16px', color: 'var(--text-secondary)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' },
  title: { margin: '0 0 4px 0', fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' },
  subtitle: { margin: 0, fontSize: '15px', color: 'var(--text-secondary)' },
  alertError: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#991b1b',
    marginBottom: '24px',
  },
  alertIcon: { fontSize: '18px' },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px 32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  formSectionTitle: {
    margin: '0 0 24px 0',
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--border-subtle)',
  },
  checkboxGroup: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' },
  switchLabel: { fontSize: '16px', fontWeight: 600, color: '#374151', cursor: 'pointer' },
  hr: { border: 'none', height: '1px', backgroundColor: 'var(--border-subtle)', margin: '16px 0' },
  optionsGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '24px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: 600, color: '#374151' },
  input: {
    padding: '12px 16px',
    fontSize: '15px',
    border: '2px solid var(--border-subtle)',
    borderRadius: '8px',
    width: '100%',
    fontFamily: 'inherit',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    paddingTop: '24px',
    marginTop: '24px',
    borderTop: '1px solid var(--border-subtle)',
  },
  submitButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 600,
    background: 'linear-gradient(135deg, var(--brand-500) 0%, var(--brand-600) 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  switch: {
    position: 'relative',
    display: 'inline-block',
    width: '50px',
    height: '28px',
  },
  slider: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ccc',
    transition: '.4s',
    borderRadius: '28px',
  },
};


