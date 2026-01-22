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

interface IProduto {
  id: string;
  nome: string;
}

export const ContasMaePage = () => {
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
      alert('️ Por favor, selecione um produto.');
      return;
    }

    try {
      if (editingConta) {
        const updateData: any = {
          login: novoLogin,
          max_slots: novoMaxSlots,
          data_expiracao: novoDataExpiracao || null,
          is_ativo: novoIsAtivo,
          ...(novaSenha && { senha: novaSenha }),
        };
        await updateContaMae(editingConta.id, updateData);
        alert(' Conta mãe atualizada com sucesso!');
      } else {
        if (!novaSenha) {
          alert('️ A senha é obrigatória ao criar nova conta.');
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
        alert(' Conta mãe criada com sucesso!');
      }

      resetForm();
      carregarDados();
    } catch (err: any) {
      console.error('Erro ao salvar conta mãe:', err);
      const errorMsg = err.response?.data?.detail || 'Falha ao salvar conta mãe.';
      alert(` Erro: ${errorMsg}`);
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
      alert(' Conta mãe excluída com sucesso!');
      setDeletingConta(null);
      carregarDados();
    } catch (err: any) {
      console.error('Erro ao excluir conta mãe:', err);
      const errorMsg = err.response?.data?.detail || 'Falha ao excluir conta mãe.';
      alert(` ${errorMsg}`);
      setDeletingConta(null);
    }
  };

  const handleOpenDetails = async (contaId: string) => {
    setIsLoadingDetails(true);
    try {
      const response = await getContaMaeDetalhes(contaId);
      setSelectedConta(response.data);
      setInviteEmail('');
    } catch (err: any) {
      console.error('Erro ao buscar detalhes:', err);
      const errorMsg = err.response?.data?.detail || 'Falha ao carregar detalhes.';
      alert(` Erro: ${errorMsg}`);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleAddInvite = async () => {
    if (!selectedConta) return;
    if (!inviteEmail.trim()) {
      alert('️ Informe o email do convidado.');
      return;
    }

    try {
      await addContaMaeConvite(selectedConta.id, { email_cliente: inviteEmail.trim() });
      const updated = await getContaMaeDetalhes(selectedConta.id);
      setSelectedConta(updated.data);
      setInviteEmail('');
      carregarDados();
    } catch (err: any) {
      console.error('Erro ao adicionar convite:', err);
      const errorMsg = err.response?.data?.detail || 'Falha ao adicionar convite.';
      alert(` ${errorMsg}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(' Copiado!');
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
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Contas Mãe</h1>
          <p style={styles.subtitle}>Gerencie as contas que convidam clientes por email</p>
        </div>
        <button onClick={() => (showForm ? resetForm() : setShowForm(true))} style={styles.addButton}>
          {showForm ? 'Cancelar' : 'Nova Conta Mãe'}
        </button>
      </div>

      {error && (
        <div style={styles.alert}>
          <span style={styles.alertIcon}>️</span>
          <span>{error}</span>
        </div>
      )}

      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>
            {editingConta ? 'Editar Conta Mãe' : 'Cadastrar Conta Mãe'}
          </h3>
          <form onSubmit={handleCreateOrUpdate} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Produto</label>
              <select
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
                <small style={styles.inputHint}>O produto não pode ser alterado após criação</small>
              )}
            </div>

            <div style={styles.inputRow}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Login (Email)</label>
                <input
                  type="text"
                  value={novoLogin}
                  onChange={(e) => setNovoLogin(e.target.value)}
                  required
                  style={styles.input}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Senha {editingConta && '(deixe vazio para não alterar)'}
                </label>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  required={!editingConta}
                  style={styles.input}
                  placeholder=""
                />
              </div>
            </div>

            <div style={styles.inputRow}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>M?ximo de Slots</label>
                <input
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
                <label style={styles.label}>Data de Expira??o</label>
                <input
                  type="date"
                  value={novoDataExpiracao}
                  onChange={(e) => setNovoDataExpiracao(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Status</label>
              <select
                value={novoIsAtivo ? 'true' : 'false'}
                onChange={(e) => setNovoIsAtivo(e.target.value === 'true')}
                style={styles.input}
              >
                <option value="true">? Ativa</option>
                <option value="false">? Inativa</option>
              </select>
            </div>

            <div style={styles.formActions}>
              <button type="button" onClick={resetForm} style={styles.cancelButton}>
                Cancelar
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
            <label style={styles.label}>Buscar por Produto ou Login</label>
            <input
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
        <div style={styles.statCard}>
          <div style={styles.statIcon}></div>
          <div>
            <p style={styles.statLabel}>Contas (Filtro)</p>
            <h3 style={styles.statValue}>{filteredContas.length}</h3>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#d1fae5', color: '#065f46' }}></div>
          <div>
            <p style={styles.statLabel}>Ativas</p>
            <h3 style={styles.statValue}>{filteredContas.filter((c) => c.is_ativo).length}</h3>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#fee2e2', color: '#991b1b' }}>⏳</div>
          <div>
            <p style={styles.statLabel}>Próximas de Expirar</p>
            <h3 style={styles.statValue}>{filteredContas.filter((c) => (c.dias_restantes ?? 999) <= 7).length}</h3>
          </div>
        </div>
      </div>

      <div style={styles.estoqueGrid}>
        {filteredContas.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}></span>
            <h3 style={styles.emptyTitle}>Nenhuma conta encontrada</h3>
            <p style={styles.emptyText}>Cadastre novas contas ou ajuste os filtros.</p>
          </div>
        ) : (
          filteredContas.map((conta) => {
            let expLabel: string | null = null;
            let expStyle: React.CSSProperties = {};

            if (conta.dias_restantes !== null && conta.dias_restantes !== undefined) {
              if (conta.dias_restantes < 0) {
                expLabel = `️ Expirou há ${-conta.dias_restantes} dias`;
                expStyle = styles.badgeInactive;
              } else if (conta.dias_restantes <= 7) {
                expLabel = `️ Expira em ${conta.dias_restantes} dias`;
                expStyle = styles.badgeWarning;
              } else {
                expLabel = `️ Expira em ${conta.dias_restantes} dias`;
                expStyle = styles.badgeInfo;
              }
            }

            return (
              <div
                key={conta.id}
                style={{
                  ...styles.estoqueCard,
                  borderColor: conta.is_ativo ? '#e5e7eb' : '#ef4444',
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
                      {conta.is_ativo ? ' Ativa' : ' Inativa'}
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
                    onClick={() => handleOpenDetails(conta.id)}
                    style={{ ...styles.actionBtn, ...styles.detailsBtn }}
                  >
                    ️ Detalhes
                  </button>
                  <button
                    onClick={() => handleEdit(conta)}
                    style={{ ...styles.actionBtn, ...styles.editBtn }}
                  >
                    ️ Editar
                  </button>
                  <button
                    onClick={() => setDeletingConta(conta)}
                    style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                  >
                    ️ Excluir
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedConta && (
        <div style={styles.modalOverlay} onClick={() => setSelectedConta(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Conta Mãe</h3>
              <button onClick={() => setSelectedConta(null)} style={styles.modalClose}></button>
            </div>

            {isLoadingDetails ? (
              <div style={styles.loadingContainer}>
                <div style={styles.spinner} />
                <p style={styles.loadingText}>Carregando detalhes...</p>
              </div>
            ) : (
              <div style={styles.modalBody}>
                <div style={styles.infoGrid}>
                  <div style={styles.infoBox}>
                    <span style={styles.infoLabel}>Login</span>
                    <div style={styles.copyBox} onClick={() => copyToClipboard(selectedConta.login)}>
                      <span style={styles.infoValue}>{selectedConta.login}</span>
                      <button style={styles.copyButton}></button>
                    </div>
                  </div>
                  <div style={styles.infoBox}>
                    <span style={styles.infoLabel}>Senha</span>
                    <div style={styles.copyBox} onClick={() => copyToClipboard(selectedConta.senha || '')}>
                      <span style={styles.infoValue}>{selectedConta.senha || '-'}</span>
                      <button style={styles.copyButton}></button>
                    </div>
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
                  <h4 style={styles.sectionTitle}>Adicionar Email Convidado</h4>
                  {isSlotsFull && (
                    <p style={styles.warningText}>Esta conta j? atingiu o m?ximo de slots.</p>
                  )}
                  <div style={styles.inviteRow}>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="email@cliente.com"
                      style={styles.input}
                      disabled={isSlotsFull}
                    />
                    <button onClick={handleAddInvite} style={styles.submitButton} disabled={isSlotsFull}>
                      Adicionar
                    </button>
                  </div>
                </div>

                <div style={styles.inviteList}>
                  <h4 style={styles.sectionTitle}>Emails atribuídos</h4>
                  {selectedConta.convites.length === 0 ? (
                    <p style={styles.emptyText}>Nenhum convite registrado.</p>
                  ) : (
                    <div style={styles.inviteTable}>
                      {selectedConta.convites.map((convite) => (
                        <div key={convite.id} style={styles.inviteItem}>
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
        <div style={styles.modalOverlay} onClick={() => setDeletingConta(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>️ Confirmar Exclusão</h3>
              <button onClick={() => setDeletingConta(null)} style={styles.modalClose}></button>
            </div>
            <div style={styles.modalBody}>
              <p style={styles.modalText}>
                Tem certeza que deseja excluir a conta <strong>{deletingConta.login}</strong>?
              </p>
              <div style={styles.warningBox}>
                <span style={styles.warningIcon}>️</span>
                <p style={styles.warningText}>
                  Esta ação não pode ser desfeita. Os convites vinculados serão removidos.
                </p>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setDeletingConta(null)} style={styles.modalCancelBtn}>
                Cancelar
              </button>
              <button onClick={handleDelete} style={styles.modalDeleteBtn}>
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
  spinner: { width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { fontSize: '16px', color: '#6b7280' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' },
  title: { margin: '0 0 4px 0', fontSize: '28px', fontWeight: 700, color: '#1a1d29' },
  subtitle: { margin: 0, fontSize: '15px', color: '#6b7280' },
  addButton: { padding: '12px 24px', fontSize: '14px', fontWeight: 600, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  alert: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', marginBottom: '24px' },
  alertIcon: { fontSize: '18px' },
  formCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  formTitle: { margin: '0 0 20px 0', fontSize: '18px', fontWeight: 700, color: '#1a1d29' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: 600, color: '#374151' },
  input: { padding: '12px 16px', fontSize: '15px', border: '2px solid #e5e7eb', borderRadius: '8px', outline: 'none', width: '100%', fontFamily: 'inherit' },
  inputHint: { fontSize: '12px', color: '#6b7280', fontStyle: 'italic' },
  formActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  cancelButton: { padding: '12px 24px', fontSize: '14px', fontWeight: 600, backgroundColor: '#f5f7fa', color: '#1a1d29', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  submitButton: { padding: '12px 24px', fontSize: '14px', fontWeight: 600, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  filterContainer: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  filterTitle: { margin: '0 0 20px 0', fontSize: '18px', fontWeight: 700, color: '#1a1d29' },
  filterInputs: { display: 'grid', gridTemplateColumns: '1fr', gap: '16px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' },
  statCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  statIcon: { width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#f5f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' },
  statLabel: { margin: '0 0 4px 0', fontSize: '13px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statValue: { margin: 0, fontSize: '24px', fontWeight: 700, color: '#1a1d29' },
  estoqueGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' },
  estoqueCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '2px solid', transition: 'all 0.2s ease' },
  cardHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' },
  cardTitle: { margin: 0, fontSize: '16px', fontWeight: 600, color: '#1a1d29', flex: 1 },
  badges: { display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' },
  badge: { padding: '4px 10px', fontSize: '11px', fontWeight: 600, borderRadius: '6px', whiteSpace: 'nowrap' },
  badgeActive: { backgroundColor: '#d1fae5', color: '#065f46' },
  badgeInactive: { backgroundColor: '#fee2e2', color: '#991b1b' },
  badgeWarning: { backgroundColor: '#fef3c7', color: '#92400e' },
  badgeInfo: { backgroundColor: '#dbeafe', color: '#1e40af' },
  cardInfo: { display: 'flex', justifyContent: 'space-between', marginBottom: '16px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' },
  infoLabel: { fontSize: '13px', color: '#6b7280', fontWeight: 500 },
  infoValue: { fontSize: '13px', color: '#1a1d29', fontWeight: 600 },
  cardFooter: { paddingTop: '12px', borderTop: '1px solid #e5e7eb', marginBottom: '12px' },
  cardId: { fontSize: '11px', color: '#9ca3af' },
  actionButtons: { display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' },
  actionBtn: { flex: 1, padding: '10px 16px', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' },
  detailsBtn: { backgroundColor: '#e0f2fe', color: '#0369a1' },
  editBtn: { backgroundColor: '#dbeafe', color: '#1e40af' },
  deleteBtn: { backgroundColor: '#fee2e2', color: '#991b1b' },
  emptyState: { gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '16px' },
  emptyIcon: { fontSize: '64px', opacity: 0.5 },
  emptyTitle: { margin: 0, fontSize: '20px', color: '#1a1d29' },
  emptyText: { margin: 0, fontSize: '14px', color: '#6b7280' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' },
  modal: { backgroundColor: '#fff', borderRadius: '16px', maxWidth: '720px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalHeader: { padding: '24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { margin: 0, fontSize: '20px', fontWeight: 700 },
  modalClose: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', padding: '4px', color: '#6b7280' },
  modalBody: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' },
  infoBox: { display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '10px' },
  inviteSection: { backgroundColor: '#f9fafb', borderRadius: '12px', padding: '16px' },
  sectionTitle: { margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700, color: '#1a1d29' },
  inviteRow: { display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center' },
  inviteList: { backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px' },
  inviteTable: { display: 'flex', flexDirection: 'column', gap: '8px' },
  inviteItem: { display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 12px', backgroundColor: '#f9fafb', borderRadius: '8px' },
  inviteEmail: { fontWeight: 600, color: '#1a1d29' },
  inviteDate: { fontSize: '12px', color: '#6b7280' },
  copyBox: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '8px 12px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' },
  copyButton: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' },
  modalText: { margin: '0 0 16px 0', fontSize: '16px', color: '#1a1d29', lineHeight: 1.5 },
  warningBox: { display: 'flex', gap: '12px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' },
  warningIcon: { fontSize: '20px' },
  warningText: { margin: 0, fontSize: '14px', color: '#78350f', lineHeight: 1.5 },
  modalFooter: { padding: '24px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  modalCancelBtn: { padding: '12px 24px', fontSize: '14px', fontWeight: 600, backgroundColor: '#f5f7fa', color: '#1a1d29', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  modalDeleteBtn: { padding: '12px 24px', fontSize: '14px', fontWeight: 600, backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
};
