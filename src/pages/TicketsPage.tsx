import { useCallback, useEffect, useState } from 'react';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import ArrowForwardIosOutlinedIcon from '@mui/icons-material/ArrowForwardIosOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import type { CSSProperties } from 'react';
import { getAdminTickets, getTicketDetalhes, resolverTicket } from '../services/apiClient';
import type { ITicketDetalhes, ITicketLista } from '../types/api.types';
import { useToast } from '../contexts/ToastContext';
import { getApiErrorMessage } from '../utils/errors';
import { MetricCard, PageHeader, PanelCard } from '../components/UI';

type TicketStatus = 'ABERTO' | 'EM_ANALISE' | 'RESOLVIDO' | 'FECHADO' | null;
type ResolverAction = 'TROCAR_CONTA' | 'REEMBOLSAR_CARTEIRA' | 'FECHAR_MANUALMENTE';

type StatusMeta = {
  label: string;
  color: string;
  bg: string;
};

const statusMap: Record<'ABERTO' | 'EM_ANALISE' | 'RESOLVIDO' | 'FECHADO', StatusMeta> = {
  ABERTO: { label: 'Aberto', color: '#92400e', bg: '#fef3c7' },
  EM_ANALISE: { label: 'Em análise', color: '#1e40af', bg: '#dbeafe' },
  RESOLVIDO: { label: 'Resolvido', color: '#065f46', bg: '#d1fae5' },
  FECHADO: { label: 'Fechado', color: '#475569', bg: '#e2e8f0' },
};

const motivoLabel: Record<string, string> = {
  LOGIN_INVALIDO: 'Login inválido',
  SEM_ASSINATURA: 'Sem assinatura',
  CONTA_CAIU: 'Conta caiu',
  OUTRO: 'Outro',
};

const responsiveStyles = `
  @media (max-width: 1100px) {
    .tickets-main-grid {
      grid-template-columns: 1fr !important;
    }

    .tickets-panel {
      min-height: unset !important;
    }
  }

  @media (max-width: 768px) {
    .tickets-container {
      padding-bottom: 24px;
    }

    .tickets-filter-wrap {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
    }

    .tickets-filters {
      min-width: max-content;
      flex-wrap: nowrap !important;
    }

    .tickets-details-content {
      padding: 18px !important;
    }

    .tickets-info-grid {
      grid-template-columns: 1fr !important;
    }

    .tickets-modal {
      max-height: 90vh;
      overflow: auto;
    }

    .tickets-modal-footer {
      flex-direction: column-reverse;
    }

    .tickets-modal-footer button {
      width: 100%;
    }
  }
`;

