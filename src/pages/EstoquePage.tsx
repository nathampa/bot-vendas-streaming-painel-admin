import { useState, useEffect } from 'react';
// 1. Importa as 3 funções da API que usaremos
import { 
  getAdminEstoque, 
  getAdminProdutos, 
  createEstoque 
} from '../services/apiClient';

// 2. Define os "tipos" de dados que esperamos
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
  // Não precisamos dos outros campos aqui
}

// --- O Componente da Página ---
export const EstoquePage = () => {

  // Estados para os dados da API
  const [estoque, setEstoque] = useState<IEstoque[]>([]);
  const [produtos, setProdutos] = useState<IProduto[]>([]); // Para o dropdown
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para o formulário de "Abastecer"
  const [showForm, setShowForm] = useState(false);
  const [selectedProdutoId, setSelectedProdutoId] = useState('');
  const [novoLogin, setNovoLogin] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [novoMaxSlots, setNovoMaxSlots] = useState(2);

  // 3. Função para carregar os dados (Estoque E Produtos)
  const carregarDados = async () => {
    setIsLoading(true);
    try {
      // Usamos Promise.all para buscar ambos ao mesmo tempo
      const [estoqueRes, produtosRes] = await Promise.all([
        getAdminEstoque(),
        getAdminProdutos()
      ]);

      setEstoque(estoqueRes.data);
      setProdutos(produtosRes.data);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar dados de estoque ou produtos:", err);
      setError("Falha ao carregar dados.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Efeito que roda UMA VEZ quando a página carrega
  useEffect(() => {
    carregarDados();
  }, []);

  // 5. Função para lidar com o abastecimento (criação)
  const handleCreateEstoque = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProdutoId) {
      alert("Por favor, selecione um produto para abastecer.");
      return;
    }

    const data = {
      produto_id: selectedProdutoId,
      login: novoLogin,
      senha: novaSenha,
      max_slots: novoMaxSlots,
    };

    try {
      await createEstoque(data);
      // Sucesso!
      alert("Conta de estoque adicionada com sucesso!");
      // Limpa o formulário e recarrega a lista
      setShowForm(false);
      setSelectedProdutoId('');
      setNovoLogin('');
      setNovaSenha('');
      setNovoMaxSlots(2);
      carregarDados(); // Atualiza a tabela
    } catch (err: any) {
      console.error("Erro ao criar estoque:", err);
      const errorMsg = err.response?.data?.detail || "Falha ao criar estoque.";
      alert(`Erro: ${errorMsg}`);
    }
  };

  // 6. Função auxiliar para encontrar o nome do produto pelo ID
  const getProdutoNome = (produtoId: string) : string => {
    const produto = produtos.find(p => p.id === produtoId);
    return produto ? produto.nome : 'Produto Desconhecido';
  };

  // --- 7. Lógica de Renderização ---

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <h1>📦 Gerenciamento de Estoque</h1>
      <p>Aqui você irá abastecer o estoque com contas reais (login/senha) para os produtos.</p>

      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancelar Abastecimento' : '➕ Abastecer Estoque'}
      </button>

      {/* --- Formulário de Abastecimento (Condicional) --- */}
      {showForm && (
        <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px 0' }}>
          <h3>Abastecer Novo Estoque</h3>
          <form onSubmit={handleCreateEstoque}>

            {/* Dropdown de Produtos */}
            <div style={{ marginBottom: '10px' }}>
              <label>Produto: </label>
              <select 
                value={selectedProdutoId} 
                onChange={(e) => setSelectedProdutoId(e.target.value)}
                required
              >
                <option value="">-- Selecione um Produto --</option>
                {produtos.map((produto) => (
                  <option key={produto.id} value={produto.id}>
                    {produto.nome}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label>Login (Email): </label>
              <input 
                type="text" 
                value={novoLogin}
                onChange={(e) => setNovoLogin(e.target.value)}
                required 
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Senha: </label>
              <input 
                type="password" 
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                required
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Máximo de Slots (Usuários): </label>
              <input 
                type="number" 
                step="1" 
                min="1"
                value={novoMaxSlots}
                onChange={(e) => setNovoMaxSlots(parseInt(e.target.value))}
                required 
              />
            </div>
            <button type="submit">Salvar Conta no Estoque</button>
          </form>
        </div>
      )}

      <hr style={{ margin: '20px 0' }} />

      {/* --- Tabela de Estoque Atual --- */}
      <h3>Estoque Atual</h3>
      {isLoading ? (
        <p>Carregando estoque...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <table border={1} cellPadding={5} style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Login</th>
              <th>Slots (Ocup/Max)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {estoque.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center' }}>Nenhuma conta em estoque.</td>
              </tr>
            ) : (
              estoque.map((item) => (
                <tr key={item.id} style={{ 
                  background: item.requer_atencao ? '#fff0f0' : (item.is_ativo ? 'white' : '#eee') 
                }}>
                  <td>{getProdutoNome(item.produto_id)}</td>
                  <td>{item.login}</td>
                  <td>{item.slots_ocupados} / {item.max_slots}</td>
                  <td>
                    {item.requer_atencao ? '⚠️ Requer Atenção' : (item.is_ativo ? 'Ativo' : 'Inativo')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};