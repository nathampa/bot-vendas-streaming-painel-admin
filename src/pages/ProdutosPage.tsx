import { useState, useEffect } from 'react';
// 1. Importa as funções da nossa API
import { getAdminProdutos, createProduto } from '../services/apiClient';

// 2. Define os "tipos" de dados que esperamos
interface IProduto {
  id: string;
  nome: string;
  descricao: string;
  preco: string; // A API retorna Decimal como string
  is_ativo: boolean;
  criado_em: string;
}

// --- O Componente da Página ---
export const ProdutosPage = () => {

  // Estados para os dados da API
  const [produtos, setProdutos] = useState<IProduto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para o formulário de NOVO PRODUTO
  const [showForm, setShowForm] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoDescricao, setNovoDescricao] = useState('');
  const [novoPreco, setNovoPreco] = useState(0);

  // 3. Função para carregar os dados da API
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

  // 4. Efeito que roda UMA VEZ quando a página carrega
  useEffect(() => {
    carregarProdutos();
  }, []); // O '[]' vazio faz este 'useEffect' rodar só uma vez.

  // 5. Função para lidar com a criação de um novo produto
  const handleCreateProduto = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede o formulário de recarregar a página

    const data = {
      nome: novoNome,
      descricao: novoDescricao,
      preco: novoPreco,
      is_ativo: true,
    };

    try {
      await createProduto(data);
      // Sucesso!
      alert("Produto criado com sucesso!");
      // Limpa o formulário e recarrega a lista
      setNovoNome('');
      setNovoDescricao('');
      setNovoPreco(0);
      setShowForm(false);
      carregarProdutos(); // Atualiza a tabela
    } catch (err) {
      console.error("Erro ao criar produto:", err);
      alert("Falha ao criar produto. Verifique o console.");
    }
  };

  // --- 6. Lógica de Renderização ---

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <h1>🛍️ Gerenciamento de Produtos</h1>
      <p>Aqui você irá criar e editar os produtos do catálogo (ex: "Netflix - 1 Tela").</p>

      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancelar' : '➕ Novo Produto'}
      </button>

      {/* --- Formulário de Novo Produto (Condicional) --- */}
      {showForm && (
        <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px 0' }}>
          <h3>Criar Novo Produto</h3>
          <form onSubmit={handleCreateProduto}>
            <div style={{ marginBottom: '10px' }}>
              <label>Nome: </label>
              <input 
                type="text" 
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                required 
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Descrição: </label>
              <input 
                type="text" 
                value={novoDescricao}
                onChange={(e) => setNovoDescricao(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Preço (ex: 15.50): </label>
              <input 
                type="number" 
                step="0.01" 
                value={novoPreco}
                onChange={(e) => setNovoPreco(parseFloat(e.target.value))}
                required 
              />
            </div>
            <button type="submit">Salvar Produto</button>
          </form>
        </div>
      )}

      <hr style={{ margin: '20px 0' }} />

      {/* --- Tabela de Produtos --- */}
      <h3>Catálogo Atual</h3>
      {isLoading ? (
        <p>Carregando produtos...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <table border={1} cellPadding={5} style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Preço</th>
              <th>Status</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((produto) => (
              <tr key={produto.id}>
                <td>{produto.nome}</td>
                <td>R$ {produto.preco}</td>
                <td>{produto.is_ativo ? 'Ativo' : 'Inativo'}</td>
                <td>{produto.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};