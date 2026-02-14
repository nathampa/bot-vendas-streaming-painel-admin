import { useState, useEffect } from 'react';
import { getAdminPedidos, getPedidoDetalhes, entregarPedidoManual } from '../services/apiClient';
import type { IPedidoAdminList, IPedidoAdminDetails } from '../types/api.types';
import { useToast } from '../contexts/ToastContext';
import { getApiErrorMessage } from '../utils/errors';

export const PedidosPage = () => {
  const { showToast } = useToast();
  const [pedidos, setPedidos] = useState<IPedidoAdminList[]>([]);
  const [selectedPedido, setSelectedPedido] = useState<IPedidoAdminDetails | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entregaModalPedido, setEntregaModalPedido] = useState<IPedidoAdminList | null>(null);
  const [isEntregaLoading, setIsEntregaLoading] = useState(false);
  const [entregaLogin, setEntregaLogin] = useState('');
  const [entregaSenha, setEntregaSenha] = useState('');

  const carregarPedidos = async () => {
    setIsLoadingList(true);
    try {
      const response = await getAdminPedidos();
      setPedidos(response.data);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar pedidos:", err);
      setError("Falha ao carregar pedidos.");
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, []);

  const handleVerDetalhes = async (pedidoId: string) => {
    setIsLoadingDetails(true);
    setError(null);
    try {
      const response = await getPedidoDetalhes(pedidoId);
      setSelectedPedido(response.data);
    } catch (err: unknown) {
      console.error("Erro ao buscar detalhes:", err);
      const errorMsg = getApiErrorMessage(err, "Falha ao carregar detalhes.");
      showToast(errorMsg, 'error');
    } finally {
      setIsLoadingDetails(false);
    }
  };
  
  const formatarData = (dataIso: string) => {
    const dataUtc = dataIso.endsWith('Z') ? dataIso : dataIso + 'Z';
    return new Date(dataUtc).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
  };

  const formatarDataCurta = (dataIso: string | null) => {
    if (!dataIso) return '-';
    const dataUtc = `${dataIso}T00:00:00Z`;
    return new Date(dataUtc).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    if (!text) {
      showToast(`Nao ha ${label} para copiar.`, 'warning');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copiado com sucesso.`, 'success');
    } catch {
      showToast(`Falha ao copiar ${label}.`, 'error');
    }
  };

  // Novas funÃ§Ãµes para o fluxo de entrega
  const handleOpenEntregaModal = (pedido: IPedidoAdminList) => {
    setEntregaModalPedido(pedido);
    setEntregaLogin('');
    setEntregaSenha('');
  };

  const handleCloseEntregaModal = () => {
    if (isEntregaLoading) return; // Previne fechar durante o loading
    setEntregaModalPedido(null);
  };

  const handleSubmitEntrega = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entregaModalPedido) return;

    setIsEntregaLoading(true);
    try {
      // Chama a nova funÃ§Ã£o da API
      await entregarPedidoManual(entregaModalPedido.id, {
        login: entregaLogin,
        senha: entregaSenha,
      });

      showToast('Entrega realizada com sucesso! O cliente foi notificado.', 'success');
      handleCloseEntregaModal();
      carregarPedidos(); // Recarrega a lista para atualizar o status

    } catch (err: unknown) {
      console.error("Erro ao entregar pedido:", err);
      const errorMsg = getApiErrorMessage(err, "Falha ao realizar entrega.");
      showToast(errorMsg, 'error');
    } finally {
      setIsEntregaLoading(false);
    }
  };
  
  // Nova funÃ§Ã£o para badge de status
  const getStatusBadge = (status: 'ENTREGUE' | 'PENDENTE') => {
    if (status === 'PENDENTE') {
      return <span style={{...styles.badge, ...styles.badgeWarning}}>â³ Pendente</span>;
    }
    return <span style={{...styles.badge, ...styles.badgeSuccess}}>âœ… Entregue</span>;
  };

  if (isLoadingList) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Carregando pedidos...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>ðŸ§¾ Pedidos</h1>
          <p style={styles.subtitle}>HistÃ³rico de todas as vendas realizadas</p>
        </div>
      </div>
      
      {/* Error Alert */}
      {error && (
        // ... (bloco error, sem alteraÃ§Ã£o) ...
        <div style={styles.alert}>
          <span style={styles.alertIcon}>âš ï¸</span>
          <span>{error}</span>
        </div>
      )}

      {/* Tabela de Pedidos */}
      <div style={styles.tableContainer}>
        {pedidos.length === 0 ? (
          // ... (bloco emptyState, sem alteraÃ§Ã£o) ...
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>ðŸ§¾</span>
            <h3 style={styles.emptyTitle}>Nenhum pedido encontrado</h3>
            <p style={styles.emptyText}>Quando as vendas comeÃ§arem, elas aparecerÃ£o aqui.</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Data</th>
                <th style={styles.th}>Produto</th>
                <th style={styles.th}>UsuÃ¡rio</th>
                <th style={styles.th}>Status</th> 
                <th style={styles.th}>Entrega Info</th>
                <th style={styles.th}>Valor</th>
                <th style={styles.th}>AÃ§Ãµes</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido) => (
                <tr key={pedido.id}>
                  <td style={styles.td}>{formatarData(pedido.criado_em)}</td>
                  <td style={styles.td}>{pedido.produto_nome}</td>
                  <td style={styles.td}>
                    <div style={styles.userCell}>
                      <span>{pedido.usuario_nome_completo}</span>
                      <span style={styles.userId}>ID: {pedido.usuario_telegram_id}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    {getStatusBadge(pedido.status_entrega)}
                  </td>
                  <td style={styles.td}>
                    {pedido.email_cliente ? (
                      <span style={styles.emailText} title={pedido.email_cliente}>
                        {pedido.email_cliente}
                      </span>
                    ) : (
                      <span style={styles.noData}>N/A</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.price}>R$ {pedido.valor_pago}</span>
                  </td>
                  <td style={styles.td}>
                    {pedido.status_entrega === 'PENDENTE' ? (
                      <button 
                        type="button"
                        onClick={() => handleOpenEntregaModal(pedido)}
                        style={styles.deliverButton}
                      >
                        ðŸšš Entregar
                      </button>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => handleVerDetalhes(pedido.id)}
                        style={styles.detailsButton}
                      >
                        ðŸ‘ï¸ Ver Detalhes
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Detalhes do Pedido (MODIFICADO) */}
      {(selectedPedido || isLoadingDetails) && (
        <div style={styles.modalOverlay} onClick={() => !isLoadingDetails && setSelectedPedido(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>ðŸ§¾ Detalhes do Pedido</h3>
              <button
                type="button"
                onClick={() => setSelectedPedido(null)}
                style={styles.modalClose}
                aria-label="Fechar detalhes do pedido"
              >
                x
              </button>
            </div>
            
            {isLoadingDetails ? (
              // ... (bloco loading, sem alteraÃ§Ã£o) ...
              <div style={styles.loadingContainer}>
                <div style={styles.spinner} />
                <p style={styles.loadingText}>Carregando conta...</p>
              </div>
            ) : selectedPedido ? (
              <>
                <div style={styles.modalBody}>
                  {/* InformaÃ§Ãµes do Pedido */}
                  <div style={styles.infoGrid}>
                    {/* ... (info boxes, sem alteraÃ§Ã£o) ... */}
                    <div style={styles.infoBox}>
                      <span style={styles.infoLabel}>Produto</span>
                      <span style={styles.infoValue}>{selectedPedido.produto_nome}</span>
                    </div>
                    <div style={styles.infoBox}>
                      <span style={styles.infoLabel}>Valor Pago</span>
                      <span style={{...styles.infoValue, color: '#10b981'}}>R$ {selectedPedido.valor_pago}</span>
                    </div>
                    <div style={styles.infoBox}>
                      <span style={styles.infoLabel}>UsuÃ¡rio</span>
                      <span style={styles.infoValue}>{selectedPedido.usuario_nome_completo}</span>
                    </div>
                    <div style={styles.infoBox}>
                      <span style={styles.infoLabel}>Data</span>
                      <span style={styles.infoValue}>{formatarData(selectedPedido.criado_em)}</span>
                    </div>
                  </div>

                  {/* --- LÃ“GICA IF/ELSE ADICIONADA AQUI --- */}
                  
                  {selectedPedido.conta ? (
                    // 1. Se HÃ uma conta (entrega automÃ¡tica)
                    <div style={styles.contaCard}>
                      <h4 style={styles.contaTitle}>ðŸ” Credenciais Entregues</h4>
                      <div style={styles.contaRow}>
                        <span style={styles.contaLabel}>Login:</span>
                        <button
                          type="button"
                          style={styles.copyBox}
                          onClick={() => copyToClipboard(selectedPedido.conta!.login, 'login')}
                          aria-label="Copiar login"
                        >
                          <span style={styles.contaValue}>{selectedPedido.conta.login}</span>
                          <span style={styles.copyButton}>Copiar</span>
                        </button>
                      </div>
                      <div style={styles.contaRow}>
                        <span style={styles.contaLabel}>Senha:</span>
                        <button
                          type="button"
                          style={styles.copyBox}
                          onClick={() => copyToClipboard(selectedPedido.conta!.senha, 'senha')}
                          aria-label="Copiar senha"
                        >
                          <span style={styles.contaValue}>{selectedPedido.conta.senha}</span>
                          <span style={styles.copyButton}>Copiar</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    // 2. Se NÃƒO HÃ conta (entrega manual)
                    <div style={styles.contaCard}>
                      <h4 style={styles.contaTitle}>ðŸ“§ Entrega Manual</h4>
                      <div style={styles.contaRow}>
                        <span style={styles.contaLabel}>Email do Cliente (copie e envie o convite):</span>
                        <button
                          type="button"
                          style={styles.copyBox}
                          onClick={() => copyToClipboard(selectedPedido.email_cliente || '', 'email')}
                          aria-label="Copiar email do cliente"
                        >
                          <span style={styles.contaValue}>{selectedPedido.email_cliente}</span>
                          <span style={styles.copyButton}>Copiar</span>
                        </button>
                      </div>
                      {selectedPedido.conta_mae && (
                        <>
                          <div style={styles.contaRow}>
                            <span style={styles.contaLabel}>Conta mÃ£e atribuÃ­da:</span>
                            <button
                              type="button"
                              style={styles.copyBox}
                              onClick={() => copyToClipboard(selectedPedido.conta_mae!.login, 'login da conta mae')}
                              aria-label="Copiar login da conta mae"
                            >
                              <span style={styles.contaValue}>{selectedPedido.conta_mae.login}</span>
                              <span style={styles.copyButton}>Copiar</span>
                            </button>
                          </div>
                          <div style={styles.contaRow}>
                            <span style={styles.contaLabel}>ExpiraÃ§Ã£o da conta mÃ£e:</span>
                            <span style={styles.contaValue}>{formatarDataCurta(selectedPedido.conta_mae.data_expiracao)}</span>
                          </div>
                        </>
                      )}
                      <div style={styles.manualInfo}>
                        <span style={styles.manualInfoIcon}>â„¹ï¸</span>
                        <span>Este pedido Ã© de entrega manual. Use o email acima para enviar o convite da plataforma (ex: Youtube, Canva).</span>
                      </div>
                    </div>
                  )}
                  {/* --- FIM DA LÃ“GICA IF/ELSE --- */}
                  
                  {/* ID do Pedido */}
                  <div style={styles.idFooter}>
                    ID do Pedido: {selectedPedido.id}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Novo Modal: Entrega Manual */}
      {entregaModalPedido && (
        <div style={styles.modalOverlay} onClick={handleCloseEntregaModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <form onSubmit={handleSubmitEntrega}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>ðŸšš Realizar Entrega Manual</h3>
                <button
                  type="button"
                  onClick={handleCloseEntregaModal}
                  style={styles.modalClose}
                  aria-label="Fechar entrega manual"
                >
                  x
                </button>
              </div>
              
              <div style={styles.modalBody}>
                <p style={styles.modalText}>
                  VocÃª estÃ¡ entregando o pedido: <strong>{entregaModalPedido.produto_nome}</strong><br/>
                  Para o usuÃ¡rio: <strong>{entregaModalPedido.usuario_nome_completo}</strong>
                </p>
                
                <div style={styles.inputGroup}>
                  <label htmlFor="pedido-entrega-login" style={styles.label}>
                    Login (Email)
                  </label>
                  <input
                    id="pedido-entrega-login"
                    type="text"
                    value={entregaLogin}
                    onChange={(e) => setEntregaLogin(e.target.value)}
                    required
                    style={styles.input}
                    placeholder="email@exemplo.com"
                    disabled={isEntregaLoading}
                  />
                </div>
                
                <div style={styles.inputGroup}>
                  <label htmlFor="pedido-entrega-senha" style={styles.label}>
                    Senha
                  </label>
                  <input
                    id="pedido-entrega-senha"
                    type="text"
                    value={entregaSenha}
                    onChange={(e) => setEntregaSenha(e.target.value)}
                    required
                    style={styles.input}
                    placeholder="Digite a senha em texto"
                    disabled={isEntregaLoading}
                  />
                </div>
                
                <div style={styles.manualInfo}>
                  <span style={styles.manualInfoIcon}>â„¹ï¸</span>
                  <span>Ao confirmar, as credenciais acima serÃ£o enviadas para o cliente via bot.</span>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={handleCloseEntregaModal} style={styles.modalCancelBtn} disabled={isEntregaLoading}>
                  Cancelar
                </button>
                <button type="submit" style={styles.modalSubmitBtn} disabled={isEntregaLoading}>
                  {isEntregaLoading ? 'Enviando...' : 'Confirmar e Notificar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Adicionei estilos para 'emailText', 'noData', 'manualInfo', 'manualInfoIcon'
const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1400px', margin: '0 auto' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' },
  spinner: { width: '48px', height: '48px', border: '4px solid var(--border-subtle)', borderTop: '4px solid var(--brand-500)', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { fontSize: '16px', color: 'var(--text-secondary)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' },
  title: { margin: '0 0 4px 0', fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' },
  subtitle: { margin: 0, fontSize: '15px', color: 'var(--text-secondary)' },
  alert: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', marginBottom: '24px' },
  alertIcon: { fontSize: '18px' },
  tableContainer: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'auto' }, // overflow: 'auto'
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '800px' }, // minWidth
  th: { padding: '14px 18px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: 'var(--text-secondary)', backgroundColor: 'var(--surface-soft)', borderBottom: '2px solid var(--border-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  td: { padding: '16px 18px', borderBottom: '1px solid var(--surface-muted)', color: 'var(--text-primary)', fontSize: '14px', whiteSpace: 'nowrap' }, // whiteSpace
  userCell: { display: 'flex', flexDirection: 'column', gap: '2px', whiteSpace: 'normal' }, // whiteSpace
  userId: { fontSize: '12px', color: 'var(--text-secondary)' },
  price: { fontSize: '14px', fontWeight: 600, color: '#10b981' },
  detailsButton: { padding: '8px 16px', fontSize: '13px', fontWeight: 600, backgroundColor: 'var(--surface-muted)', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '16px' },
  emptyIcon: { fontSize: '64px', opacity: 0.5 },
  emptyTitle: { margin: 0, fontSize: '20px', color: 'var(--text-primary)' },
  emptyText: { margin: 0, fontSize: '14px', color: 'var(--text-secondary)' },
  
  // --- NOVOS ESTILOS ---
  badge: { padding: '4px 10px', fontSize: '11px', fontWeight: 600, borderRadius: '6px' },
  badgeSuccess: { backgroundColor: '#d1fae5', color: '#065f46' },
  badgeWarning: { backgroundColor: '#fef3c7', color: '#92400e' },
  deliverButton: { 
    padding: '8px 16px', 
    fontSize: '13px', 
    fontWeight: 600, 
    backgroundColor: 'var(--brand-500)', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '8px', 
    cursor: 'pointer' 
  },
  emailText: {
    fontFamily: 'monospace',
    fontSize: '13px',
    backgroundColor: 'var(--surface-muted)',
    padding: '4px 8px',
    borderRadius: '6px',
    color: '#374151',
  },
  noData: {
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  manualInfo: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderRadius: '8px',
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    fontSize: '13px',
    lineHeight: 1.5,
  },
  manualInfoIcon: {
    fontSize: '18px',
    flexShrink: 0,
  },
  inputGroup: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '8px',
    marginBottom: '16px',
  },
  label: { 
    fontSize: '14px', 
    fontWeight: 600, 
    color: '#374151' 
  },
  input: { 
    padding: '12px 16px', 
    fontSize: '15px', 
    border: '2px solid var(--border-subtle)', 
    borderRadius: '8px', 
    width: '100%', 
    fontFamily: 'inherit' 
  },
  modalText: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    color: '#374151',
    lineHeight: 1.5,
  },
  modalFooter: { 
    padding: '24px', 
    borderTop: '1px solid var(--border-subtle)', 
    display: 'flex', 
    gap: '12px', 
    justifyContent: 'flex-end',
    backgroundColor: 'var(--surface-soft)',
    borderBottomLeftRadius: '16px',
    borderBottomRightRadius: '16px',
  },
  modalCancelBtn: { 
    padding: '12px 24px', 
    fontSize: '14px', 
    fontWeight: 600, 
    backgroundColor: '#fff', 
    color: 'var(--text-primary)', 
    border: '1px solid var(--border-default)',
    borderRadius: '8px', 
    cursor: 'pointer' 
  },
  modalSubmitBtn: { 
    padding: '12px 24px', 
    fontSize: '14px', 
    fontWeight: 600, 
    backgroundColor: '#10b981', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '8px', 
    cursor: 'pointer' 
  },
  // --- FIM DOS NOVOS ESTILOS ---

  // Estilos do Modal
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' },
  modal: { backgroundColor: '#fff', borderRadius: '16px', maxWidth: '550px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', minHeight: '300px' },
  modalHeader: { padding: '24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { margin: 0, fontSize: '20px', fontWeight: 700 },
  modalClose: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', padding: '4px', color: 'var(--text-secondary)' },
  modalBody: { padding: '24px' },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' },
  infoBox: { padding: '12px 16px', backgroundColor: 'var(--surface-soft)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' },
  infoLabel: { fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 },
  infoValue: { fontSize: '15px', color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  contaCard: { padding: '20px', backgroundColor: 'var(--surface-soft)', borderRadius: '8px', border: '1px solid var(--border-subtle)' },
  contaTitle: { margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' },
  contaRow: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' },
  contaLabel: { fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 },
  contaValue: { fontSize: '16px', color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'monospace' },
  copyBox: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid var(--border-default)', cursor: 'pointer', transition: 'all 0.2s ease', width: '100%', fontFamily: 'inherit', fontSize: 'inherit', textAlign: 'left' },
  copyButton: { fontSize: '12px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.4px' },
  idFooter: { marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' },
};



