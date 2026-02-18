import { useEffect, useState } from 'react';
import {
  getAdminContasMae,
  getAdminProdutos,
  createContaMae,
  updateContaMae,
  deleteContaMae,
  getContaMaeDetalhes,
  addContaMaeConvite,
} from '../services/apiClient';
import type { IContaMae, IContaMaeDetalhes } from '../types/api.types';
import { useToast } from '../contexts/ToastContext';
import { getApiErrorMessage } from '../utils/errors';
import { MetricCard, PageHeader } from '../components/UI';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';

interface IProduto {
  id: string;
  nome: string;
}

export const ContasMaePage = () => {
  const { showToast } = useToast();
  const [contas, setContas] = useState<IContaMae[]>([]);
  const [produtos, setProdutos] = useState<IProduto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingConta, setEditingConta] = useState<IContaMae | null>(null);
  const [deletingConta, setDeletingConta] = useState<IContaMae | null>(null);
  const [selectedConta, setSelectedConta] = useState<IContaMaeDetalhes | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');

  const [selectedProdutoId, setSelectedProdutoId] = useState('');
  const [novoLogin, setNovoLogin] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [novoMaxSlots, setNovoMaxSlots] = useState(1);
  const [novoDataExpiracao, setNovoDataExpiracao] = useState('');
  const [novoIsAtivo, setNovoIsAtivo] = useState(true);
  const [filterTerm, setFilterTerm] = useState('');
  const isAnyModalOpen = Boolean(selectedConta || deletingConta);

  const carregarDados = async () => {
    setIsLoading(true);
    try {
      const [contasRes, produtosRes] = await Promise.all([
        getAdminContasMae(),
        getAdminProdutos(),
      ]);
      setContas(contasRes.data);
      setProdutos(produtosRes.data);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError('Falha ao carregar contas mãe.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (!isAnyModalOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isAnyModalOpen]);

  useEffect(() => {
    if (!isAnyModalOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setSelectedConta(null);
      setDeletingConta(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnyModalOpen]);

  const resetForm = () => {
    setSelectedProdutoId('');
    setNovoLogin('');
    setNovaSenha('');
    setNovoMaxSlots(1);
    setNovoDataExpiracao('');
    setNovoIsAtivo(true);
    setEditingConta(null);
    setShowForm(false);
  };

  const getProdutoNome = (produtoId: string): string => {
    const produto = produtos.find((p) => p.id === produtoId);
    return produto ? produto.nome : 'Produto Desconhecido';
  };

  const formatDate = (dateIso: string | null) => {
    if (!dateIso) return '-';
    const date = new Date(`${dateIso}T00:00:00Z`);
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProdutoId) {
      showToast('Por favor, selecione um produto.', 'warning');
      return;
    }

    try {
      if (editingConta) {
        const updateData: Record<string, unknown> = {
          login: novoLogin,
          max_slots: novoMaxSlots,
          data_expiracao: novoDataExpiracao || null,
          is_ativo: novoIsAtivo,
          ...(novaSenha && { senha: novaSenha }),
        };
        await updateContaMae(editingConta.id, updateData);
        showToast('Conta mãe atualizada com sucesso!', 'success');
      } else {
        if (!novaSenha) {
          showToast('A senha é obrigatória ao criar nova conta.', 'warning');
          return;
        }
        await createContaMae({
          produto_id: selectedProdutoId,
          login: novoLogin,
          senha: novaSenha,
          max_slots: novoMaxSlots,
          data_expiracao: novoDataExpiracao || null,
          is_ativo: novoIsAtivo,
        });
        showToast('Conta mãe criada com sucesso!', 'success');
      }

      resetForm();
      carregarDados();
    } catch (err: unknown) {
      console.error('Erro ao salvar conta mãe:', err);
      const errorMsg = getApiErrorMessage(err, 'Falha ao salvar conta mãe.');
      showToast(errorMsg, 'error');
    }
  };

  const handleEdit = (conta: IContaMae) => {
    setEditingConta(conta);
    setSelectedProdutoId(conta.produto_id);
    setNovoLogin(conta.login);
    setNovaSenha('');
    setNovoMaxSlots(conta.max_slots);
    setNovoDataExpiracao(conta.data_expiracao || '');
    setNovoIsAtivo(conta.is_ativo);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deletingConta) return;
    try {
      await deleteContaMae(deletingConta.id);
      showToast('Conta mãe excluída com sucesso!', 'success');
      setDeletingConta(null);
      carregarDados();
    } catch (err: unknown) {
      console.error('Erro ao excluir conta mãe:', err);
      const errorMsg = getApiErrorMessage(err, 'Falha ao excluir conta mãe.');
      showToast(errorMsg, 'error');
      setDeletingConta(null);
    }
  };

  const handleOpenDetails = async (contaId: string) => {
    setIsLoadingDetails(true);
    try {
      const response = await getContaMaeDetalhes(contaId);
      setSelectedConta(response.data);
      setInviteEmail('');
    } catch (err: unknown) {
      console.error('Erro ao buscar detalhes:', err);
      const errorMsg = getApiErrorMessage(err, 'Falha ao carregar detalhes da conta mãe.');
      showToast(errorMsg, 'error');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleAddInvite = async () => {
    if (!selectedConta) return;
    if (!inviteEmail.trim()) {
      showToast('Informe o e-mail do convidado.', 'warning');
      return;
    }

    try {
      await addContaMaeConvite(selectedConta.id, { email_cliente: inviteEmail.trim() });
      const updated = await getContaMaeDetalhes(selectedConta.id);
      setSelectedConta(updated.data);
      setInviteEmail('');
      carregarDados();
    } catch (err: unknown) {
      console.error('Erro ao adicionar convite:', err);
      const errorMsg = getApiErrorMessage(err, 'Falha ao adicionar convite.');
      showToast(errorMsg, 'error');
    }
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

  const filteredContas = contas.filter((conta) => {
    const term = filterTerm.toLowerCase().trim();
    if (!term) return true;
    const produtoNome = getProdutoNome(conta.produto_id).toLowerCase();
    const login = conta.login.toLowerCase();
    return produtoNome.includes(term) || login.includes(term);
  });
  const isSlotsFull = selectedConta ? selectedConta.slots_ocupados >= selectedConta.max_slots : false;

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Carregando contas mãe...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{mobileStyles}</style>

      <PageHeader
        title="Contas Mãe"
        subtitle="Gerencie as contas que convidam clientes por e-mail."
        icon={<GroupOutlinedIcon fontSize="small" />}
        action={(
          <button type="button" onClick={() => (showForm ? resetForm() : setShowForm(true))} style={styles.addButton}>
            {showForm ? 'Cancelar' : (
              <>
                <AddOutlinedIcon sx={{ fontSize: 16, marginRight: '6px', verticalAlign: 'text-bottom' }} />
                Nova Conta Mãe
              </>
            )}
          </button>
        )}
      />

      {error && (
        <div style={styles.alert}>
          <span style={styles.alertIcon}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>
            {editingConta ? '✏️ Editar Conta Mãe' : '➕ Cadastrar Conta Mãe'}
          </h3>
          <form onSubmit={handleCreateOrUpdate} style={styles.form}>
            <div style={styles.inputGroup}>
              <label htmlFor="conta-mae-produto" style={styles.label}>
                Produto
              </label>
              <select
                id="conta-mae-produto"
                value={selectedProdutoId}
                onChange={(e) => setSelectedProdutoId(e.target.value)}
                required
                disabled={!!editingConta}
                style={{ ...styles.input, opacity: editingConta ? 0.6 : 1 }}
              >
                <option value="">-- Selecione um Produto --</option>
                {produtos.map((produto) => (
                  <option key={produto.id} value={produto.id}>
                    {produto.nome}
                  </option>
                ))}
              </select>
              {editingConta && (
                <small style={styles.inputHint}>O produto não pode ser alterado após a criação</small>
              )}
            </div>

            <div style={styles.inputRow}>
              <div style={styles.inputGroup}>
                <label htmlFor="conta-mae-login" style={styles.label}>
                  Login (e-mail)
                </label>
                <input
                  id="conta-mae-login"
                  type="text"
                  value={novoLogin}
                  onChange={(e) => setNovoLogin(e.target.value)}
                  required
                  style={styles.input}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div style={styles.inputGroup}>
                <label htmlFor="conta-mae-senha" style={styles.label}>
                  Senha {editingConta && '(deixe vazio para não alterar)'}
                </label>
                <input
                  id="conta-mae-senha"
                  type="text"
                  autoComplete="off"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  required={!editingConta}
                  style={styles.input}
                  placeholder="Digite a senha em texto"
                />
              </div>
            </div>

            <div style={styles.inputRow}>
              <div style={styles.inputGroup}>
                <label htmlFor="conta-mae-max-slots" style={styles.label}>
                  Máximo de Slots
                </label>
                <input
                  id="conta-mae-max-slots"
                  type="number"
                  step="1"
                  min="1"
                  value={novoMaxSlots}
                  onChange={(e) => setNovoMaxSlots(parseInt(e.target.value))}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label htmlFor="conta-mae-data-expiracao" style={styles.label}>
                  Data de Expiração
                </label>
                <input
                  id="conta-mae-data-expiracao"
                  type="date"
                  value={novoDataExpiracao}
                  onChange={(e) => setNovoDataExpiracao(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="conta-mae-status" style={styles.label}>
                Status
              </label>
              <select
                id="conta-mae-status"
                value={novoIsAtivo ? 'true' : 'false'}
                onChange={(e) => setNovoIsAtivo(e.target.value === 'true')}
                style={styles.input}
              >
                <option value="true">✓ Ativa</option>
                <option value="false">✖ Inativa</option>
              </select>
            </div>

            <div style={styles.formActions}>
              <button type="button" onClick={resetForm} style={styles.cancelButton}>
               ✖ Cancelar
              </button>
              <button type="submit" style={styles.submitButton}>
                {editingConta ? 'Salvar Alterações' : 'Cadastrar Conta'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.filterContainer}>
        <h3 style={styles.filterTitle}>Filtrar Contas</h3>
        <div style={styles.filterInputs}>
          <div style={styles.inputGroup}>
            <label htmlFor="conta-mae-filtro" style={styles.label}>
              Buscar por Produto ou Login
            </label>
            <input
              id="conta-mae-filtro"
              type="text"
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              style={styles.input}
              placeholder="Ex: Canva ou conta@email.com"
            />
          </div>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <MetricCard label="Contas (filtro)" value={filteredContas.length} icon={<GroupOutlinedIcon fontSize="small" />} tone="info" />
        <MetricCard label="Ativas" value={filteredContas.filter((c) => c.is_ativo).length} icon={<TaskAltOutlinedIcon fontSize="small" />} tone="success" />
        <MetricCard
          label="Próximas de expirar"
          value={filteredContas.filter((c) => (c.dias_restantes ?? 999) <= 7).length}
          icon={<AccessTimeOutlinedIcon fontSize="small" />}
          tone="warning"
        />
      </div>

      <div style={styles.estoqueGrid}>
        {filteredContas.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>👩‍💼</span>
            <h3 style={styles.emptyTitle}>Nenhuma conta encontrada</h3>
            <p style={styles.emptyText}>Cadastre novas contas ou ajuste os filtros.</p>
          </div>
        ) : (
          filteredContas.map((conta) => {
            let expLabel: string | null = null;
            let expStyle: React.CSSProperties = {};

            if (conta.dias_restantes !== null && conta.dias_restantes !== undefined) {
              if (conta.dias_restantes < 0) {
                expLabel = ` Expirou h ${-conta.dias_restantes} dias`;
                expStyle = styles.badgeInactive;
              } else if (conta.dias_restantes <= 7) {
                expLabel = ` Expira em ${conta.dias_restantes} dias`;
                expStyle = styles.badgeWarning;
              } else {
                expLabel = ` Expira em ${conta.dias_restantes} dias`;
                expStyle = styles.badgeInfo;
              }
            }

            return (
              <div
                key={conta.id}
                style={{
                  ...styles.estoqueCard,
                  borderColor: conta.is_ativo ? 'var(--border-subtle)' : '#ef4444',
                }}
              >
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>{getProdutoNome(conta.produto_id)}</h3>
                  <div style={styles.badges}>
                    {expLabel && (
                      <span style={{ ...styles.badge, ...expStyle }}>
                        {expLabel}
                      </span>
                    )}
                    <span style={{ ...styles.badge, ...(conta.is_ativo ? styles.badgeActive : styles.badgeInactive) }}>
                      {conta.is_ativo ? '✓ Ativa' : '✖ Inativa'}
                    </span>
                  </div>
                </div>

                <div style={styles.cardInfo}>
                  <span style={styles.infoLabel}>Login:</span>
                  <span style={styles.infoValue}>{conta.login}</span>
                </div>

                <div style={styles.cardInfo}>
                  <span style={styles.infoLabel}>Slots:</span>
                  <span style={styles.infoValue}>{conta.slots_ocupados} / {conta.max_slots}</span>
                </div>

                <div style={styles.cardInfo}>
                  <span style={styles.infoLabel}>Convites:</span>
                  <span style={styles.infoValue}>{conta.total_convites ?? 0}</span>
                </div>

                <div style={styles.cardFooter}>
                  <span style={styles.cardId}>ID: {conta.id.substring(0, 8)}...</span>
                </div>

                <div style={styles.actionButtons}>
                  <button
                    type="button"
                    onClick={() => handleOpenDetails(conta.id)}
                    style={{ ...styles.actionBtn, ...styles.detailsBtn }}
                  >
                     Detalhes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(conta)}
                    style={{ ...styles.actionBtn, ...styles.editBtn }}
                  >
                     Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingConta(conta)}
                    style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                  >
                     Excluir
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedConta && (
        <div className="contas-mae-modal-overlay" style={styles.modalOverlay} onClick={() => setSelectedConta(null)}>
          <div
            className="contas-mae-modal"
            style={styles.modal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Detalhes da conta mãe"
          >
            <div className="contas-mae-modal-header" style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>👩‍💼 Conta Mãe</h3>
              <button
                type="button"
                onClick={() => setSelectedConta(null)}
                style={styles.modalClose}
                aria-label="Fechar detalhes da conta mãe"
              >
                x
              </button>
            </div>

            {isLoadingDetails ? (
              <div style={styles.modalLoadingContainer}>
                <div style={styles.spinner} />
                <p style={styles.loadingText}>Carregando detalhes...</p>
              </div>
            ) : (
              <div className="contas-mae-modal-body" style={styles.modalBody}>
                <div className="contas-mae-info-grid" style={styles.infoGrid}>
                  <div style={styles.infoBox}>
                    <span style={styles.infoLabel}>Login</span>
                    <button
                      type="button"
                      className="contas-mae-copy-box"
                      style={styles.copyBox}
                      onClick={() => copyToClipboard(selectedConta.login, 'login')}
                      aria-label="Copiar login"
                    >
                      <span style={styles.credentialValue}>{selectedConta.login}</span>
                      <span style={styles.copyButton}>Copiar</span>
                    </button>
                  </div>
                  <div style={styles.infoBox}>
                    <span style={styles.infoLabel}>Senha</span>
                    <button
                      type="button"
                      className="contas-mae-copy-box"
                      style={styles.copyBox}
                      onClick={() => copyToClipboard(selectedConta.senha || '', 'senha')}
                      aria-label="Copiar senha"
                    >
                      <span style={styles.credentialValue}>{selectedConta.senha || '-'}</span>
                      <span style={styles.copyButton}>Copiar</span>
                    </button>
                  </div>
                  <div style={styles.infoBox}>
                    <span style={styles.infoLabel}>Expiração</span>
                    <span style={styles.infoValue}>{formatDate(selectedConta.data_expiracao)}</span>
                  </div>
                  <div style={styles.infoBox}>
                    <span style={styles.infoLabel}>Dias Restantes</span>
                    <span style={styles.infoValue}>{selectedConta.dias_restantes ?? '-'}</span>
                  </div>
                  <div style={styles.infoBox}>
                    <span style={styles.infoLabel}>Slots</span>
                    <span style={styles.infoValue}>{selectedConta.slots_ocupados} / {selectedConta.max_slots}</span>
                  </div>
                </div>

                <div style={styles.inviteSection}>
                  <h4 style={styles.sectionTitle}>Adicionar e-mail convidado</h4>
                  {isSlotsFull && (
                    <p style={styles.warningText}>Esta conta já atingiu o máximo de slots.</p>
                  )}
                  <div className="contas-mae-invite-row" style={styles.inviteRow}>
                    <label htmlFor="conta-mae-invite-email" style={styles.srOnly}>
                      E-mail do convidado
                    </label>
                    <input
                      id="conta-mae-invite-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="email@cliente.com"
                      style={styles.input}
                      disabled={isSlotsFull}
                    />
                    <button type="button" onClick={handleAddInvite} style={styles.submitButton} disabled={isSlotsFull}>
                      Adicionar
                    </button>
                  </div>
                </div>

                <div style={styles.inviteList}>
                  <h4 style={styles.sectionTitle}>E-mails atribuídos</h4>
                  {selectedConta.convites.length === 0 ? (
                    <p style={styles.emptyText}>Nenhum convite registrado.</p>
                  ) : (
                    <div style={styles.inviteTable}>
                      {selectedConta.convites.map((convite) => (
                        <div key={convite.id} className="contas-mae-invite-item" style={styles.inviteItem}>
                          <span style={styles.inviteEmail}>{convite.email_cliente}</span>
                          <span style={styles.inviteDate}>{formatDate(convite.criado_em.split('T')[0])}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {deletingConta && (
        <div className="contas-mae-modal-overlay" style={styles.modalOverlay} onClick={() => setDeletingConta(null)}>
          <div className="contas-mae-modal" style={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="contas-mae-modal-header" style={styles.modalHeader}>
              <h3 style={styles.modalTitle}> Confirmar Excluso</h3>
              <button
                type="button"
                onClick={() => setDeletingConta(null)}
                style={styles.modalClose}
                aria-label="Fechar confirmação de exclusão"
              >
                x
              </button>
            </div>
            <div style={styles.modalBody}>
              <p style={styles.modalText}>
                Tem certeza que deseja excluir a conta <strong>{deletingConta.login}</strong>?
              </p>
              <div style={styles.warningBox}>
                <span style={styles.warningIcon}>!</span>
                <p style={styles.warningText}>
                  Esta ação não pode ser desfeita. Os convites vinculados serão removidos.
                </p>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button type="button" onClick={() => setDeletingConta(null)} style={styles.modalCancelBtn}>
               ✖ Cancelar
              </button>
              <button type="button" onClick={handleDelete} style={styles.modalDeleteBtn}>
                Sim, Excluir
              </button>
            </div>
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
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' },
  title: { margin: '0 0 4px 0', fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' },
  subtitle: { margin: 0, fontSize: '15px', color: 'var(--text-secondary)' },
  addButton: { padding: '12px 24px', fontSize: '14px', fontWeight: 600, background: 'linear-gradient(135deg, var(--brand-500) 0%, var(--brand-600) 100%)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  alert: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', marginBottom: '24px' },
  alertIcon: { fontSize: '18px' },
  formCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  formTitle: { margin: '0 0 20px 0', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: 600, color: '#374151' },
  input: { padding: '12px 16px', fontSize: '15px', border: '2px solid var(--border-subtle)', borderRadius: '8px', width: '100%', fontFamily: 'inherit' },
  inputHint: { fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' },
  formActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  cancelButton: { padding: '12px 24px', fontSize: '14px', fontWeight: 600, backgroundColor: 'var(--surface-muted)', color: 'var(--text-primary)', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  submitButton: { padding: '12px 24px', fontSize: '14px', fontWeight: 600, background: 'linear-gradient(135deg, var(--brand-500) 0%, var(--brand-600) 100%)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  filterContainer: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  filterTitle: { margin: '0 0 20px 0', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' },
  filterInputs: { display: 'grid', gridTemplateColumns: '1fr', gap: '16px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' },
  statCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  statIcon: { width: '48px', height: '48px', borderRadius: '10px', backgroundColor: 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' },
  statLabel: { margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statValue: { margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' },
  estoqueGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' },
  estoqueCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '2px solid', transition: 'all 0.2s ease' },
  cardHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' },
  cardTitle: { margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', flex: 1 },
  badges: { display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' },
  badge: { padding: '4px 10px', fontSize: '11px', fontWeight: 600, borderRadius: '6px', whiteSpace: 'nowrap' },
  badgeActive: { backgroundColor: '#d1fae5', color: '#065f46' },
  badgeInactive: { backgroundColor: '#fee2e2', color: '#991b1b' },
  badgeWarning: { backgroundColor: '#fef3c7', color: '#92400e' },
  badgeInfo: { backgroundColor: '#dbeafe', color: '#1e40af' },
  cardInfo: { display: 'flex', justifyContent: 'space-between', marginBottom: '16px', padding: '12px', backgroundColor: 'var(--surface-soft)', borderRadius: '8px' },
  infoLabel: { fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 },
  infoValue: { fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 },
  cardFooter: { paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', marginBottom: '12px' },
  cardId: { fontSize: '11px', color: 'var(--text-muted)' },
  actionButtons: { display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' },
  actionBtn: { flex: 1, padding: '10px 16px', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' },
  detailsBtn: { backgroundColor: '#e0f2fe', color: '#0369a1' },
  editBtn: { backgroundColor: '#dbeafe', color: '#1e40af' },
  deleteBtn: { backgroundColor: '#fee2e2', color: '#991b1b' },
  emptyState: { gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '16px' },
  emptyIcon: { fontSize: '64px', opacity: 0.5 },
  emptyTitle: { margin: 0, fontSize: '20px', color: 'var(--text-primary)' },
  emptyText: { margin: 0, fontSize: '14px', color: 'var(--text-secondary)' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px', overflowY: 'auto' },
  modal: { backgroundColor: '#fff', borderRadius: '16px', maxWidth: '720px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' },
  modalHeader: { padding: '24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, backgroundColor: '#fff' },
  modalTitle: { margin: 0, fontSize: '20px', fontWeight: 700 },
  modalClose: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', padding: '8px', color: 'var(--text-secondary)', minWidth: '40px', minHeight: '40px', borderRadius: '8px' },
  modalBody: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', minHeight: 0, WebkitOverflowScrolling: 'touch' },
  modalLoadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '220px', gap: '16px', padding: '24px' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' },
  infoBox: { display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', backgroundColor: 'var(--surface-soft)', borderRadius: '10px' },
  inviteSection: { backgroundColor: 'var(--surface-soft)', borderRadius: '12px', padding: '16px' },
  sectionTitle: { margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' },
  inviteRow: { display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center' },
  inviteList: { backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '16px' },
  inviteTable: { display: 'flex', flexDirection: 'column', gap: '8px' },
  inviteItem: { display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 12px', backgroundColor: 'var(--surface-soft)', borderRadius: '8px' },
  inviteEmail: { fontWeight: 600, color: 'var(--text-primary)' },
  inviteDate: { fontSize: '12px', color: 'var(--text-secondary)' },
  copyBox: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '8px 12px', backgroundColor: '#fff', border: '1px solid var(--border-subtle)', borderRadius: '8px', cursor: 'pointer', width: '100%', fontFamily: 'inherit', fontSize: 'inherit', textAlign: 'left', minWidth: 0 },
  credentialValue: { fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, overflowWrap: 'anywhere' },
  copyButton: { fontSize: '12px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.4px' },
  srOnly: { position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 },
  modalText: { margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-primary)', lineHeight: 1.5 },
  warningBox: { display: 'flex', gap: '12px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' },
  warningIcon: { fontSize: '20px' },
  warningText: { margin: 0, fontSize: '14px', color: '#78350f', lineHeight: 1.5 },
  modalFooter: { padding: '24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '12px', justifyContent: 'flex-end', flexShrink: 0, backgroundColor: '#fff' },
  modalCancelBtn: { padding: '12px 24px', fontSize: '14px', fontWeight: 600, backgroundColor: 'var(--surface-muted)', color: 'var(--text-primary)', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  modalDeleteBtn: { padding: '12px 24px', fontSize: '14px', fontWeight: 600, backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
};

const mobileStyles = `
  @media (max-width: 768px) {
    .contas-mae-modal-overlay {
      align-items: flex-start !important;
      padding: calc(12px + env(safe-area-inset-top, 0px)) 12px calc(12px + env(safe-area-inset-bottom, 0px)) !important;
    }

    .contas-mae-modal {
      max-height: calc(100dvh - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) !important;
      border-radius: 14px !important;
    }

    .contas-mae-modal-header {
      position: sticky;
      top: 0;
      z-index: 1;
      padding: 16px !important;
    }

    .contas-mae-modal-body {
      padding: 16px !important;
      gap: 16px !important;
    }

    .contas-mae-info-grid {
      grid-template-columns: 1fr !important;
    }

    .contas-mae-copy-box {
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
      padding: 10px 12px;
    }

    .contas-mae-invite-row {
      grid-template-columns: 1fr !important;
      align-items: stretch !important;
    }

    .contas-mae-invite-row > button {
      width: 100%;
    }

    .contas-mae-invite-item {
      flex-direction: column;
      align-items: flex-start;
    }
  }
`;
