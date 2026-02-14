import { useState, useEffect } from 'react';
import { getAdminTickets, getTicketDetalhes, resolverTicket } from '../services/apiClient';
import type { ITicketLista, ITicketDetalhes } from '../types/api.types';
import { getApiErrorMessage } from '../utils/errors';

type TicketStatus = 'ABERTO' | 'EM_ANALISE' | 'RESOLVIDO' | 'FECHADO' | null;
type ResolverAction = 'TROCAR_CONTA' | 'REEMBOLSAR_CARTEIRA' | 'FECHAR_MANUALMENTE';

export const TicketsPage = () => {
  const [tickets, setTickets] = useState<ITicketLista[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<ITicketDetalhes | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<TicketStatus>('ABERTO');
  const [resolverAction, setResolverAction] = useState<ResolverAction | null>(null);
  const [resolverMensagem, setResolverMensagem] = useState('');

  const carregarTickets = async (status: TicketStatus) => {
    setIsLoadingList(true);
    setSelectedTicket(null);
    try {
      const response = await getAdminTickets(status);
      setTickets(response.data);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar tickets:", err);
      setError("Falha ao carregar tickets.");
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    carregarTickets(filterStatus);
  }, [filterStatus]);

  const handleVerDetalhes = async (ticketId: string) => {
    setIsLoadingDetails(true);
    setError(null);
    try {
      const response = await getTicketDetalhes(ticketId);
      setSelectedTicket(response.data);
    } catch (err) {
      console.error("Erro ao buscar detalhes:", err);
      setError("Falha ao carregar detalhes.");
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
      alert('Solicitacao enviada! Processando...');
      handleCloseResolverDialog();
      setSelectedTicket(null);
      setFilterStatus('EM_ANALISE');
      carregarTickets('EM_ANALISE');
    } catch (err: unknown) {
      console.error('Erro ao resolver ticket:', err);
      const errorMsg = getApiErrorMessage(err, 'Falha ao enviar solicitacao.');
      alert(`Erro: ${errorMsg}`);
    } finally {
      setIsLoadingDetails(false);
    }
  };
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; bg: string; label: string }> = {
      ABERTO: { color: '#f59e0b', bg: '#fef3c7', label: '🔴 Aberto' },
      EM_ANALISE: { color: '#3b82f6', bg: '#dbeafe', label: '🔵 Em Análise' },
      RESOLVIDO: { color: '#10b981', bg: '#d1fae5', label: '✅ Resolvido' },
      FECHADO: { color: '#6b7280', bg: '#f3f4f6', label: '⚫ Fechado' },
    };
    return badges[status] || badges.ABERTO;
  };

  const getMotivoLabel = (motivo: string) => {
    const motivos: Record<string, string> = {
      LOGIN_INVALIDO: '🔐 Login Inválido',
      SEM_ASSINATURA: '📭 Sem Assinatura',
      CONTA_CAIU: '💥 Conta Caiu',
      OUTRO: '❓ Outro',
    };
    return motivos[motivo] || motivo;
  };

  const contaProblematica = selectedTicket?.conta_problematica ?? null;
  const resolverDialogTitle =
    resolverAction === 'TROCAR_CONTA'
      ? 'Confirmar troca de conta'
      : resolverAction === 'REEMBOLSAR_CARTEIRA'
        ? 'Confirmar reembolso'
        : 'Fechar ticket manualmente';
  const resolverDialogDescription =
    resolverAction === 'TROCAR_CONTA'
      ? 'Uma nova conta sera alocada para o usuario.'
      : resolverAction === 'REEMBOLSAR_CARTEIRA'
        ? 'O valor sera devolvido para a carteira do usuario.'
        : 'O ticket sera fechado manualmente com mensagem opcional.';

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🎟️ Tickets de Suporte</h1>
          <p style={styles.subtitle}>Gerencie e resolva os tickets dos usuários</p>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={{...styles.statIcon, backgroundColor: '#fef3c7', color: '#92400e'}}>🔴</span>
          <div>
            <p style={styles.statLabel}>Abertos</p>
            <h3 style={styles.statValue}>{tickets.filter(t => t.status === 'ABERTO').length}</h3>
          </div>
        </div>
        <div style={styles.statCard}>
          <span style={{...styles.statIcon, backgroundColor: '#dbeafe', color: '#1e40af'}}>🔵</span>
          <div>
            <p style={styles.statLabel}>Em Análise</p>
            <h3 style={styles.statValue}>{tickets.filter(t => t.status === 'EM_ANALISE').length}</h3>
          </div>
        </div>
        <div style={styles.statCard}>
          <span style={{...styles.statIcon, backgroundColor: '#d1fae5', color: '#065f46'}}>✅</span>
          <div>
            <p style={styles.statLabel}>Resolvidos</p>
            <h3 style={styles.statValue}>{tickets.filter(t => t.status === 'RESOLVIDO').length}</h3>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Left: Tickets List */}
        <div style={styles.leftPanel}>
          <div style={styles.panelCard}>
            {/* Filters */}
            <div style={styles.filtersContainer}>
              <button
                onClick={() => setFilterStatus('ABERTO')}
                style={{...styles.filterButton, ...(filterStatus === 'ABERTO' && styles.filterButtonActive)}}
              >
                Abertos
              </button>
              <button
                onClick={() => setFilterStatus('EM_ANALISE')}
                style={{...styles.filterButton, ...(filterStatus === 'EM_ANALISE' && styles.filterButtonActive)}}
              >
                Em Análise
              </button>
              <button
                onClick={() => setFilterStatus('RESOLVIDO')}
                style={{...styles.filterButton, ...(filterStatus === 'RESOLVIDO' && styles.filterButtonActive)}}
              >
                Resolvidos
              </button>
              <button
                onClick={() => setFilterStatus(null)}
                style={{...styles.filterButton, ...(filterStatus === null && styles.filterButtonActive)}}
              >
                Todos
              </button>
            </div>

            {/* List */}
            {isLoadingList ? (
              <div style={styles.loadingSmall}>
                <div style={styles.spinnerSmall} />
                <p>Carregando tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div style={styles.emptyList}>
                <span style={{fontSize: '48px', opacity: 0.5}}>🎟️</span>
                <p style={{margin: 0, color: '#6b7280'}}>Nenhum ticket encontrado</p>
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
                      style={{
                        ...styles.ticketItem,
                        ...(isSelected && styles.ticketItemActive)
                      }}
                    >
                      <div style={styles.ticketItemHeader}>
                        <span style={{...styles.ticketBadge, backgroundColor: badge.bg, color: badge.color}}>
                          {badge.label}
                        </span>
                        <span style={styles.ticketDate}>
                          {new Date(ticket.criado_em).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p style={styles.ticketMotivo}>{getMotivoLabel(ticket.motivo)}</p>
                      <span style={styles.ticketId}>ID: {ticket.id.substring(0, 8)}...</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Ticket Details */}
        <div style={styles.rightPanel}>
          <div style={styles.panelCard}>
            {isLoadingDetails ? (
              <div style={styles.loadingSmall}>
                <div style={styles.spinnerSmall} />
                <p>Carregando detalhes...</p>
              </div>
            ) : !selectedTicket ? (
              <div style={styles.emptyDetails}>
                <span style={{fontSize: '64px', opacity: 0.3}}>👈</span>
                <h3 style={{margin: '16px 0 8px 0', color: '#1a1d29'}}>Selecione um Ticket</h3>
                <p style={{margin: 0, color: '#6b7280', fontSize: '14px'}}>
                  Clique em um ticket da lista para ver os detalhes
                </p>
              </div>
            ) : (
              <div style={styles.detailsContent}>
                {/* Header */}
                <div style={styles.detailsHeader}>
                  <h2 style={styles.detailsTitle}>Detalhes do Ticket</h2>
                  <button onClick={() => setSelectedTicket(null)} style={styles.closeButton}>
                    ✕
                  </button>
                </div>

                {/* Info Cards */}
                <div style={styles.infoGrid}>
                  <div style={styles.infoCard}>
                    <span style={styles.infoLabel}>Status</span>
                    <span style={{
                      ...styles.ticketBadge,
                      ...{backgroundColor: getStatusBadge(selectedTicket.status).bg, color: getStatusBadge(selectedTicket.status).color}
                    }}>
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

                {/* Conta Problemática */}
                {contaProblematica ? (
                  <div style={styles.contaCard}>
                    <h3 style={styles.contaTitle}>🔐 Conta Problemática</h3>
                    <div style={styles.contaInfo}>
                      <div style={styles.contaRow}>
                        <span style={styles.contaLabel}>Login:</span>
                        <span style={styles.contaValue}>{contaProblematica?.login ?? '-'}</span>
                      </div>
                      <div style={styles.contaRow}>
                        <span style={styles.contaLabel}>Senha:</span>
                        <span style={{...styles.contaValue, fontFamily: 'monospace'}}>
                          {contaProblematica?.senha ?? '-'}
                        </span>
                      </div>
                      <div style={styles.contaRow}>
                        <span style={styles.contaLabel}>Slots:</span>
                        <span style={styles.contaValue}>
                          {contaProblematica?.slots_ocupados ?? 0} / {contaProblematica?.max_slots ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={styles.contaCard}>
                    <h3 style={styles.contaTitle}>🧾 Conta Não Associada</h3>
                    <p style={styles.contaEmptyText}>
                      Este pedido é de entrega manual e não possui conta vinculada.
                    </p>
                  </div>
                )}

                {/* Actions */}
                {selectedTicket.status === 'ABERTO' && (
                  <div style={styles.actionsSection}>
                    <h3 style={styles.actionsTitle}>Ações de Resolução</h3>
                    <div style={styles.actionsGrid}>
                      {contaProblematica && (
                        <button
                          onClick={() => handleOpenResolverDialog('TROCAR_CONTA')}
                          style={{...styles.actionButton, ...styles.actionButtonSwap}}
                        >
                          🔁 Trocar Conta
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenResolverDialog('REEMBOLSAR_CARTEIRA')}
                        style={{...styles.actionButton, ...styles.actionButtonRefund}}
                      >
                        💰 Reembolsar
                      </button>
                      <button
                        onClick={() => handleOpenResolverDialog('FECHAR_MANUALMENTE')}
                        style={{...styles.actionButton, ...styles.actionButtonClose}}
                      >
                        ✓ Fechar Manual
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {resolverAction && selectedTicket && (
        <div style={styles.modalOverlay} onClick={handleCloseResolverDialog}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{resolverDialogTitle}</h3>
              <button onClick={handleCloseResolverDialog} style={styles.modalClose} disabled={isLoadingDetails}>
                X
              </button>
            </div>
            <div style={styles.modalBody}>
              <p style={styles.modalText}>{resolverDialogDescription}</p>
              {resolverAction === 'FECHAR_MANUALMENTE' && (
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Mensagem para o usuario (opcional)</label>
                  <textarea
                    value={resolverMensagem}
                    onChange={(e) => setResolverMensagem(e.target.value)}
                    rows={4}
                    style={styles.textarea}
                    placeholder="Ex: Ticket fechado conforme orientacao no suporte."
                  />
                </div>
              )}
            </div>
            <div style={styles.modalFooter}>
              <button onClick={handleCloseResolverDialog} style={styles.modalCancelBtn} disabled={isLoadingDetails}>
                Cancelar
              </button>
              <button onClick={handleResolver} style={styles.modalConfirmBtn} disabled={isLoadingDetails}>
                {isLoadingDetails ? 'Processando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1600px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    margin: '0 0 4px 0',
    fontSize: '28px',
    fontWeight: 700,
    color: '#1a1d29',
  },
  subtitle: {
    margin: 0,
    fontSize: '15px',
    color: '#6b7280',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  statIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
  },
  statLabel: {
    margin: '0 0 4px 0',
    fontSize: '13px',
    color: '#6b7280',
  },
  statValue: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#1a1d29',
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.5fr',
    gap: '24px',
  },
  leftPanel: {
    minHeight: '600px',
  },
  rightPanel: {
    minHeight: '600px',
  },
  panelCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  filtersContainer: {
    display: 'flex',
    gap: '8px',
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
    flexWrap: 'wrap',
  },
  filterButton: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 600,
    backgroundColor: '#f9fafb',
    color: '#6b7280',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  filterButtonActive: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
  },
  ticketsList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px',
  },
  ticketItem: {
    padding: '16px',
    marginBottom: '8px',
    borderRadius: '8px',
    backgroundColor: '#f9fafb',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '2px solid transparent',
  },
  ticketItemActive: {
    backgroundColor: '#ede9fe',
    borderColor: '#667eea',
  },
  ticketItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  ticketBadge: {
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: 600,
    borderRadius: '6px',
  },
  ticketDate: {
    fontSize: '12px',
    color: '#6b7280',
  },
  ticketMotivo: {
    margin: '8px 0',
    fontSize: '14px',
    fontWeight: 600,
    color: '#1a1d29',
  },
  ticketId: {
    fontSize: '11px',
    color: '#9ca3af',
  },
  loadingSmall: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    gap: '12px',
  },
  spinnerSmall: {
    width: '32px',
    height: '32px',
    border: '3px solid #e5e7eb',
    borderTop: '3px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  emptyList: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    gap: '12px',
  },
  emptyDetails: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '40px',
    textAlign: 'center',
  },
  detailsContent: {
    padding: '24px',
    overflowY: 'auto',
  },
  detailsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  detailsTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    color: '#1a1d29',
  },
  closeButton: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#f5f7fa',
    color: '#6b7280',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '20px',
  },
  infoCard: {
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  infoLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: 500,
  },
  infoValue: {
    fontSize: '14px',
    color: '#1a1d29',
    fontWeight: 600,
  },
  descricaoCard: {
    padding: '16px',
    backgroundColor: '#fef3c7',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  descricaoLabel: {
    fontSize: '12px',
    color: '#92400e',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  descricaoText: {
    margin: '8px 0 0 0',
    fontSize: '14px',
    color: '#78350f',
    lineHeight: 1.5,
  },
  contaCard: {
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  contaTitle: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a1d29',
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
  },
  contaEmptyText: {
    margin: 0,
    fontSize: '14px',
    color: '#6b7280',
  },
  contaLabel: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: 500,
  },
  contaValue: {
    fontSize: '14px',
    color: '#1a1d29',
    fontWeight: 600,
  },
  actionsSection: {
    paddingTop: '20px',
    borderTop: '2px solid #e5e7eb',
  },
  actionsTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a1d29',
  },
  actionsGrid: {
    display: 'grid',
    gap: '12px',
  },
  actionButton: {
    padding: '14px',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    color: '#fff',
  },
  actionButtonSwap: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  },
  actionButtonRefund: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  },
  actionButtonClose: {
    background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 700,
    color: '#1a1d29',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px',
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
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '10px 12px',
    fontFamily: 'inherit',
    fontSize: '14px',
    resize: 'vertical',
  },
  modalFooter: {
    padding: '16px 24px 20px',
    borderTop: '1px solid #e5e7eb',
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
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  modalConfirmBtn: {
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 600,
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};




