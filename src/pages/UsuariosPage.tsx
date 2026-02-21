import { useEffect, useMemo, useState } from 'react';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  ajustarSaldoUsuario,
  getAdminUsuarios,
  getHistoricoSaldoUsuario,
} from '../services/apiClient';
import type {
  IUsuarioAdminList,
  IUsuarioSaldoAjusteResponse,
  IUsuarioSaldoHistoricoItem,
  IUsuarioSaldoOperacao,
} from '../types/api.types';
import { MetricCard, PageHeader } from '../components/UI';
import { useToast } from '../contexts/ToastContext';
import { getApiErrorMessage } from '../utils/errors';

const OPERACOES: { value: IUsuarioSaldoOperacao; label: string }[] = [
  { value: 'ADICIONAR', label: 'Adicionar saldo' },
  { value: 'REMOVER', label: 'Remover saldo' },
  { value: 'DEFINIR', label: 'Definir saldo exato' },
];

export const UsuariosPage = () => {
  const { showToast } = useToast();
  const [usuarios, setUsuarios] = useState<IUsuarioAdminList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<IUsuarioAdminList | null>(null);
  const [operacao, setOperacao] = useState<IUsuarioSaldoOperacao>('ADICIONAR');
  const [valorAjuste, setValorAjuste] = useState('');
  const [motivoAjuste, setMotivoAjuste] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historicoSaldo, setHistoricoSaldo] = useState<IUsuarioSaldoHistoricoItem[]>([]);
  const [isLoadingHistorico, setIsLoadingHistorico] = useState(false);

  const carregarUsuarios = async () => {
    setIsLoading(true);
    try {
      const response = await getAdminUsuarios();
      setUsuarios(response.data);
      setError(null);
    } catch (err: unknown) {
      console.error('Erro ao buscar usuários:', err);
      setError('Falha ao carregar usuários.');
    } finally {
      setIsLoading(false);
    }
  };

  const carregarHistoricoSaldo = async (usuarioId: string) => {
    setIsLoadingHistorico(true);
    try {
      const response = await getHistoricoSaldoUsuario(usuarioId, 30);
      setHistoricoSaldo(response.data);
    } catch (err: unknown) {
      console.error('Erro ao buscar histórico de saldo:', err);
      const errorMsg = getApiErrorMessage(err, 'Falha ao carregar histórico de ajustes.');
      showToast(errorMsg, 'error');
      setHistoricoSaldo([]);
    } finally {
      setIsLoadingHistorico(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  useEffect(() => {
    if (!selectedUser) {
      setHistoricoSaldo([]);
      setIsLoadingHistorico(false);
      return;
    }
    carregarHistoricoSaldo(selectedUser.id);
  }, [selectedUser]);

  useEffect(() => {
    if (!selectedUser) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        setSelectedUser(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedUser, isSubmitting]);

  const formatarData = (dataIso: string) =>
    new Date(dataIso.endsWith('Z') ? dataIso : `${dataIso}Z`).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });

  const formatCurrency = (value: string | number) => `R$ ${Number(value || 0).toFixed(2)}`;

  const saldoTotal = usuarios.reduce((soma, user) => soma + Number(user.saldo_carteira || 0), 0);
  const totalCompras = usuarios.reduce((soma, user) => soma + Number(user.total_pedidos || 0), 0);

  const valorNumerico = useMemo(() => Number(valorAjuste.replace(',', '.')), [valorAjuste]);
  const saldoAtualSelecionado = selectedUser ? Number(selectedUser.saldo_carteira || 0) : 0;
  const saldoProjetado = useMemo(() => {
    if (!selectedUser || !Number.isFinite(valorNumerico)) return saldoAtualSelecionado;
    if (operacao === 'ADICIONAR') return saldoAtualSelecionado + valorNumerico;
    if (operacao === 'REMOVER') return saldoAtualSelecionado - valorNumerico;
    return valorNumerico;
  }, [selectedUser, valorNumerico, operacao, saldoAtualSelecionado]);

  const abrirModalAjuste = (user: IUsuarioAdminList) => {
    setSelectedUser(user);
    setOperacao('ADICIONAR');
    setValorAjuste('');
    setMotivoAjuste('');
  };

  const fecharModalAjuste = () => {
    if (isSubmitting) return;
    setSelectedUser(null);
  };

  const getOperationLabel = (op: IUsuarioSaldoOperacao) => {
    if (op === 'ADICIONAR') return 'adicionado';
    if (op === 'REMOVER') return 'removido';
    return 'definido';
  };

  const getOperationBadgeStyle = (op: IUsuarioSaldoOperacao): React.CSSProperties => {
    if (op === 'ADICIONAR') return styles.badgeAdd;
    if (op === 'REMOVER') return styles.badgeRemove;
    return styles.badgeSet;
  };

  const handleAjustarSaldo = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedUser) return;

    if (!Number.isFinite(valorNumerico)) {
      showToast('Informe um valor válido para o ajuste.', 'warning');
      return;
    }

    if ((operacao === 'ADICIONAR' || operacao === 'REMOVER') && valorNumerico <= 0) {
      showToast('O valor precisa ser maior que zero para adicionar/remover.', 'warning');
      return;
    }

    if (operacao === 'DEFINIR' && valorNumerico < 0) {
      showToast('Não é permitido definir saldo negativo.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await ajustarSaldoUsuario(selectedUser.id, {
        operacao,
        valor: valorNumerico,
        motivo: motivoAjuste.trim() || null,
      });
      const data = response.data as IUsuarioSaldoAjusteResponse;
      showToast(
        `Saldo ${getOperationLabel(data.operacao)} com sucesso. Antes: ${formatCurrency(data.saldo_anterior)} | Agora: ${formatCurrency(data.saldo_atual)}`,
        'success',
      );
      setSelectedUser((current) => (current ? { ...current, saldo_carteira: data.saldo_atual } : current));
      setValorAjuste('');
      setMotivoAjuste('');
      await Promise.all([
        carregarUsuarios(),
        carregarHistoricoSaldo(data.usuario_id),
      ]);
    } catch (err: unknown) {
      console.error('Erro ao ajustar saldo:', err);
      const errorMsg = getApiErrorMessage(err, 'Falha ao ajustar saldo do usuário.');
      showToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{mobileStyles}</style>

      <PageHeader
        title="Usuários do Sistema"
        subtitle="Lista de todos os clientes cadastrados com ajuste manual de saldo."
        icon={<GroupOutlinedIcon fontSize="small" />}
      />

      <div className="usuarios-stats-grid" style={styles.statsGrid}>
        <MetricCard label="Usuários" value={usuarios.length} icon={<PersonOutlineOutlinedIcon fontSize="small" />} tone="info" />
        <MetricCard label="Saldo total" value={formatCurrency(saldoTotal)} icon={<PaidOutlinedIcon fontSize="small" />} tone="success" />
        <MetricCard label="Total compras" value={totalCompras} icon={<ShoppingCartOutlinedIcon fontSize="small" />} tone="warning" />
      </div>

      {error && (
        <div style={styles.alert}>
          <span style={styles.alertIcon}><ErrorOutlineOutlinedIcon sx={{ fontSize: 18 }} /></span>
          <span>{error}</span>
        </div>
      )}

      <div style={styles.tableContainer}>
        {usuarios.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}><GroupOutlinedIcon sx={{ fontSize: 52 }} /></span>
            <h3 style={styles.emptyTitle}>Nenhum usuário encontrado</h3>
            <p style={styles.emptyText}>Quando novos usuários se registrarem, eles aparecerão aqui.</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Usuário</th>
                <th style={styles.th}>ID Telegram</th>
                <th style={styles.th}>Saldo Atual</th>
                <th style={styles.th}>Total Compras</th>
                <th style={styles.th}>Registrado Em</th>
                <th style={styles.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((user) => (
                <tr key={user.id}>
                  <td style={styles.td}>{user.nome_completo}</td>
                  <td style={styles.td}>{user.telegram_id}</td>
                  <td style={styles.td}>
                    <span style={styles.saldo}>{formatCurrency(user.saldo_carteira)}</span>
                  </td>
                  <td style={styles.td}>{user.total_pedidos}</td>
                  <td style={styles.td}>{formatarData(user.criado_em)}</td>
                  <td style={styles.td}>
                    <button type="button" style={styles.ajustarButton} onClick={() => abrirModalAjuste(user)}>
                      <EditOutlinedIcon sx={{ fontSize: 15 }} />
                      Ajustar saldo
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedUser && (
        <div className="usuarios-modal-overlay" style={styles.modalOverlay} onClick={fecharModalAjuste}>
          <div className="usuarios-modal" style={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="usuarios-modal-header" style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Ajuste de Saldo</h3>
              <button type="button" onClick={fecharModalAjuste} style={styles.modalClose} aria-label="Fechar modal de ajuste">
                x
              </button>
            </div>

            <form onSubmit={handleAjustarSaldo} className="usuarios-modal-body" style={styles.modalBody}>
              <div style={styles.userBox}>
                <p style={styles.userLine}><strong>Usuário:</strong> {selectedUser.nome_completo}</p>
                <p style={styles.userLine}><strong>Telegram:</strong> {selectedUser.telegram_id}</p>
                <p style={styles.userLine}><strong>Saldo atual:</strong> {formatCurrency(selectedUser.saldo_carteira)}</p>
              </div>

              <div style={styles.inputGroup}>
                <label htmlFor="ajuste-operacao" style={styles.label}>Operação</label>
                <select
                  id="ajuste-operacao"
                  value={operacao}
                  onChange={(e) => setOperacao(e.target.value as IUsuarioSaldoOperacao)}
                  style={styles.input}
                  disabled={isSubmitting}
                >
                  {OPERACOES.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label htmlFor="ajuste-valor" style={styles.label}>
                  Valor (R$) {operacao === 'DEFINIR' ? 'do saldo final' : 'do ajuste'}
                </label>
                <input
                  id="ajuste-valor"
                  type="number"
                  inputMode="decimal"
                  min={operacao === 'DEFINIR' ? 0 : 0.01}
                  step="0.01"
                  value={valorAjuste}
                  onChange={(e) => setValorAjuste(e.target.value)}
                  placeholder="0,00"
                  style={styles.input}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div style={styles.previewBox}>
                <p style={styles.previewText}>Saldo projetado: <strong>{formatCurrency(saldoProjetado)}</strong></p>
                {saldoProjetado < 0 && (
                  <p style={styles.previewWarning}>O saldo projetado está negativo. Ajuste o valor para continuar.</p>
                )}
              </div>

              <div style={styles.inputGroup}>
                <label htmlFor="ajuste-motivo" style={styles.label}>Motivo (opcional)</label>
                <textarea
                  id="ajuste-motivo"
                  value={motivoAjuste}
                  onChange={(e) => setMotivoAjuste(e.target.value)}
                  placeholder="Ex: recarga paga e não creditada automaticamente"
                  style={styles.textArea}
                  maxLength={240}
                  disabled={isSubmitting}
                />
              </div>

              <div style={styles.historicoSection}>
                <h4 style={styles.historicoTitle}>Histórico de ajustes</h4>
                {isLoadingHistorico ? (
                  <p style={styles.historicoEmpty}>Carregando histórico...</p>
                ) : historicoSaldo.length === 0 ? (
                  <p style={styles.historicoEmpty}>Nenhum ajuste manual registrado para este usuário.</p>
                ) : (
                  <div style={styles.historicoList}>
                    {historicoSaldo.map((item) => (
                      <div key={item.id} style={styles.historicoItem}>
                        <div style={styles.historicoTopRow}>
                          <span style={{ ...styles.historicoBadge, ...getOperationBadgeStyle(item.operacao) }}>
                            {item.operacao}
                          </span>
                          <span style={styles.historicoDate}>{formatarData(item.criado_em)}</span>
                        </div>
                        <p style={styles.historicoLine}>
                          Valor: <strong>{formatCurrency(item.valor)}</strong> | Antes: {formatCurrency(item.saldo_anterior)} | Depois: {formatCurrency(item.saldo_atual)}
                        </p>
                        <p style={styles.historicoLine}>
                          Admin: {item.admin_nome_completo} ({item.admin_telegram_id})
                        </p>
                        {item.motivo && <p style={styles.historicoReason}>Motivo: {item.motivo}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={fecharModalAjuste} style={styles.cancelButton} disabled={isSubmitting}>
                  Cancelar
                </button>
                <button type="submit" style={styles.confirmButton} disabled={isSubmitting || saldoProjetado < 0}>
                  {isSubmitting ? 'Salvando...' : 'Confirmar ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1400px', margin: '0 auto' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' },
  spinner: { width: '48px', height: '48px', border: '4px solid var(--border-subtle)', borderTop: '4px solid var(--brand-500)', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { fontSize: '16px', color: 'var(--text-secondary)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' },
  alert: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', marginBottom: '24px' },
  alertIcon: { fontSize: '18px' },
  tableContainer: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '860px' },
  th: { padding: '14px 18px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: 'var(--text-secondary)', backgroundColor: 'var(--surface-soft)', borderBottom: '2px solid var(--border-subtle)', textTransform: 'uppercase' },
  td: { padding: '16px 18px', borderBottom: '1px solid var(--surface-muted)', color: 'var(--text-primary)', fontSize: '14px', whiteSpace: 'nowrap' },
  saldo: { fontWeight: 600, color: '#10b981' },
  ajustarButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    border: '1px solid #bfdbfe',
    backgroundColor: '#eff6ff',
    color: '#1e3a8a',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '16px' },
  emptyIcon: { fontSize: '64px', opacity: 0.5 },
  emptyTitle: { margin: 0, fontSize: '20px', color: 'var(--text-primary)' },
  emptyText: { margin: 0, fontSize: '14px', color: 'var(--text-secondary)' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' },
  modal: { backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '560px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' },
  modalHeader: { padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  modalTitle: { margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' },
  modalClose: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-secondary)', minWidth: '40px', minHeight: '40px', borderRadius: '8px' },
  modalBody: { padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' },
  userBox: { padding: '12px 14px', borderRadius: '10px', backgroundColor: 'var(--surface-soft)', border: '1px solid var(--border-subtle)' },
  userLine: { margin: 0, fontSize: '13px', color: 'var(--text-primary)' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' },
  input: { padding: '12px 14px', fontSize: '14px', border: '2px solid var(--border-subtle)', borderRadius: '8px', width: '100%', fontFamily: 'inherit' },
  textArea: { padding: '12px 14px', fontSize: '14px', border: '2px solid var(--border-subtle)', borderRadius: '8px', width: '100%', fontFamily: 'inherit', minHeight: '84px', resize: 'vertical' },
  previewBox: { padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid var(--border-subtle)' },
  previewText: { margin: 0, fontSize: '14px', color: 'var(--text-primary)' },
  previewWarning: { margin: '8px 0 0 0', fontSize: '12px', color: '#b91c1c', fontWeight: 600 },
  historicoSection: { borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' },
  historicoTitle: { margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' },
  historicoEmpty: { margin: 0, fontSize: '13px', color: 'var(--text-secondary)' },
  historicoList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  historicoItem: { border: '1px solid var(--border-subtle)', borderRadius: '8px', backgroundColor: '#fafcff', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' },
  historicoTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  historicoBadge: { fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', borderRadius: '999px', padding: '3px 8px' },
  badgeAdd: { backgroundColor: '#dcfce7', color: '#166534' },
  badgeRemove: { backgroundColor: '#fee2e2', color: '#991b1b' },
  badgeSet: { backgroundColor: '#dbeafe', color: '#1e3a8a' },
  historicoDate: { fontSize: '11px', color: 'var(--text-secondary)' },
  historicoLine: { margin: 0, fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.4 },
  historicoReason: { margin: 0, fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.4 },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px' },
  cancelButton: { padding: '10px 14px', fontSize: '13px', fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'var(--surface-muted)', color: 'var(--text-primary)' },
  confirmButton: { padding: '10px 14px', fontSize: '13px', fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'linear-gradient(135deg, var(--brand-500) 0%, var(--brand-600) 100%)', color: '#fff' },
};

const mobileStyles = `
  @media (max-width: 768px) {
    .usuarios-stats-grid {
      grid-template-columns: 1fr !important;
    }

    .usuarios-modal-overlay {
      align-items: flex-start !important;
      padding: calc(12px + env(safe-area-inset-top, 0px)) 12px calc(12px + env(safe-area-inset-bottom, 0px)) !important;
    }

    .usuarios-modal {
      max-height: calc(100dvh - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) !important;
      border-radius: 14px !important;
    }

    .usuarios-modal-header {
      padding: 14px 16px !important;
    }

    .usuarios-modal-body {
      padding: 14px 16px !important;
    }
  }
`;
