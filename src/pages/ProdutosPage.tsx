import { useState, useEffect, useMemo } from 'react';
import { getAdminProdutos, createProduto, updateProduto, deleteProduto } from '../services/apiClient';

// Interface do Produto
interface IProduto {
  id: string;
  nome: string;
  descricao: string;
  preco: string;
  is_ativo: boolean;
  criado_em: string;
  tipo_entrega: 'AUTOMATICA' | 'SOLICITA_EMAIL' | 'MANUAL_ADMIN';
  instrucoes_pos_compra: string | null;
}

export const ProdutosPage = () => {
  const [produtos, setProdutos] = useState<IProduto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduto | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<IProduto | null>(null);

  // States dos Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativos' | 'inativos'>('todos');

  // Form states
  const [novoNome, setNovoNome] = useState('');
  const [novoDescricao, setNovoDescricao] = useState('');
  const [novoInstrucoes, setNovoInstrucoes] = useState('');
  const [novoPreco, setNovoPreco] = useState('');
  const [novoIsAtivo, setNovoIsAtivo] = useState(true);
  const [novoTipoEntrega, setNovoTipoEntrega] = useState<'AUTOMATICA' | 'SOLICITA_EMAIL' | 'MANUAL_ADMIN'>('AUTOMATICA');

  const carregarProdutos = async () => {
    setIsLoading(true);
    try {
      const response = await getAdminProdutos();
      setProdutos(response.data);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar produtos:", err);
      setError("Falha ao carregar produtos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  const resetForm = () => {
    setNovoNome('');
    setNovoDescricao('');
    setNovoInstrucoes('');
    setNovoPreco('');
    setNovoIsAtivo(true);
    setNovoTipoEntrega('AUTOMATICA');
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      nome: novoNome,
      descricao: novoDescricao,
      instrucoes_pos_compra: novoInstrucoes,
      preco: parseFloat(novoPreco),
      is_ativo: novoIsAtivo,
      tipo_entrega: novoTipoEntrega,
    };

    try {
      if (editingProduct) {
        await updateProduto(editingProduct.id, data);
        alert("✅ Produto atualizado com sucesso!");
      } else {
        await createProduto(data);
        alert("✅ Produto criado com sucesso!");
      }
      resetForm();
      carregarProdutos(); // A API já retorna a lista ordenada
    } catch (err: any) {
      console.error("Erro ao salvar produto:", err);
      const errorMsg = err.response?.data?.detail || "Falha ao salvar produto.";
      alert(`❌ Erro: ${errorMsg}`);
    }
  };

  const handleEdit = (produto: IProduto) => {
    setEditingProduct(produto);
    setNovoNome(produto.nome);
    setNovoDescricao(produto.descricao);
    setNovoInstrucoes(produto.instrucoes_pos_compra || '');
    setNovoPreco(produto.preco);
    setNovoIsAtivo(produto.is_ativo);
    setNovoTipoEntrega(produto.tipo_entrega);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    try {
      await deleteProduto(deletingProduct.id);
      alert("✅ Produto excluído com sucesso!");
      setDeletingProduct(null);
      carregarProdutos();
    } catch (err: any) {
      console.error("Erro ao excluir produto:", err);
      const errorMsg = err.response?.data?.detail || "Falha ao excluir produto.";
      alert(`❌ ${errorMsg}`);
      setDeletingProduct(null);
    }
  };

  // Lista de produtos filtrada com base nos states de filtro
  const filteredProdutos = useMemo(() => {
    return produtos.filter(produto => {
      // Filtro de Status
      const statusMatch = (statusFilter === 'todos') ||
                        (statusFilter === 'ativos' && produto.is_ativo) ||
                        (statusFilter === 'inativos' && !produto.is_ativo);

      // Filtro de Pesquisa (pelo nome)
      const searchMatch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase());
      
      return statusMatch && searchMatch;
    });
  }, [produtos, searchTerm, statusFilter]);

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Carregando produtos...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🛍️ Produtos</h1>
          <p style={styles.subtitle}>Gerencie o catálogo de produtos disponíveis</p>
        </div>
        <button onClick={() => showForm ? resetForm() : setShowForm(true)} style={styles.addButton}>
          {showForm ? '✕ Cancelar' : '➕ Novo Produto'}
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={styles.alert}>
          <span style={styles.alertIcon}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Barra de Filtros */}
      <div style={styles.filterBar}>
        <input
          type="text"
          placeholder="Pesquisar por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.filterInput}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'todos' | 'ativos' | 'inativos')}
          style={styles.filterSelect}
        >
          <option value="todos">Todos os Status</option>
          <option value="ativos">Somente Ativos</option>
          <option value="inativos">Somente Inativos</option>
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>
            {editingProduct ? '✏️ Editar Produto' : '➕ Criar Novo Produto'}
          </h3>
          <form onSubmit={handleCreateOrUpdate} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Nome do Produto</label>
              <input
                type="text"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                required
                style={styles.input}
                placeholder="Ex: Netflix - 1 Tela"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Descrição</label>
              <textarea
                value={novoDescricao}
                onChange={(e) => setNovoDescricao(e.target.value)}
                style={{...styles.input, minHeight: '80px', resize: 'vertical'} as React.CSSProperties}
                placeholder="Descrição do produto..."
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Instruções Pós-Compra (aparece após o pagamento)</label>
              <textarea
                value={novoInstrucoes}
                onChange={(e) => setNovoInstrucoes(e.target.value)}
                style={{...styles.input, minHeight: '100px', resize: 'vertical'} as React.CSSProperties}
                placeholder="Ex: 🚫 Não altere o nome dos perfis..."
              />
            </div>

            <div style={styles.inputRow}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Preço (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={novoPreco}
                  onChange={(e) => setNovoPreco(e.target.value)}
                  required
                  style={styles.input}
                  placeholder="15.90"
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

            <div style={styles.inputGroup}>
              <label style={styles.label}>Tipo de Entrega</label>
              <select
                value={novoTipoEntrega}
                onChange={(e) => setNovoTipoEntrega(e.target.value as 'AUTOMATICA' | 'SOLICITA_EMAIL' | 'MANUAL_ADMIN')}
                style={styles.input}
              >
                <option value="AUTOMATICA">Entrega Automática (Padrão)</option>
                <option value="SOLICITA_EMAIL">Solicitar E-mail (Entrega Manual Externa)</option>
                <option value="MANUAL_ADMIN">Entrega Manual (Pelo Painel Admin)</option>
              </select>
              <small style={styles.inputHint}>
                {
                  novoTipoEntrega === 'AUTOMATICA' ? "O bot entrega a conta do estoque imediatamente." :
                  novoTipoEntrega === 'SOLICITA_EMAIL' ? "O bot pede o e-mail do cliente e avisa o admin (Ex: Canva)." :
                  "O bot avisa o admin para inserir as credenciais no painel (Ex: Contas novas)."
                }
              </small>
            </div>


            <div style={styles.formActions}>
              <button type="button" onClick={resetForm} style={styles.cancelButton}>
                Cancelar
              </button>
              <button type="submit" style={styles.submitButton}>
                {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Grid */}
      <div style={styles.productsGrid}>
        {filteredProdutos.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>📦</span>
            <h3 style={styles.emptyTitle}>
              {produtos.length === 0 ? "Nenhum produto cadastrado" : "Nenhum produto encontrado"}
            </h3>
            <p style={styles.emptyText}>
              {produtos.length === 0 ? "Comece adicionando seu primeiro produto ao catálogo" : "Tente ajustar seus filtros."}
            </p>
          </div>
        ) : (
          filteredProdutos.map((produto) => (
            <div key={produto.id} style={styles.productCard}>
              <div style={styles.productHeader}>
                <h3 style={styles.productName}>{produto.nome}</h3>
                <div style={styles.badges}>
                  <span style={{
                    ...styles.badge,
                    ...(produto.is_ativo ? styles.badgeActive : styles.badgeInactive)
                  }}>
                    {produto.is_ativo ? '✓ Ativo' : '✕ Inativo'}
                  </span>
                  <span style={{...styles.badge, ...styles.badgeEmail}}>
                    {
                      produto.tipo_entrega === 'AUTOMATICA' ? '🤖 Automático' :
                      produto.tipo_entrega === 'SOLICITA_EMAIL' ? '@ Requer Email' :
                      '👨‍💻 Entrega Manual'
                    }
                  </span>
                </div>
              </div>
              
              {produto.descricao && (
                <p style={styles.productDescription}>{produto.descricao}</p>
              )}

              {produto.instrucoes_pos_compra && (
                <div style={styles.instructionsPreview}>
                  <strong style={styles.instructionsLabel}>Instruções Pós-Compra:</strong>
                  <p style={styles.productDescription}>{produto.instrucoes_pos_compra}</p>
                </div>
              )}
              
              <div style={styles.productFooter}>
                <div style={styles.priceTag}>
                  <span style={styles.priceLabel}>Preço</span>
                  <span style={styles.priceValue}>R$ {produto.preco}</span>
                </div>
                <div style={styles.productMeta}>
                  <span style={styles.metaText}>
                    ID: {produto.id.substring(0, 8)}...
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={styles.actionButtons}>
                <button
                  onClick={() => handleEdit(produto)}
                  style={{...styles.actionBtn, ...styles.editBtn}}
                  title="Editar produto"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => setDeletingProduct(produto)}
                  style={{...styles.actionBtn, ...styles.deleteBtn}}
                  title="Excluir produto"
                >
                  🗑️ Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div style={styles.modalOverlay} onClick={() => setDeletingProduct(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>⚠️ Confirmar Exclusão</h3>
              <button onClick={() => setDeletingProduct(null)} style={styles.modalClose}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <p style={styles.modalText}>
                Tem certeza que deseja excluir o produto <strong>"{deletingProduct.nome}"</strong>?
              </p>
              <div style={styles.warningBox}>
                <span style={styles.warningIcon}>ℹ️</span>
                <p style={styles.warningText}>
                  Esta ação não pode ser desfeita. O produto será removido permanentemente do catálogo.
                </p>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setDeletingProduct(null)} style={styles.modalCancelBtn}>
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

// Objeto de estilos completo (incluindo os novos filtros)
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
  
  // Estilos dos Filtros
  filterBar: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  filterInput: {
    flex: 2,
    padding: '12px 16px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    width: '100%',
  },
  filterSelect: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#fff',
    outline: 'none',
    width: '100%',
  },
  
  // Estilos do Formulário
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

  // Estilos dos Cards de Produto
  productsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  productCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '2px solid transparent' },
  productHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px', gap: '12px' },
  productName: { margin: 0, fontSize: '18px', fontWeight: 600, color: '#1a1d29', flex: 1 },
  badges: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  badge: { padding: '4px 10px', fontSize: '12px', fontWeight: 600, borderRadius: '6px', whiteSpace: 'nowrap' },
  badgeActive: { backgroundColor: '#d1fae5', color: '#065f46' },
  badgeInactive: { backgroundColor: '#fee2e2', color: '#991b1b' },
  badgeEmail: { backgroundColor: '#dbeafe', color: '#1e40af' },
  productDescription: { margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280', lineHeight: 1.5 },
  instructionsPreview: { 
    margin: '0 0 16px 0', 
    padding: '12px', 
    backgroundColor: '#f9fafb', 
    borderRadius: '8px' 
  },
  instructionsLabel: { 
    fontSize: '12px', 
    color: '#374151', 
    fontWeight: 600, 
    display: 'block', 
    marginBottom: '4px' 
  },
  productFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #e5e7eb', marginBottom: '12px' },
  priceTag: { display: 'flex', flexDirection: 'column', gap: '2px' },
  priceLabel: { fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
  priceValue: { fontSize: '24px', fontWeight: 700, color: '#10b981' },
  productMeta: { textAlign: 'right' },
  metaText: { fontSize: '12px', color: '#9ca3af' },
  actionButtons: { display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' },
  actionBtn: { flex: 1, padding: '10px 16px', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' },
  editBtn: { backgroundColor: '#dbeafe', color: '#1e40af' },
  deleteBtn: { backgroundColor: '#fee2e2', color: '#991b1b' },
  emptyState: { gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '16px' },
  emptyIcon: { fontSize: '64px', opacity: 0.5 },
  emptyTitle: { margin: 0, fontSize: '20px', color: '#1a1d29' },
  emptyText: { margin: 0, fontSize: '14px', color: '#6b7280' },
  
  // Estilos do Modal de Delete
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