import { useState, useEffect } from 'react';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import AlternateEmailOutlinedIcon from '@mui/icons-material/AlternateEmailOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import { getAdminPedidos, getPedidoDetalhes, entregarPedidoManual } from '../services/apiClient';
import type { IPedidoAdminList, IPedidoAdminDetails } from '../types/api.types';
import { useToast } from '../contexts/ToastContext';
import { getApiErrorMessage } from '../utils/errors';
import { MetricCard, PageHeader } from '../components/UI';

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
      showToast(`Não há ${label} para copiar.`, 'warning');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copiado com sucesso.`, 'success');
    } catch {
      showToast(`Falha ao copiar ${label}.`, 'error');
    }
  };

  // Novas funções para o fluxo de entrega
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
      // Chama a nova função da API
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
  
  // Nova função para badge de status
  const getStatusBadge = (status: 'ENTREGUE' | 'PENDENTE') => {
    if (status === 'PENDENTE') {
      return <span style={{...styles.badge, ...styles.badgeWarning}}>Pendente</span>;
    }
    return <span style={{...styles.badge, ...styles.badgeSuccess}}>Entregue</span>;
  };

  const pedidosPendentes = pedidos.filter((pedido) => pedido.status_entrega === 'PENDENTE').length;
  const pedidosEntregues = pedidos.filter((pedido) => pedido.status_entrega === 'ENTREGUE').length;

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
      <PageHeader
        title="Pedidos"
        subtitle="Historico de todas as vendas realizadas."
        icon={<ReceiptLongOutlinedIcon fontSize="small" />}
      />

      <div style={styles.statsGrid}>
        <MetricCard label="Total" value={pedidos.length} icon={<ReceiptLongOutlinedIcon fontSize="small" />} tone="info" />
        <MetricCard label="Pendentes" value={pedidosPendentes} icon={<PendingActionsOutlinedIcon fontSize="small" />} tone="warning" />
        <MetricCard label="Entregues" value={pedidosEntregues} icon={<CheckCircleOutlineOutlinedIcon fontSize="small" />} tone="success" />
      </div>
      
      {/* Error Alert */}
      {error && (
        // ... (bloco error, sem alteração) ...
        <div style={styles.alert}>
          <span style={styles.alertIcon}><ErrorOutlineOutlinedIcon sx={{ fontSize: 18 }} /></span>
          <span>{error}</span>
        </div>
      )}

      {/* Tabela de Pedidos */}
      <div style={styles.tableContainer}>
        {pedidos.length === 0 ? (
          // ... (bloco emptyState, sem alteração) ...
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}><ReceiptLongOutlinedIcon sx={{ fontSize: 52 }} /></span>
            <h3 style={styles.emptyTitle}>Nenhum pedido encontrado</h3>
            <p style={styles.emptyText}>Quando as vendas começarem, elas aparecerão aqui.</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Data</th>
                <th style={styles.th}>Produto</th>
                <th style={styles.th}>Usuário</th>
                <th style={styles.th}>Status</th> 
                <th style={styles.th}>Entrega Info</th>
                <th style={styles.th}>Valor</th>
                <th style={styles.th}>Ações</th>
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
                        <LocalShippingOutlinedIcon sx={{ fontSize: 16 }} /> Entregar
                      </button>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => handleVerDetalhes(pedido.id)}
                        style={styles.detailsButton}
                      >
                        <VisibilityOutlinedIcon sx={{ fontSize: 16 }} /> Ver detalhes
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
              <h3 style={styles.modalTitle}>Detalhes do pedido</h3>
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
              // ... (bloco loading, sem alteração) ...
              <div style={styles.loadingContainer}>
                <div style={styles.spinner} />
                <p style={styles.loadingText}>Carregando conta...</p>
              </div>
            ) : selectedPedido ? (
              <>
                <div style={styles.modalBody}>
                  {/* Informações do Pedido */}
                  <div style={styles.infoGrid}>
                    {/* ... (info boxes, sem alteração) ... */}
                    <div style={styles.infoBox}>
                      <span style={styles.infoLabel}>Produto</span>
                      <span style={styles.infoValue}>{selectedPedido.produto_nome}</span>
                    </div>
                    <div style={styles.infoBox}>
                      <span style={styles.infoLabel}>Valor Pago</span>
                      <span style={{...styles.infoValue, color: '#10b981'}}>R$ {selectedPedido.valor_pago}</span>
                    </div>
                    <div style={styles.infoBox}>
                      <span style={styles.infoLabel}>Usuário</span>
                      <span style={styles.infoValue}>{selectedPedido.usuario_nome_completo}</span>
                    </div>
                    <div style={styles.infoBox}>
                      <span style={styles.infoLabel}>Data</span>
                      <span style={styles.infoValue}>{formatarData(selectedPedido.criado_em)}</span>
                    </div>
                  </div>

                  {/* --- LÓGICA IF/ELSE ADICIONADA AQUI --- */}
                  
                  {selectedPedido.conta ? (
                    // 1. Se HÁ uma conta (entrega automática)
                    <div style={styles.contaCard}>
                      <h4 style={styles.contaTitle}><KeyOutlinedIcon sx={{ fontSize: 16, verticalAlign: 'text-bottom', marginRight: '6px' }} />Credenciais entregues</h4>
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
                    // 2. Se NÃO HÁ conta (entrega manual)
                    <div style={styles.contaCard}>
                      <h4 style={styles.contaTitle}><AlternateEmailOutlinedIcon sx={{ fontSize: 16, verticalAlign: 'text-bottom', marginRight: '6px' }} />Entrega manual</h4>
                      <div style={styles.contaRow}>
                        <span style={styles.contaLabel}>E-mail do cliente (copie e envie o convite):</span>
                        <button
                          type="button"
                          style={styles.copyBox}
                          onClick={() => copyToClipboard(selectedPedido.email_cliente || '', 'email')}
                          aria-label="Copiar e-mail do cliente"
                        >
                          <span style={styles.contaValue}>{selectedPedido.email_cliente}</span>
                          <span style={styles.copyButton}>Copiar</span>
                        </button>
                      </div>
                      {selectedPedido.conta_mae && (
                        <>
                          <div style={styles.contaRow}>
                            <span style={styles.contaLabel}>Conta mãe atribuída:</span>
                            <button
                              type="button"
                              style={styles.copyBox}
                              onClick={() => copyToClipboard(selectedPedido.conta_mae!.login, 'login da conta mãe')}
                              aria-label="Copiar login da conta mãe"
                            >
                              <span style={styles.contaValue}>{selectedPedido.conta_mae.login}</span>
                              <span style={styles.copyButton}>Copiar</span>
                            </button>
                          </div>
                          <div style={styles.contaRow}>
                            <span style={styles.contaLabel}>Expiração da conta mãe:</span>
                            <span style={styles.contaValue}>{formatarDataCurta(selectedPedido.conta_mae.data_expiracao)}</span>
                          </div>
                        </>
                      )}
                      <div style={styles.manualInfo}>
                        <span style={styles.manualInfoIcon}><InfoOutlinedIcon sx={{ fontSize: 18 }} /></span>
                        <span>Este pedido é de entrega manual. Use o e-mail acima para enviar o convite da plataforma (ex.: YouTube, Canva).</span>
                      </div>
                    </div>
                  )}
                  {/* --- FIM DA LÓGICA IF/ELSE --- */}
                  
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
                <h3 style={styles.modalTitle}>Realizar entrega manual</h3>
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
                  Você está entregando o pedido: <strong>{entregaModalPedido.produto_nome}</strong><br/>
                  Para o usuário: <strong>{entregaModalPedido.usuario_nome_completo}</strong>
                </p>
                
                <div style={styles.inputGroup}>
                  <label htmlFor="pedido-entrega-login" style={styles.label}>
                    Login (e-mail)
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
                  <span style={styles.manualInfoIcon}><InfoOutlinedIcon sx={{ fontSize: 18 }} /></span>
                  <span>Ao confirmar, as credenciais acima serão enviadas para o cliente via bot.</span>
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
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
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
  detailsButton: { padding: '8px 16px', fontSize: '13px', fontWeight: 600, backgroundColor: 'var(--surface-muted)', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' },
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
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
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



