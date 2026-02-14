import { useState, useEffect, useMemo } from 'react';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { getAdminProdutos, createProduto, updateProduto, deleteProduto } from '../services/apiClient';
import { useToast } from '../contexts/ToastContext';
import { getApiErrorMessage } from '../utils/errors';
import { MetricCard, PageHeader } from '../components/UI';

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
  const { showToast } = useToast();
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
        showToast('Produto atualizado com sucesso!', 'success');
      } else {
        await createProduto(data);
        showToast('Produto criado com sucesso!', 'success');
      }
      resetForm();
      carregarProdutos(); // A API já retorna a lista ordenada
    } catch (err: unknown) {
      console.error("Erro ao salvar produto:", err);
      const errorMsg = getApiErrorMessage(err, "Falha ao salvar produto.");
      showToast(errorMsg, 'error');
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
      showToast('Produto excluído com sucesso!', 'success');
      setDeletingProduct(null);
      carregarProdutos();
    } catch (err: unknown) {
      console.error("Erro ao excluir produto:", err);
      const errorMsg = getApiErrorMessage(err, "Falha ao excluir produto.");
      showToast(errorMsg, 'error');
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

  const produtosAtivos = produtos.filter((produto) => produto.is_ativo).length;
  const produtosInativos = produtos.length - produtosAtivos;

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
      <PageHeader
        title="Produtos"
        subtitle="Gerencie o catalogo de produtos disponiveis."
        icon={<StorefrontOutlinedIcon fontSize="small" />}
        action={(
          <button type="button" onClick={() => showForm ? resetForm() : setShowForm(true)} style={styles.addButton}>
            {showForm ? 'Cancelar' : (
              <>
                <AddOutlinedIcon sx={{ fontSize: 16, marginRight: '6px', verticalAlign: 'text-bottom' }} />
                Novo Produto
              </>
            )}
          </button>
        )}
      />

      <div style={styles.statsGrid}>
        <MetricCard label="Total" value={produtos.length} icon={<Inventory2OutlinedIcon fontSize="small" />} tone="info" />
        <MetricCard label="Ativos" value={produtosAtivos} icon={<ToggleOnOutlinedIcon fontSize="small" />} tone="success" />
        <MetricCard label="Inativos" value={produtosInativos} icon={<ToggleOffOutlinedIcon fontSize="small" />} tone="warning" />
      </div>

      {/* Error Alert */}
      {error && (
        <div style={styles.alert}>
          <span style={styles.alertIcon}><ErrorOutlineOutlinedIcon sx={{ fontSize: 18 }} /></span>
          <span>{error}</span>
        </div>
      )}

      {/* Barra de Filtros */}
      <div style={styles.filterBar}>
        <label htmlFor="produto-filtro-nome" style={styles.srOnly}>
          Pesquisar por nome do produto
        </label>
        <input
          id="produto-filtro-nome"
          type="text"
          placeholder="Pesquisar por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.filterInput}
        />
        <label htmlFor="produto-filtro-status" style={styles.srOnly}>
          Filtrar por status
        </label>
        <select
          id="produto-filtro-status"
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
            {editingProduct ? 'Editar Produto' : 'Criar Novo Produto'}
          </h3>
          <form onSubmit={handleCreateOrUpdate} style={styles.form}>
            <div style={styles.inputGroup}>
              <label htmlFor="produto-nome" style={styles.label}>Nome do Produto</label>
              <input
                id="produto-nome"
                type="text"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                required
                style={styles.input}
                placeholder="Ex: Netflix - 1 Tela"
              />
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="produto-descricao" style={styles.label}>Descrição</label>
              <textarea
                id="produto-descricao"
                value={novoDescricao}
                onChange={(e) => setNovoDescricao(e.target.value)}
                style={{...styles.input, minHeight: '80px', resize: 'vertical'} as React.CSSProperties}
                placeholder="Descrição do produto..."
              />
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="produto-instrucoes" style={styles.label}>Instruções Pós-Compra (aparece após o pagamento)</label>
              <textarea
                id="produto-instrucoes"
                value={novoInstrucoes}
                onChange={(e) => setNovoInstrucoes(e.target.value)}
                style={{...styles.input, minHeight: '100px', resize: 'vertical'} as React.CSSProperties}
                placeholder="Ex: Não altere o nome dos perfis."
              />
            </div>

            <div style={styles.inputRow}>
              <div style={styles.inputGroup}>
                <label htmlFor="produto-preco" style={styles.label}>Preço (R$)</label>
                <input
                  id="produto-preco"
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
                <label htmlFor="produto-status" style={styles.label}>Status</label>
                <select
                  id="produto-status"
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
              <label htmlFor="produto-tipo-entrega" style={styles.label}>Tipo de Entrega</label>
              <select
                id="produto-tipo-entrega"
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
            <span style={styles.emptyIcon}><Inventory2OutlinedIcon sx={{ fontSize: 52 }} /></span>
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
                    {produto.is_ativo ? 'Ativo' : 'Inativo'}
                  </span>
                  <span style={{...styles.badge, ...styles.badgeEmail}}>
                    {
                      produto.tipo_entrega === 'AUTOMATICA' ? 'Automatico' :
                      produto.tipo_entrega === 'SOLICITA_EMAIL' ? '@ Requer e-mail' :
                      'Entrega Manual'
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
                  type="button"
                  onClick={() => handleEdit(produto)}
                  style={{...styles.actionBtn, ...styles.editBtn}}
                  title="Editar produto"
                >
                  <EditOutlinedIcon sx={{ fontSize: 16 }} /> Editar
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingProduct(produto)}
                  style={{...styles.actionBtn, ...styles.deleteBtn}}
                  title="Excluir produto"
                >
                  <DeleteOutlineOutlinedIcon sx={{ fontSize: 16 }} /> Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div style={styles.modalOverlay} onClick={() => setDeletingProduct(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Confirmar Exclusão</h3>
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                style={styles.modalClose}
                aria-label="Fechar confirmação de exclusão"
              >
                x
              </button>
            </div>
            <div style={styles.modalBody}>
              <p style={styles.modalText}>
                Tem certeza que deseja excluir o produto <strong>"{deletingProduct.nome}"</strong>?
              </p>
              <div style={styles.warningBox}>
                <span style={styles.warningIcon}><InfoOutlinedIcon sx={{ fontSize: 18 }} /></span>
                <p style={styles.warningText}>
                  Esta ação não pode ser desfeita. O produto será removido permanentemente do catálogo.
                </p>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button type="button" onClick={() => setDeletingProduct(null)} style={styles.modalCancelBtn}>
                Cancelar
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

// Objeto de estilos completo (incluindo os novos filtros)
const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1400px', margin: '0 auto' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' },
  spinner: { width: '48px', height: '48px', border: '4px solid var(--border-subtle)', borderTop: '4px solid var(--brand-500)', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { fontSize: '16px', color: 'var(--text-secondary)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' },
  title: { margin: '0 0 4px 0', fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' },
  subtitle: { margin: 0, fontSize: '15px', color: 'var(--text-secondary)' },
  addButton: { padding: '12px 24px', fontSize: '14px', fontWeight: 600, background: 'linear-gradient(135deg, var(--brand-500) 0%, var(--brand-600) 100%)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
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
    border: '2px solid var(--border-subtle)',
    borderRadius: '8px',
    width: '100%',
  },
  filterSelect: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '15px',
    border: '2px solid var(--border-subtle)',
    borderRadius: '8px',
    backgroundColor: '#fff',
    width: '100%',
  },
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
  },
  
  // Estilos do Formulário
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

  // Estilos dos Cards de Produto
  productsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  productCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '2px solid transparent' },
  productHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px', gap: '12px' },
  productName: { margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', flex: 1 },
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
  productDescription: { margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 },
  instructionsPreview: { 
    margin: '0 0 16px 0', 
    padding: '12px', 
    backgroundColor: 'var(--surface-soft)', 
    borderRadius: '8px' 
  },
  instructionsLabel: { 
    fontSize: '12px', 
    color: '#374151', 
    fontWeight: 600, 
    display: 'block', 
    marginBottom: '4px' 
  },
  productFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', marginBottom: '12px' },
  priceTag: { display: 'flex', flexDirection: 'column', gap: '2px' },
  priceLabel: { fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  priceValue: { fontSize: '24px', fontWeight: 700, color: '#10b981' },
  productMeta: { textAlign: 'right' },
  metaText: { fontSize: '12px', color: 'var(--text-muted)' },
  actionButtons: { display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' },
  actionBtn: { flex: 1, padding: '10px 16px', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },
  editBtn: { backgroundColor: '#dbeafe', color: '#1e40af' },
  deleteBtn: { backgroundColor: '#fee2e2', color: '#991b1b' },
  emptyState: { gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '16px' },
  emptyIcon: { fontSize: '64px', opacity: 0.5 },
  emptyTitle: { margin: 0, fontSize: '20px', color: 'var(--text-primary)' },
  emptyText: { margin: 0, fontSize: '14px', color: 'var(--text-secondary)' },
  
  // Estilos do Modal de Delete
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


