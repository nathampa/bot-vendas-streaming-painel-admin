import { useState, useEffect } from 'react';
import { getAdminEstoque, getAdminProdutos, createEstoque, updateEstoque, deleteEstoque } from '../services/apiClient';
import { useToast } from '../contexts/ToastContext';
import { getApiErrorMessage } from '../utils/errors';

interface IEstoque {
  id: string;
  produto_id: string;
  login: string;
  max_slots: number;
  slots_ocupados: number;
  is_ativo: boolean;
  requer_atencao: boolean;
  data_expiracao: string | null;
  dias_restantes: number | null;
  instrucoes_especificas: string | null;
}

interface IProduto {
  id: string;
  nome: string;
}

type FilterStatus = 'todos' | 'ativos' | 'inativos' | 'atencao';

export const EstoquePage = () => {
  const { showToast } = useToast();
  const [estoque, setEstoque] = useState<IEstoque[]>([]);
  const [produtos, setProdutos] = useState<IProduto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEstoque, setEditingEstoque] = useState<IEstoque | null>(null);
  const [deletingEstoque, setDeletingEstoque] = useState<IEstoque | null>(null);
  const [resolvingEstoque, setResolvingEstoque] = useState<IEstoque | null>(null);

  // Removido: filterProdutoId
  const [filterTerm, setFilterTerm] = useState<string>(''); // Novo campo de filtro por nome/login
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');

  // Form states (mantidos)
  const [selectedProdutoId, setSelectedProdutoId] = useState('');
  const [novoLogin, setNovoLogin] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [novoMaxSlots, setNovoMaxSlots] = useState(2);
  const [novoIsAtivo, setNovoIsAtivo] = useState(true);
  const [novoDataExpiracao, setNovoDataExpiracao] = useState('');
  const [novasInstrucoes, setNovasInstrucoes] = useState('');

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
    setNovoDataExpiracao('');
    setNovasInstrucoes('');
    setEditingEstoque(null);
    setShowForm(false);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProdutoId) {
      showToast('Por favor, selecione um produto.', 'warning');
      return;
    }

    const data = {
      produto_id: selectedProdutoId,
      login: novoLogin,
      senha: novaSenha,
      max_slots: novoMaxSlots,
      is_ativo: novoIsAtivo,
      data_expiracao: novoDataExpiracao || null,
      instrucoes_especificas: novasInstrucoes || null,
    };

    try {
      if (editingEstoque) {
        const updateData = {
          login: novoLogin,
          max_slots: novoMaxSlots,
          is_ativo: novoIsAtivo,
          data_expiracao: novoDataExpiracao || null,
          instrucoes_especificas: novasInstrucoes || null,
          ...(novaSenha && { senha: novaSenha }) 
        };
        await updateEstoque(editingEstoque.id, updateData);
        showToast('Conta atualizada com sucesso!', 'success');
      } else {
        if (!novaSenha) {
          showToast('A senha e obrigatoria ao criar nova conta.', 'warning');
          return;
        }
        await createEstoque(data);
        showToast('Conta adicionada ao estoque com sucesso!', 'success');
      }
      resetForm();
      carregarDados();
    } catch (err: unknown) {
      console.error("Erro ao salvar estoque:", err);
      const errorMsg = getApiErrorMessage(err, "Falha ao salvar estoque.");
      showToast(errorMsg, 'error');
    }
  };

  const handleEdit = (item: IEstoque) => {
    setEditingEstoque(item);
    setSelectedProdutoId(item.produto_id);
    setNovoLogin(item.login);
    setNovaSenha(''); 
    setNovoMaxSlots(item.max_slots);
    setNovoIsAtivo(item.is_ativo);
    setNovoDataExpiracao(item.data_expiracao || '');
    setNovasInstrucoes(item.instrucoes_especificas || '');
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deletingEstoque) return;

    try {
      await deleteEstoque(deletingEstoque.id);
      showToast('Conta excluida com sucesso!', 'success');
      setDeletingEstoque(null);
      carregarDados();
    } catch (err: unknown) {
      console.error("Erro ao excluir estoque:", err);
      const errorMsg = getApiErrorMessage(err, "Falha ao excluir conta.");
      showToast(errorMsg, 'error');
      setDeletingEstoque(null);
    }
  };

  const handleMarkAsResolved = async () => {
    if (!resolvingEstoque) return;

    try {
      await updateEstoque(resolvingEstoque.id, { requer_atencao: false });
      showToast('Conta marcada como resolvida!', 'success');
      setResolvingEstoque(null);
      carregarDados();
    } catch (err: unknown) {
      console.error("Erro ao marcar como resolvido:", err);
      const errorMsg = getApiErrorMessage(err, "Falha ao atualizar conta.");
      showToast(errorMsg, 'error');
    }
  };
  const getProdutoNome = (produtoId: string): string => {
    const produto = produtos.find(p => p.id === produtoId);
    return produto ? produto.nome : 'Produto Desconhecido';
  };

  const getSlotPercentage = (ocupados: number, max: number): number => {
    if (max === 0) return 0;
    return (ocupados / max) * 100;
  };

  // Lógica de Filtro ATUALIZADA
  const filteredEstoque = estoque.filter(item => {
    // 1. Filtro por Termo de Busca (Nome do Produto ou Login)
    const term = filterTerm.toLowerCase().trim();
    let matchesSearch = true;

    if (term) {
      const produtoNome = getProdutoNome(item.produto_id).toLowerCase();
      const login = item.login.toLowerCase();

      // Corresponde se o termo estiver no nome do produto OU no login da conta
      if (!produtoNome.includes(term) && !login.includes(term)) {
        matchesSearch = false;
      }
    }

    // 2. Filtro por Status
    let matchesStatus = true;
    if (filterStatus === 'ativos') {
      matchesStatus = item.is_ativo && !item.requer_atencao;
    } else if (filterStatus === 'inativos') {
      matchesStatus = !item.is_ativo;
    } else if (filterStatus === 'atencao') {
      matchesStatus = item.requer_atencao;
    }

    return matchesSearch && matchesStatus;
  });

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
        <button type="button" onClick={() => showForm ? resetForm() : setShowForm(true)} style={styles.addButton}>
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
              <label htmlFor="estoque-produto" style={styles.label}>
                Produto
              </label>
              <select
                id="estoque-produto"
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
                <label htmlFor="estoque-login" style={styles.label}>
                  Login (Email)
                </label>
                <input
                  id="estoque-login"
                  type="text"
                  value={novoLogin}
                  onChange={(e) => setNovoLogin(e.target.value)}
                  required
                  style={styles.input}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div style={styles.inputGroup}>
                <label htmlFor="estoque-senha" style={styles.label}>
                  Senha {editingEstoque && '(deixe vazio para não alterar)'}
                </label>
                <input
                  id="estoque-senha"
                  type="text"
                  autoComplete="off"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  required={!editingEstoque}
                  style={styles.input}
                  placeholder="Digite a senha em texto"
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
                <label htmlFor="estoque-max-slots" style={styles.label}>
                  Máximo de Slots (Usuários)
                </label>
                <input
                  id="estoque-max-slots"
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
                <label htmlFor="estoque-data-expiracao" style={styles.label}>
                  Data de Expiração (Opcional)
                </label>
                <input
                  id="estoque-data-expiracao"
                  type="date"
                  value={novoDataExpiracao}
                  onChange={(e) => setNovoDataExpiracao(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="estoque-instrucoes" style={styles.label}>
                Instruções Específicas desta Conta (Opcional)
              </label>
              <textarea
                id="estoque-instrucoes"
                value={novasInstrucoes}
                onChange={(e) => setNovasInstrucoes(e.target.value)}
                style={{...styles.input, minHeight: '60px', resize: 'vertical'} as React.CSSProperties}
                placeholder="Ex: Use apenas o Perfil 4 com PIN 1234. Não altere nada."
              />
              <small style={styles.inputHint}>
                Isso aparecerá para o cliente junto com as instruções gerais do produto.
              </small>
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="estoque-status" style={styles.label}>
                Status
              </label>
              <select
                id="estoque-status"
                value={novoIsAtivo ? 'true' : 'false'}
                onChange={(e) => setNovoIsAtivo(e.target.value === 'true')}
                style={styles.input}
              >
                <option value="true">✓ Ativo</option>
                <option value="false">✕ Inativo</option>
              </select>
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

      {/* Filter Section - UI ATUALIZADA */}
      <div style={styles.filterContainer}>
        <h3 style={styles.filterTitle}>Filtrar Estoque</h3>
        <div style={styles.filterInputs}>
          
          <div style={styles.inputGroup}>
            <label htmlFor="estoque-filtro" style={styles.label}>
              Buscar Conta (Nome do Produto ou Login)
            </label>
            <input
              id="estoque-filtro"
              type="text"
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              style={styles.input}
              placeholder="Ex: Netflix ou conta@email.com"
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="estoque-filtro-status" style={styles.label}>
              Por Status
            </label>
            <select
              id="estoque-filtro-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              style={styles.input}
            >
              <option value="todos">-- Todos os Status --</option>
              <option value="ativos">✓ Ativos (Prontos p/ Venda)</option>
              <option value="atencao">⚠ Requer Atenção</option>
              <option value="inativos">✕ Inativos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📊</div>
          <div>
            <p style={styles.statLabel}>Contas (Filtro)</p>
            <h3 style={styles.statValue}>{filteredEstoque.length}</h3>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIcon, backgroundColor: '#d1fae5', color: '#065f46'}}>✓</div>
          <div>
            <p style={styles.statLabel}>Prontas p/ Venda</p>
            <h3 style={styles.statValue}>{filteredEstoque.filter(e => e.is_ativo && !e.requer_atencao).length}</h3>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIcon, backgroundColor: '#fee2e2', color: '#991b1b'}}>⚠</div>
          <div>
            <p style={styles.statLabel}>Requer Atenção</p>
            <h3 style={styles.statValue}>{filteredEstoque.filter(e => e.requer_atencao).length}</h3>
          </div>
        </div>
      </div>

      {/* Estoque Grid */}
      <div style={styles.estoqueGrid}>
        {filteredEstoque.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>📦</span>
            <h3 style={styles.emptyTitle}>Nenhuma conta encontrada</h3>
            <p style={styles.emptyText}>Tente ajustar os filtros ou adicione novas contas.</p>
          </div>
        ) : (
          filteredEstoque.map((item) => {
            const percentage = getSlotPercentage(item.slots_ocupados, item.max_slots);
            const isFull = percentage >= 100;
            const isAlmostFull = percentage >= 80;

            const { dias_restantes } = item;
            let expLabel: string | null = null;
            let expStyle: React.CSSProperties = {};

            if (dias_restantes !== null && dias_restantes !== undefined) {
              if (dias_restantes < 0) {
                expLabel = `🗓️ Expirou há ${-dias_restantes} dias`;
                expStyle = styles.badgeInactive;
              } else if (dias_restantes <= 7) {
                expLabel = `🗓️ Expira em ${dias_restantes} dias`;
                expStyle = styles.badgeWarning;
              } else {
                expLabel = `🗓️ Expira em ${dias_restantes} dias`;
                expStyle = styles.badgeInfo;
              }
            }

            return (
              <div
                key={item.id}
                style={{
                  ...styles.estoqueCard,
                  borderColor: item.requer_atencao ? '#f59e0b' : (isFull ? '#ef4444' : 'var(--border-subtle)')
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
                    {expLabel && (
                      <span style={{...styles.badge, ...expStyle}}>
                        {expLabel}
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

                {/* Instructions Indicator (Icon) */}
                {item.instrucoes_especificas && (
                  <div style={styles.instructionsIndicator}>
                    <span style={{fontSize: '12px', color: '#1e40af'}}>📝 Possui instruções específicas</span>
                  </div>
                )}

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
                  {item.requer_atencao && (
                    <button
                      type="button"
                      onClick={() => setResolvingEstoque(item)}
                      style={{...styles.actionBtn, ...styles.resolveBtn}}
                      title="Marcar como resolvido"
                    >
                      ✓ Resolver
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleEdit(item)}
                    style={{...styles.actionBtn, ...styles.editBtn}}
                    title="Editar conta"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    type="button"
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
          <div style={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>⚠️ Confirmar Exclusão</h3>
              <button
                type="button"
                onClick={() => setDeletingEstoque(null)}
                style={styles.modalClose}
                aria-label="Fechar confirmacao de exclusao"
              >
                x
              </button>
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
              <button type="button" onClick={() => setDeletingEstoque(null)} style={styles.modalCancelBtn}>
                Cancelar
              </button>
              <button type="button" onClick={handleDelete} style={styles.modalDeleteBtn}>
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {resolvingEstoque && (
        <div style={styles.modalOverlay} onClick={() => setResolvingEstoque(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Confirmar Resolucao</h3>
              <button
                type="button"
                onClick={() => setResolvingEstoque(null)}
                style={styles.modalClose}
                aria-label="Fechar confirmacao de resolucao"
              >
                x
              </button>
            </div>
            <div style={styles.modalBody}>
              <p style={styles.modalText}>
                Marcar a conta <strong>{resolvingEstoque.login}</strong> como resolvida?
              </p>
              <div style={styles.warningBox}>
                <span style={styles.warningIcon}>i</span>
                <p style={styles.warningText}>
                  A flag "Requer Atencao" sera removida e a conta volta para o fluxo normal.
                </p>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button type="button" onClick={() => setResolvingEstoque(null)} style={styles.modalCancelBtn}>
                Cancelar
              </button>
              <button type="button" onClick={handleMarkAsResolved} style={styles.resolveConfirmBtn}>
                Sim, Resolver
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
  
  filterContainer: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  filterTitle: {
    margin: '0 0 20px 0',
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-primary)'
  },
  filterInputs: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },

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
  instructionsIndicator: { marginBottom: '12px', padding: '8px', backgroundColor: '#eff6ff', borderRadius: '6px', textAlign: 'center' },
  slotsSection: { marginBottom: '16px' },
  slotsHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  slotsLabel: { fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 },
  slotsCount: { fontSize: '13px', color: 'var(--text-primary)', fontWeight: 700 },
  progressBar: { width: '100%', height: '8px', backgroundColor: 'var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', marginBottom: '6px' },
  progressFill: { height: '100%', transition: 'all 0.3s ease', borderRadius: '4px' },
  progressPercent: { fontSize: '12px', fontWeight: 600 },
  cardFooter: { paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', marginBottom: '12px' },
  cardId: { fontSize: '11px', color: 'var(--text-muted)' },
  actionButtons: { display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' },
  actionBtn: { flex: 1, padding: '10px 16px', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' },
  
  resolveBtn: {
    backgroundColor: '#d1fae5', 
    color: '#065f46',
  },
  resolveConfirmBtn: { padding: '12px 24px', fontSize: '14px', fontWeight: 600, backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },

  editBtn: { backgroundColor: '#dbeafe', color: '#1e40af' },
  deleteBtn: { backgroundColor: '#fee2e2', color: '#991b1b' },
  emptyState: { gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '16px' },
  emptyIcon: { fontSize: '64px', opacity: 0.5 },
  emptyTitle: { margin: 0, fontSize: '20px', color: 'var(--text-primary)' },
  emptyText: { margin: 0, fontSize: '14px', color: 'var(--text-secondary)' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' },
  modal: { backgroundColor: '#fff', borderRadius: '16px', maxWidth: '500px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalHeader: { padding: '24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { margin: 0, fontSize: '20px', fontWeight: 700 },
  modalClose: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', padding: '4px', color: 'var(--text-secondary)' },
  modalBody: { padding: '24px' },
  modalText: { margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-primary)', lineHeight: 1.5 },
  warningBox: { display: 'flex', gap: '12px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' },
  warningIcon: { fontSize: '20px' },
  warningText: { margin: 0, fontSize: '14px', color: '#78350f', lineHeight: 1.5 },
  modalFooter: { padding: '24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  modalCancelBtn: { padding: '12px 24px', fontSize: '14px', fontWeight: 600, backgroundColor: 'var(--surface-muted)', color: 'var(--text-primary)', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  modalDeleteBtn: { padding: '12px 24px', fontSize: '14px', fontWeight: 600, backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
};





