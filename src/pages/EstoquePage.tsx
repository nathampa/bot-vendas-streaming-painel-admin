import { useState, useEffect } from 'react';
import { getAdminEstoque, getAdminProdutos, createEstoque, updateEstoque, deleteEstoque } from '../services/apiClient';

interface IEstoque {
  id: string;
  produto_id: string;
  login: string;
  max_slots: number;
  slots_ocupados: number;
  is_ativo: boolean;
  requer_atencao: boolean;
}

interface IProduto {
  id: string;
  nome: string;
}

export const EstoquePage = () => {
  const [estoque, setEstoque] = useState<IEstoque[]>([]);
  const [produtos, setProdutos] = useState<IProduto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEstoque, setEditingEstoque] = useState<IEstoque | null>(null);
  const [deletingEstoque, setDeletingEstoque] = useState<IEstoque | null>(null);

  // Form states
  const [selectedProdutoId, setSelectedProdutoId] = useState('');
  const [novoLogin, setNovoLogin] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [novoMaxSlots, setNovoMaxSlots] = useState(2);
  const [novoIsAtivo, setNovoIsAtivo] = useState(true);

  const carregarDados = async () => {
    setIsLoading(true);
    try {
      const [estoqueRes, produtosRes] = await Promise.all([
        getAdminEstoque(),
        getAdminProdutos()
      ]);
      setEstoque(estoqueRes.data);
      setProdutos(produtosRes.data);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      setError("Falha ao carregar dados.");
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
    setNovoMaxSlots(2);
    setNovoIsAtivo(true);
    setEditingEstoque(null);
    setShowForm(false);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProdutoId) {
      alert("⚠️ Por favor, selecione um produto.");
      return;
    }

    const data: any = {
      produto_id: selectedProdutoId,
      login: novoLogin,
      max_slots: novoMaxSlots,
      is_ativo: novoIsAtivo,
    };

    // Apenas incluir senha se foi preenchida
    if (novaSenha) {
      data.senha = novaSenha;
    }

    try {
      if (editingEstoque) {
        await updateEstoque(editingEstoque.id, data);
        alert("✅ Conta atualizada com sucesso!");
      } else {
        if (!novaSenha) {
          alert("⚠️ A senha é obrigatória ao criar nova conta.");
          return;
        }
        await createEstoque(data);
        alert("✅ Conta adicionada ao estoque com sucesso!");
      }
      resetForm();
      carregarDados();
    } catch (err: any) {
      console.error("Erro ao salvar estoque:", err);
      const errorMsg = err.response?.data?.detail || "Falha ao salvar estoque.";
      alert(`❌ Erro: ${errorMsg}`);
    }
  };

  const handleEdit = (item: IEstoque) => {
    setEditingEstoque(item);
    setSelectedProdutoId(item.produto_id);
    setNovoLogin(item.login);
    setNovaSenha(''); // Não pré-preencher senha por segurança
    setNovoMaxSlots(item.max_slots);
    setNovoIsAtivo(item.is_ativo);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deletingEstoque) return;

    try {
      await deleteEstoque(deletingEstoque.id);
      alert("✅ Conta excluída com sucesso!");
      setDeletingEstoque(null);
      carregarDados();
    } catch (err: any) {
      console.error("Erro ao excluir estoque:", err);
      const errorMsg = err.response?.data?.detail || "Falha ao excluir conta.";
      alert(`❌ ${errorMsg}`);
      setDeletingEstoque(null);
    }
  };

  const getProdutoNome = (produtoId: string): string => {
    const produto = produtos.find(p => p.id === produtoId);
    return produto ? produto.nome : 'Produto Desconhecido';
  };

  const getSlotPercentage = (ocupados: number, max: number): number => {
    return (ocupados / max) * 100;
  };

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Carregando estoque...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📦 Estoque</h1>
          <p style={styles.subtitle}>Gerencie as contas disponíveis para venda</p>
        </div>
        <button onClick={() => showForm ? resetForm() : setShowForm(true)} style={styles.addButton}>
          {showForm ? '✕ Cancelar' : '➕ Abastecer Estoque'}
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={styles.alert}>
          <span style={styles.alertIcon}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>
            {editingEstoque ? '✏️ Editar Conta' : '➕ Adicionar Nova Conta ao Estoque'}
          </h3>
          <form onSubmit={handleCreateOrUpdate} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Produto</label>
              <select
                value={selectedProdutoId}
                onChange={(e) => setSelectedProdutoId(e.target.value)}
                required
                disabled={!!editingEstoque}
                style={{...styles.input, opacity: editingEstoque ? 0.6 : 1}}
              >
                <option value="">-- Selecione um Produto --</option>
                {produtos.map((produto) => (
                  <option key={produto.id} value={produto.id}>
                    {produto.nome}
                  </option>
                ))}
              </select>
              {editingEstoque && (
                <small style={styles.inputHint}>
                  O produto não pode ser alterado após criação
                </small>
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
                  Senha {editingEstoque && '(deixe vazio para não alterar)'}
                </label>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  required={!editingEstoque}
                  style={styles.input}
                  placeholder="••••••••"
                />
                {editingEstoque && (
                  <small style={styles.inputHint}>
                    Preencha apenas se quiser alterar a senha
                  </small>
                )}
              </div>
            </div>

            <div style={styles.inputRow}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Máximo de Slots (Usuários)</label>
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
                <label style={styles.label}>Status</label>
                <select
                  value={novoIsAtivo ? 'true' : 'false'}
                  onChange={(e) => setNovoIsAtivo(e.target.value === 'true')}
                  style={styles.input}
                >
                  <option value="true">✓ Ativo</option>
                  <option value="false">✕ Inativo</option>
                </select>
              </div>
            </div>

            <div style={styles.formActions}>
              <button type="button" onClick={resetForm} style={styles.cancelButton}>
                Cancelar
              </button>
              <button type="submit" style={styles.submitButton}>
                {editingEstoque ? 'Salvar Alterações' : 'Adicionar ao Estoque'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📊</div>
          <div>
            <p style={styles.statLabel}>Total de Contas</p>
            <h3 style={styles.statValue}>{estoque.length}</h3>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIcon, backgroundColor: '#d1fae5', color: '#065f46'}}>✓</div>
          <div>
            <p style={styles.statLabel}>Contas Ativas</p>
            <h3 style={styles.statValue}>{estoque.filter(e => e.is_ativo).length}</h3>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIcon, backgroundColor: '#fee2e2', color: '#991b1b'}}>⚠</div>
          <div>
            <p style={styles.statLabel}>Requer Atenção</p>
            <h3 style={styles.statValue}>{estoque.filter(e => e.requer_atencao).length}</h3>
          </div>
        </div>
      </div>

      {/* Estoque Grid */}
      <div style={styles.estoqueGrid}>
        {estoque.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>📦</span>
            <h3 style={styles.emptyTitle}>Nenhuma conta em estoque</h3>
            <p style={styles.emptyText}>Comece adicionando contas para venda</p>
          </div>
        ) : (
          estoque.map((item) => {
            const percentage = getSlotPercentage(item.slots_ocupados, item.max_slots);
            const isFull = percentage >= 100;
            const isAlmostFull = percentage >= 80;

            return (
              <div
                key={item.id}
                style={{
                  ...styles.estoqueCard,
                  borderColor: item.requer_atencao ? '#f59e0b' : (isFull ? '#ef4444' : '#e5e7eb')
                }}
              >
                {/* Header */}
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>{getProdutoNome(item.produto_id)}</h3>
                  <div style={styles.badges}>
                    {item.requer_atencao && (
                      <span style={{...styles.badge, ...styles.badgeWarning}}>
                        ⚠ Atenção
                      </span>
                    )}
                    <span style={{
                      ...styles.badge,
                      ...(item.is_ativo ? styles.badgeActive : styles.badgeInactive)
                    }}>
                      {item.is_ativo ? '✓ Ativo' : '✕ Inativo'}
                    </span>
                  </div>
                </div>

                {/* Login */}
                <div style={styles.cardInfo}>
                  <span style={styles.infoLabel}>Login:</span>
                  <span style={styles.infoValue}>{item.login}</span>
                </div>

                {/* Slots Progress */}
                <div style={styles.slotsSection}>
                  <div style={styles.slotsHeader}>
                    <span style={styles.slotsLabel}>Slots Ocupados</span>
                    <span style={styles.slotsCount}>
                      {item.slots_ocupados} / {item.max_slots}
                    </span>
                  </div>
                  <div style={styles.progressBar}>
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${percentage}%`,
                        backgroundColor: isFull ? '#ef4444' : (isAlmostFull ? '#f59e0b' : '#10b981')
                      }}
                    />
                  </div>
                  <span style={{
                    ...styles.progressPercent,
                    color: isFull ? '#ef4444' : (isAlmostFull ? '#f59e0b' : '#10b981')
                  }}>
                    {percentage.toFixed(0)}% ocupado
                  </span>
                </div>

                {/* Footer */}
                <div style={styles.cardFooter}>
                  <span style={styles.cardId}>ID: {item.id.substring(0, 8)}...</span>
                </div>

                {/* Action Buttons */}
                <div style={styles.actionButtons}>
                  <button
                    onClick={() => handleEdit(item)}
                    style={{...styles.actionBtn, ...styles.editBtn}}
                    title="Editar conta"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => setDeletingEstoque(item)}
                    style={{...styles.actionBtn, ...styles.deleteBtn}}
                    title="Excluir conta"
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingEstoque && (
        <div style={styles.modalOverlay} onClick={() => setDeletingEstoque(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>⚠️ Confirmar Exclusão</h3>
              <button onClick={() => setDeletingEstoque(null)} style={styles.modalClose}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <p style={styles.modalText}>
                Tem certeza que deseja excluir a conta <strong>"{deletingEstoque.login}"</strong>?
              </p>
              <div style={styles.warningBox}>
                <span style={styles.warningIcon}>ℹ️</span>
                <div>
                  <p style={styles.warningText}>
                    Esta ação não pode ser desfeita. A conta será removida permanentemente do estoque.
                  </p>
                  {deletingEstoque.slots_ocupados > 0 && (
                    <p style={{...styles.warningText, fontWeight: 600, marginTop: '8px'}}>
                      ⚠️ <strong>ATENÇÃO:</strong> Esta conta tem {deletingEstoque.slots_ocupados} slot(s) ocupado(s)!
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setDeletingEstoque(null)} style={styles.modalCancelBtn}>
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
  cardInfo: { display: 'flex', justifyContent: 'space-between', marginBottom: '16px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' },
  infoLabel: { fontSize: '13px', color: '#6b7280', fontWeight: 500 },
  infoValue: { fontSize: '13px', color: '#1a1d29', fontWeight: 600 },
  slotsSection: { marginBottom: '16px' },
  slotsHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  slotsLabel: { fontSize: '13px', color: '#6b7280', fontWeight: 500 },
  slotsCount: { fontSize: '13px', color: '#1a1d29', fontWeight: 700 },
  progressBar: { width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden', marginBottom: '6px' },
  progressFill: { height: '100%', transition: 'all 0.3s ease', borderRadius: '4px' },
  progressPercent: { fontSize: '12px', fontWeight: 600 },
  cardFooter: { paddingTop: '12px', borderTop: '1px solid #e5e7eb', marginBottom: '12px' },
  cardId: { fontSize: '11px', color: '#9ca3af' },
  actionButtons: { display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' },
  actionBtn: { flex: 1, padding: '10px 16px', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' },
  editBtn: { backgroundColor: '#dbeafe', color: '#1e40af' },
  deleteBtn: { backgroundColor: '#fee2e2', color: '#991b1b' },
  emptyState: { gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '16px' },
  emptyIcon: { fontSize: '64px', opacity: 0.5 },
  emptyTitle: { margin: 0, fontSize: '20px', color: '#1a1d29' },
  emptyText: { margin: 0, fontSize: '14px', color: '#6b7280' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' },
  modal: { backgroundColor: '#fff', borderRadius: '16px', maxWidth: '500px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalHeader: { padding: '24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { margin: 0, fontSize: '20px', fontWeight: 700 },
  modalClose: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', padding: '4px', color: '#6b7280' },
  modalBody: { padding: '24px' },
  modalText: { margin: '0 0 16px 0', fontSize: '16px', color: '#1a1d29', lineHeight: 1.5 },
  warningBox: { display: 'flex', gap: '12px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' },
  warningIcon: { fontSize: '20px' },
  warningText: { margin: 0, fontSize: '14px', color: '#78350f', lineHeight: 1.5 },
  modalFooter: { padding: '24px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  modalCancelBtn: { padding: '12px 24px', fontSize: '14px', fontWeight: 600, backgroundColor: '#f5f7fa', color: '#1a1d29', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  modalDeleteBtn: { padding: '12px 24px', fontSize: '14px', fontWeight: 600, backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
};