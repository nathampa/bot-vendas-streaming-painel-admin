import { useState, useEffect } from 'react';
import { getAdminConfig, updateAdminConfig } from '../services/apiClient';
import type { IConfiguracao } from '../types/api.types';

// Um estado inicial "vazio" para evitar erros antes do carregamento
const initialState: IConfiguracao = {
  id: '',
  afiliado_ativo: false,
  afiliado_gatilho: 'primeira_recarga',
  afiliado_tipo_premio: 'cashback_pendente',
  afiliado_valor_premio: '0',
};

export const ConfiguracoesPage = () => {
  const [config, setConfig] = useState<IConfiguracao>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarConfiguracoes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAdminConfig();
      setConfig(response.data);
    } catch (err) {
      console.error("Erro ao buscar configurações:", err);
      setError("Falha ao carregar configurações. A API pode estar offline.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setConfig(prev => ({ ...prev, [name]: checked }));
    } else {
      setConfig(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    // Prepara os dados para enviar (garante que o valor é um número)
    const dataToSave = {
      ...config,
      // Converte a string (ex: "50.00") para um número
      afiliado_valor_premio: parseFloat(config.afiliado_valor_premio) || 0,
    };

    try {
      const response = await updateAdminConfig(dataToSave);
      // Atualiza o estado com os dados salvos (importante se a API modificar algo)
      setConfig(response.data);
      alert("✅ Configurações salvas com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar configurações:", err);
      const errorMsg = err.response?.data?.detail || "Falha ao salvar.";
      setError(`Erro: ${errorMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getValorLabel = () => {
    if (config.afiliado_tipo_premio === 'cashback_pendente') {
      return 'Valor do Bônus (%)';
    }
    if (config.afiliado_tipo_premio === 'giftcard_imediato') {
      return 'Valor do Gift Card (R$)';
    }
    return 'Valor do Prêmio';
  };

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>⚙️ Configurações do Sistema</h1>
          <p style={styles.subtitle}>Gerencie as regras do bot e de afiliados</p>
        </div>
      </div>
      
      {error && (
        <div style={styles.alertError}>
          <span style={styles.alertIcon}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Formulário de Configurações */}
      <form onSubmit={handleSubmit} style={styles.formCard}>
        <h2 style={styles.formSectionTitle}>👥 Programa de Afiliados</h2>
        
        {/* Ativar/Desativar */}
        <div style={styles.checkboxGroup}>
          <label htmlFor="afiliado_ativo" style={styles.switchLabel}>
            Ativar Sistema de Afiliados
          </label>
          <label style={styles.switch}>
            <input
              type="checkbox"
              id="afiliado_ativo"
              name="afiliado_ativo"
              checked={config.afiliado_ativo}
              onChange={handleChange}
              style={{ opacity: 0, width: 0, height: 0 }} // Input real fica escondido
            />
            <span style={styles.slider}></span>
          </label>
        </div>

        {/* Divisor */}
        <hr style={styles.hr} />

        {/* Opções (só aparecem se o sistema estiver ativo) */}
        {config.afiliado_ativo && (
          <div style={styles.optionsGrid}>
            {/* 1. Gatilho (Trigger) */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Gatilho do Prêmio</label>
              <select
                name="afiliado_gatilho"
                value={config.afiliado_gatilho}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="primeira_recarga">Na 1ª Recarga Paga</option>
                <option value="primeira_compra">Na 1ª Compra Realizada</option>
              </select>
              <small style={styles.inputHint}>
                Quando o indicador deve ganhar o prêmio? (Lembre-se da sua regra de valor mínimo)
              </small>
            </div>
            
            {/* 2. Tipo de Prêmio */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Tipo de Prêmio</label>
              <select
                name="afiliado_tipo_premio"
                value={config.afiliado_tipo_premio}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="cashback_pendente">Bônus % na Próxima Recarga</option>
                <option value="giftcard_imediato">Gerar Gift Card (Valor Fixo)</option>
              </select>
              <small style={styles.inputHint}>
                O que o indicador irá ganhar?
              </small>
            </div>
            
            {/* 3. Valor do Prêmio */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>{getValorLabel()}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="afiliado_valor_premio"
                value={config.afiliado_valor_premio}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder={config.afiliado_tipo_premio === 'cashback_pendente' ? 'Ex: 50 (para 50%)' : 'Ex: 5.00 (para R$ 5,00)'}
              />
              <small style={styles.inputHint}>
                {config.afiliado_tipo_premio === 'cashback_pendente' 
                  ? 'Digite a porcentagem (ex: 50 para 50%)' 
                  : 'Digite o valor em R$ (ex: 5.50)'}
              </small>
            </div>
          </div>
        )}

        {/* Ações */}
        <div style={styles.formActions}>
          <button type="submit" style={styles.submitButton} disabled={isSaving || isLoading}>
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Estilos
const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1000px', margin: '0 auto' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' },
  spinner: { width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { fontSize: '16px', color: '#6b7280' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' },
  title: { margin: '0 0 4px 0', fontSize: '28px', fontWeight: 700, color: '#1a1d29' },
  subtitle: { margin: 0, fontSize: '15px', color: '#6b7280' },
  alertError: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', marginBottom: '24px' },
  alertIcon: { fontSize: '18px' },
  formCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px 32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  formSectionTitle: { margin: '0 0 24px 0', fontSize: '20px', fontWeight: 700, color: '#1a1d29', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' },
  checkboxGroup: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' },
  switchLabel: { fontSize: '16px', fontWeight: 600, color: '#374151', cursor: 'pointer' },
  hr: { border: 'none', height: '1px', backgroundColor: '#e5e7eb', margin: '16px 0' },
  optionsGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '24px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: 600, color: '#374151' },
  input: { padding: '12px 16px', fontSize: '15px', border: '2px solid #e5e7eb', borderRadius: '8px', outline: 'none', width: '100%', fontFamily: 'inherit' },
  inputHint: { fontSize: '12px', color: '#6b7280', fontStyle: 'italic' },
  formActions: { display: 'flex', justifyContent: 'flex-end', paddingTop: '24px', marginTop: '24px', borderTop: '1px solid #e5e7eb' },
  submitButton: { padding: '12px 24px', fontSize: '14px', fontWeight: 600, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  
  // --- ESTILOS CORRIGIDOS DO SWITCH ---
  // Apenas os estilos dos *elementos* React, não os pseudo-seletores
  switch: { 
    position: 'relative', 
    display: 'inline-block', 
    width: '50px', 
    height: '28px' 
  },
  slider: {
    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#ccc', transition: '.4s', borderRadius: '28px'
  },
  // As chaves 'switch input', 'slider:before', etc., foram REMOVIDAS.
  // Elas estão no 'globalStyles' abaixo.
  // --- FIM DA CORREÇÃO ---
};

// CSS puro para os seletores :before e :checked
// Esta parte continua igual e é necessária.
const globalStyles = `
  /* Esconde o input checkbox original */
  .${styles.switch} input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  /* Cor do slider quando está checado */
  .${styles.switch} input:checked + span {
    background-color: #667eea;
  }
  
  /* Posição da bolinha :before */
  .${styles.slider}:before {
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
  
  /* Animação da bolinha quando checado */
  .${styles.switch} input:checked + span:before {
    transform: translateX(22px);
  }
`;

// Injeta os estilos globais (necessário para pseudo-elementos como :before)
(function() {
  // Evita adicionar o <style> múltiplas vezes
  const styleId = 'config-page-styles';
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.innerHTML = globalStyles;
    document.head.appendChild(styleEl);
  }
})();