export const TicketsPage = () => {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<ITicketLista[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<ITicketDetalhes | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TicketStatus>('ABERTO');
  const [resolverAction, setResolverAction] = useState<ResolverAction | null>(null);
  const [resolverMensagem, setResolverMensagem] = useState('');

  const carregarTickets = useCallback(async (status: TicketStatus) => {
    setIsLoadingList(true);
    setSelectedTicket(null);
    try {
      const response = await getAdminTickets(status);
      setTickets(response.data);
    } catch (err) {
      console.error('Erro ao buscar tickets:', err);
      showToast('Falha ao carregar tickets.', 'error');
    } finally {
      setIsLoadingList(false);
    }
  }, [showToast]);

  useEffect(() => {
    carregarTickets(filterStatus);
  }, [filterStatus, carregarTickets]);

  const handleVerDetalhes = async (ticketId: string) => {
    setIsLoadingDetails(true);
    try {
      const response = await getTicketDetalhes(ticketId);
      setSelectedTicket(response.data);
    } catch (err) {
      console.error('Erro ao buscar detalhes:', err);
      showToast('Falha ao carregar detalhes.', 'error');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleOpenResolverDialog = (acao: ResolverAction) => {
    setResolverAction(acao);
    setResolverMensagem('');
  };

  const handleCloseResolverDialog = () => {
    if (isLoadingDetails) return;
    setResolverAction(null);
    setResolverMensagem('');
  };

  const handleResolver = async () => {
    if (!selectedTicket || !resolverAction) return;

    const mensagem =
      resolverAction === 'FECHAR_MANUALMENTE'
        ? (resolverMensagem.trim() ? resolverMensagem.trim() : null)
        : undefined;

    setIsLoadingDetails(true);
    try {
      await resolverTicket(selectedTicket.id, resolverAction, mensagem);
      showToast('Solicitação enviada. Processando ticket.', 'success');
      handleCloseResolverDialog();
      setSelectedTicket(null);
      setFilterStatus('EM_ANALISE');
      carregarTickets('EM_ANALISE');
    } catch (err: unknown) {
      console.error('Erro ao resolver ticket:', err);
      const errorMsg = getApiErrorMessage(err, 'Falha ao enviar solicitação.');
      showToast(errorMsg, 'error');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const getStatusBadge = (status: string) => statusMap[status as keyof typeof statusMap] ?? statusMap.ABERTO;
  const getMotivoLabel = (motivo: string) => motivoLabel[motivo] ?? motivo;

  const contaProblematica = selectedTicket?.conta_problematica ?? null;
  const resolverDialogTitle =
    resolverAction === 'TROCAR_CONTA'
      ? 'Confirmar troca de conta'
      : resolverAction === 'REEMBOLSAR_CARTEIRA'
        ? 'Confirmar reembolso'
        : 'Fechar ticket manualmente';
  const resolverDialogDescription =
    resolverAction === 'TROCAR_CONTA'
      ? 'Uma nova conta será alocada para o usuário.'
      : resolverAction === 'REEMBOLSAR_CARTEIRA'
        ? 'O valor será devolvido para a carteira do usuário.'
        : 'O ticket será fechado manualmente com mensagem opcional.';

  const abertosCount = tickets.filter((t) => t.status === 'ABERTO').length;
  const emAnaliseCount = tickets.filter((t) => t.status === 'EM_ANALISE').length;
  const resolvidosCount = tickets.filter((t) => t.status === 'RESOLVIDO').length;

  return (
    <div className="tickets-container" style={styles.container}>
      <style>{responsiveStyles}</style>

      <PageHeader
        title="Tickets de Suporte"
        subtitle="Gerencie e resolva tickets com fluxo padronizado."
        icon={<SupportAgentOutlinedIcon fontSize="small" />}
      />

      <div style={styles.statsGrid}>
        <MetricCard label="Abertos" value={abertosCount} icon={<MarkEmailReadOutlinedIcon fontSize="small" />} tone="warning" />
        <MetricCard label="Em análise" value={emAnaliseCount} icon={<SearchOutlinedIcon fontSize="small" />} tone="info" />
        <MetricCard label="Resolvidos" value={resolvidosCount} icon={<CheckCircleOutlineOutlinedIcon fontSize="small" />} tone="success" />
      </div>

      <div className="tickets-main-grid" style={styles.mainContent}>
        <div className="tickets-panel" style={styles.leftPanel}>
          <PanelCard style={styles.panelCard}>
            <div className="tickets-filter-wrap" style={styles.filtersWrap}>
              <div className="tickets-filters" style={styles.filtersContainer}>
                <button
                  type="button"
                  onClick={() => setFilterStatus('ABERTO')}
                  style={{ ...styles.filterButton, ...(filterStatus === 'ABERTO' ? styles.filterButtonActive : {}) }}
                >
                  Abertos
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('EM_ANALISE')}
                  style={{ ...styles.filterButton, ...(filterStatus === 'EM_ANALISE' ? styles.filterButtonActive : {}) }}
                >
                  Em análise
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('RESOLVIDO')}
                  style={{ ...styles.filterButton, ...(filterStatus === 'RESOLVIDO' ? styles.filterButtonActive : {}) }}
                >
                  Resolvidos
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus(null)}
                  style={{ ...styles.filterButton, ...(filterStatus === null ? styles.filterButtonActive : {}) }}
                >
                  Todos
                </button>
              </div>
            </div>

            {isLoadingList ? (
              <div style={styles.loadingSmall}>
                <div style={styles.spinnerSmall} />
                <p style={styles.loadingText}>Carregando tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div style={styles.emptyState}>
                <InboxOutlinedIcon sx={{ fontSize: 56, color: 'var(--text-muted)' }} />
                <p style={styles.emptyText}>Nenhum ticket encontrado para este filtro.</p>
              </div>
            ) : (
              <div style={styles.ticketsList}>
                {tickets.map((ticket) => {
                  const badge = getStatusBadge(ticket.status);
                  const isSelected = selectedTicket?.id === ticket.id;

                  return (
                    <div
                      key={ticket.id}
                      onClick={() => handleVerDetalhes(ticket.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleVerDetalhes(ticket.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Abrir detalhes do ticket ${ticket.id}`}
                      style={{ ...styles.ticketItem, ...(isSelected ? styles.ticketItemActive : {}) }}
                    >
                      <div style={styles.ticketItemHeader}>
                        <span style={{ ...styles.ticketBadge, backgroundColor: badge.bg, color: badge.color }}>{badge.label}</span>
                        <span style={styles.ticketDate}>{new Date(ticket.criado_em).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <p style={styles.ticketMotivo}>{getMotivoLabel(ticket.motivo)}</p>
                      <div style={styles.ticketFooterRow}>
                        <span style={styles.ticketId}>ID: {ticket.id.substring(0, 8)}...</span>
                        <ArrowForwardIosOutlinedIcon sx={{ fontSize: 14, color: 'var(--text-muted)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </PanelCard>
        </div>

        <div className="tickets-panel" style={styles.rightPanel}>
          <PanelCard style={styles.panelCard}>
            {isLoadingDetails ? (
              <div style={styles.loadingSmall}>
                <div style={styles.spinnerSmall} />
                <p style={styles.loadingText}>Carregando detalhes...</p>
              </div>
            ) : !selectedTicket ? (
              <div style={styles.emptyState}>
                <SearchOutlinedIcon sx={{ fontSize: 56, color: 'var(--text-muted)' }} />
                <p style={styles.emptyText}>Selecione um ticket para ver detalhes e ações.</p>
              </div>
            ) : (
              <div className="tickets-details-content" style={styles.detailsContent}>
                <div style={styles.detailsHeader}>
                  <h2 style={styles.detailsTitle}>Detalhes do ticket</h2>
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    style={styles.closeButton}
                    aria-label="Fechar painel de detalhes"
                  >
                    <CloseOutlinedIcon fontSize="small" />
                  </button>
                </div>

                <div className="tickets-info-grid" style={styles.infoGrid}>
                  <div style={styles.infoCard}>
                    <span style={styles.infoLabel}>Status</span>
                    <span
                      style={{
                        ...styles.ticketBadge,
                        backgroundColor: getStatusBadge(selectedTicket.status).bg,
                        color: getStatusBadge(selectedTicket.status).color,
                      }}
                    >
                      {getStatusBadge(selectedTicket.status).label}
                    </span>
                  </div>
                  <div style={styles.infoCard}>
                    <span style={styles.infoLabel}>Usuário</span>
                    <span style={styles.infoValue}>{selectedTicket.usuario_telegram_id}</span>
                  </div>
                  <div style={styles.infoCard}>
                    <span style={styles.infoLabel}>Produto</span>
                    <span style={styles.infoValue}>{selectedTicket.produto_nome}</span>
                  </div>
                  <div style={styles.infoCard}>
                    <span style={styles.infoLabel}>Motivo</span>
                    <span style={styles.infoValue}>{getMotivoLabel(selectedTicket.motivo)}</span>
                  </div>
                </div>

                {selectedTicket.descricao_outros && (
                  <div style={styles.descricaoCard}>
                    <span style={styles.descricaoLabel}>Descrição</span>
                    <p style={styles.descricaoText}>{selectedTicket.descricao_outros}</p>
                  </div>
                )}

                {contaProblematica ? (
                  <div style={styles.contaCard}>
                    <h3 style={styles.contaTitle}>Conta problemática</h3>
                    <div style={styles.contaInfo}>
                      <div style={styles.contaRow}>
                        <span style={styles.contaLabel}>Login</span>
                        <span style={styles.contaValue}>{contaProblematica.login ?? '-'}</span>
                      </div>
                      <div style={styles.contaRow}>
                        <span style={styles.contaLabel}>Senha</span>
                        <span style={{ ...styles.contaValue, fontFamily: 'monospace' }}>{contaProblematica.senha ?? '-'}</span>
                      </div>
                      <div style={styles.contaRow}>
                        <span style={styles.contaLabel}>Slots</span>
                        <span style={styles.contaValue}>
                          {contaProblematica.slots_ocupados ?? 0} / {contaProblematica.max_slots ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={styles.contaCard}>
                    <h3 style={styles.contaTitle}>Conta não associada</h3>
                    <p style={styles.contaEmptyText}>Este pedido é de entrega manual e não possui conta vinculada.</p>
                  </div>
                )}

                {selectedTicket.status === 'ABERTO' && (
                  <div style={styles.actionsSection}>
                    <h3 style={styles.actionsTitle}>Ações de resolução</h3>
                    <div style={styles.actionsGrid}>
                      {contaProblematica && (
                        <button
                          type="button"
                          onClick={() => handleOpenResolverDialog('TROCAR_CONTA')}
                          style={{ ...styles.actionButton, ...styles.actionButtonSwap }}
                        >
                          <SwapHorizOutlinedIcon sx={{ fontSize: 18 }} />
                          <span>Trocar conta</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenResolverDialog('REEMBOLSAR_CARTEIRA')}
                        style={{ ...styles.actionButton, ...styles.actionButtonRefund }}
                      >
                        <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 18 }} />
                          <span>Reembolsar carteira</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenResolverDialog('FECHAR_MANUALMENTE')}
                        style={{ ...styles.actionButton, ...styles.actionButtonClose }}
                      >
                        <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                          <span>Fechar manualmente</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </PanelCard>
        </div>
      </div>

      {resolverAction && selectedTicket && (
        <div style={styles.modalOverlay} onClick={handleCloseResolverDialog}>
          <div className="tickets-modal" style={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{resolverDialogTitle}</h3>
              <button
                type="button"
                onClick={handleCloseResolverDialog}
                style={styles.modalClose}
                disabled={isLoadingDetails}
                aria-label="Fechar modal de resolução"
              >
                <CloseOutlinedIcon fontSize="small" />
              </button>
            </div>
            <div style={styles.modalBody}>
              <p style={styles.modalText}>{resolverDialogDescription}</p>
              {resolverAction === 'FECHAR_MANUALMENTE' && (
                <div style={styles.inputGroup}>
                  <label htmlFor="ticket-resolver-mensagem" style={styles.inputLabel}>
                    Mensagem para o usuário (opcional)
                  </label>
                  <textarea
                    id="ticket-resolver-mensagem"
                    value={resolverMensagem}
                    onChange={(e) => setResolverMensagem(e.target.value)}
                    rows={4}
                    style={styles.textarea}
                    placeholder="Ex.: Ticket fechado conforme orientação no suporte."
                  />
                </div>
              )}
            </div>
            <div className="tickets-modal-footer" style={styles.modalFooter}>
              <button type="button" onClick={handleCloseResolverDialog} style={styles.modalCancelBtn} disabled={isLoadingDetails}>
                Cancelar
              </button>
              <button type="button" onClick={handleResolver} style={styles.modalConfirmBtn} disabled={isLoadingDetails}>
                {isLoadingDetails ? 'Processando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  container: {
    maxWidth: '1600px',
    margin: '0 auto',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.45fr',
    gap: '20px',
  },
  leftPanel: {
    minHeight: '600px',
  },
  rightPanel: {
    minHeight: '600px',
  },
  panelCard: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  filtersWrap: {
    borderBottom: '1px solid var(--border-subtle)',
  },
  filtersContainer: {
    display: 'flex',
    gap: '8px',
    padding: '14px',
    flexWrap: 'wrap',
  },
  filterButton: {
    padding: '9px 14px',
    fontSize: '13px',
    fontWeight: 600,
    backgroundColor: 'var(--surface-soft)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  filterButtonActive: {
    background: 'var(--brand-gradient)',
    color: '#fff',
    borderColor: 'transparent',
  },
  ticketsList: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px',
  },
  ticketItem: {
    padding: '14px',
    marginBottom: '8px',
    borderRadius: '12px',
    backgroundColor: 'var(--surface-soft)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid transparent',
  },
  ticketItemActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    boxShadow: '0 8px 18px rgba(30, 64, 175, 0.08)',
  },
  ticketItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    gap: '12px',
  },
  ticketBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: 700,
    borderRadius: '999px',
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  ticketDate: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  ticketMotivo: {
    margin: '8px 0 10px 0',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  ticketFooterRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketId: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  loadingSmall: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '72px 20px',
    gap: '12px',
  },
  loadingText: {
    margin: 0,
    color: 'var(--text-secondary)',
  },
  spinnerSmall: {
    width: '30px',
    height: '30px',
    border: '3px solid var(--border-subtle)',
    borderTop: '3px solid var(--brand-500)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '72px 18px',
    textAlign: 'center',
  },
  emptyText: {
    margin: 0,
    color: 'var(--text-secondary)',
    fontSize: '14px',
  },
  detailsContent: {
    padding: '22px',
    overflowY: 'auto',
  },
  detailsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  detailsTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  closeButton: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    backgroundColor: 'var(--surface-soft)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-subtle)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '18px',
  },
  infoCard: {
    padding: '12px',
    backgroundColor: 'var(--surface-soft)',
    borderRadius: '10px',
    border: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  infoLabel: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  infoValue: {
    fontSize: '14px',
    color: 'var(--text-primary)',
    fontWeight: 600,
  },
  descricaoCard: {
    padding: '14px',
    backgroundColor: '#fef3c7',
    borderRadius: '10px',
    border: '1px solid #fde68a',
    marginBottom: '18px',
  },
  descricaoLabel: {
    fontSize: '12px',
    color: '#92400e',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  descricaoText: {
    margin: '8px 0 0 0',
    fontSize: '14px',
    color: '#78350f',
    lineHeight: 1.5,
  },
  contaCard: {
    padding: '16px',
    backgroundColor: 'var(--surface-soft)',
    borderRadius: '10px',
    border: '1px solid var(--border-subtle)',
    marginBottom: '18px',
  },
  contaTitle: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  contaInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  contaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '14px',
  },
  contaEmptyText: {
    margin: 0,
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  contaLabel: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  contaValue: {
    fontSize: '14px',
    color: 'var(--text-primary)',
    fontWeight: 700,
    textAlign: 'right',
  },
  actionsSection: {
    paddingTop: '18px',
    borderTop: '1px solid var(--border-subtle)',
  },
  actionsTitle: {
    margin: '0 0 14px 0',
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  actionsGrid: {
    display: 'grid',
    gap: '10px',
  },
  actionButton: {
    padding: '12px 14px',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  actionButtonSwap: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  },
  actionButtonRefund: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  },
  actionButtonClose: {
    background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(2, 6, 23, 0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '560px',
    boxShadow: 'var(--shadow-xl)',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid var(--border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  modalClose: {
    width: '32px',
    height: '32px',
    background: 'var(--surface-soft)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '10px',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: '20px 24px',
    display: 'grid',
    gap: '14px',
  },
  modalText: {
    margin: 0,
    fontSize: '14px',
    color: '#374151',
    lineHeight: 1.5,
  },
  inputGroup: {
    display: 'grid',
    gap: '8px',
  },
  inputLabel: {
    fontSize: '13px',
    color: '#374151',
    fontWeight: 600,
  },
  textarea: {
    width: '100%',
    border: '1px solid var(--border-default)',
    borderRadius: '10px',
    padding: '10px 12px',
    fontFamily: 'inherit',
    fontSize: '14px',
    resize: 'vertical',
    minHeight: '96px',
  },
  modalFooter: {
    padding: '16px 24px 20px',
    borderTop: '1px solid var(--border-subtle)',
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  modalCancelBtn: {
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 600,
    backgroundColor: '#f3f4f6',
    color: '#1f2937',
    border: '1px solid var(--border-subtle)',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  modalConfirmBtn: {
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 600,
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
};
