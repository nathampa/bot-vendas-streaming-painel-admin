import { useState, useEffect } from 'react';
import { getAdminProdutos, createProduto } from '../services/apiClient';

interface IProduto {
  id: string;
  nome: string;
  descricao: string;
  preco: string;
  is_ativo: boolean;
  criado_em: string;
}

export const ProdutosPage = () => {
  const [produtos, setProdutos] = useState<IProduto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  // Form states
  const [novoNome, setNovoNome] = useState('');
  const [novoDescricao, setNovoDescricao] = useState('');
  const [novoPreco, setNovoPreco] = useState('');

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

  const handleCreateProduto = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      nome: novoNome,
      descricao: novoDescricao,
      preco: parseFloat(novoPreco),
      is_ativo: true,
    };

    try {
      await createProduto(data);
      alert("✅ Produto criado com sucesso!");
      setNovoNome('');
      setNovoDescricao('');
      setNovoPreco('');
      setShowForm(false);
      carregarProdutos();
    } catch (err) {
      console.error("Erro ao criar produto:", err);
      alert("❌ Falha ao criar produto.");
    }
  };

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
        <button 
          onClick={() => setShowForm(!showForm)}
          style={styles.addButton}
        >
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

      {/* Form */}
      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Criar Novo Produto</h3>
          <form onSubmit={handleCreateProduto} style={styles.form}>
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
                style={{...styles.input, minHeight: '80px', resize: 'vertical'}}
                placeholder="Descrição do produto..."
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                value={novoPreco}
                onChange={(e) => setNovoPreco(e.target.value)}
                required
                style={styles.input}
                placeholder="15.90"
              />
            </div>

            <div style={styles.formActions}>
              <button type="button" onClick={() => setShowForm(false)} style={styles.cancelButton}>
                Cancelar
              </button>
              <button type="submit" style={styles.submitButton}>
                Salvar Produto
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Grid */}
      <div style={styles.productsGrid}>
        {produtos.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>📦</span>
            <h3 style={styles.emptyTitle}>Nenhum produto cadastrado</h3>
            <p style={styles.emptyText}>Comece adicionando seu primeiro produto ao catálogo</p>
          </div>
        ) : (
          produtos.map((produto) => (
            <div key={produto.id} style={styles.productCard}>
              <div style={styles.productHeader}>
                <h3 style={styles.productName}>{produto.nome}</h3>
                <span style={{
                  ...styles.badge,
                  ...(produto.is_ativo ? styles.badgeActive : styles.badgeInactive)
                }}>
                  {produto.is_ativo ? '✓ Ativo' : '✕ Inativo'}
                </span>
              </div>
              
              {produto.descricao && (
                <p style={styles.productDescription}>{produto.descricao}</p>
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
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '16px',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '16px',
    color: '#6b7280',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px',
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
  addButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 600,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  alert: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#991b1b',
    marginBottom: '24px',
  },
  alertIcon: {
    fontSize: '18px',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  formTitle: {
    margin: '0 0 20px 0',
    fontSize: '18px',
    fontWeight: 700,
    color: '#1a1d29',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
  },
  input: {
    padding: '12px 16px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s ease',
    width: '100%',
    fontFamily: 'inherit',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 600,
    backgroundColor: '#f5f7fa',
    color: '#1a1d29',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  submitButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 600,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease',
    border: '2px solid transparent',
  },
  productHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '12px',
    gap: '12px',
  },
  productName: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#1a1d29',
    flex: 1,
  },
  badge: {
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: 600,
    borderRadius: '6px',
    whiteSpace: 'nowrap',
  },
  badgeActive: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  badgeInactive: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  productDescription: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: 1.5,
  },
  productFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb',
  },
  priceTag: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  priceLabel: {
    fontSize: '12px',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  priceValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#10b981',
  },
  productMeta: {
    textAlign: 'right',
  },
  metaText: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  emptyState: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    gap: '16px',
  },
  emptyIcon: {
    fontSize: '64px',
    opacity: 0.5,
  },
  emptyTitle: {
    margin: 0,
    fontSize: '20px',
    color: '#1a1d29',
  },
  emptyText: {
    margin: 0,
    fontSize: '14px',
    color: '#6b7280',
  },
};