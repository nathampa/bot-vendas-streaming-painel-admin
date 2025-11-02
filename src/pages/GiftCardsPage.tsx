import { useState, useEffect } from 'react';
// 1. Importa as funções da nossa API
import { getAdminGiftCards, createGiftCard } from '../services/apiClient';
// 2. Importa o tipo que acabamos de definir (usando 'import type')
import type { IGiftCardAdminRead } from '../types/api.types';

// Tipo para o filtro
type FilterStatus = 'todos' | 'usados' | 'nao_usados';

// --- O Componente da Página ---
export const GiftCardsPage = () => {

  // Estados para os dados da API
  const [giftCards, setGiftCards] = useState<IGiftCardAdminRead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para o filtro da tabela
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('nao_usados');

  // Estados para o formulário de NOVO GIFT CARD
  const [showForm, setShowForm] = useState(false);
  const [novoValor, setNovoValor] = useState(10);
  const [novaQuantidade, setNovaQuantidade] = useState(1);
  const [novoCodigo, setNovoCodigo] = useState(''); // Para código personalizado

  // 3. Função para carregar os dados da API
  const carregarGiftCards = async (status: FilterStatus) => {
    setIsLoading(true);
    try {
      // Converte o nosso filtro de string para o booleano que a API espera
      const params: { is_utilizado?: boolean } = {};
      if (status === 'usados') params.is_utilizado = true;
      if (status === 'nao_usados') params.is_utilizado = false;
      // Se for 'todos', não envia o parâmetro

      const response = await getAdminGiftCards(params);
      setGiftCards(response.data);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar gift cards:", err);
      setError("Falha ao carregar gift cards.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Efeito que roda UMA VEZ e sempre que o 'filterStatus' mudar
  useEffect(() => {
    carregarGiftCards(filterStatus);
  }, [filterStatus]); // Re-carrega a lista quando o filtro muda

  // 5. Função para lidar com a criação de um novo gift card
  const handleCreateGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      valor: novoValor,
      quantidade: novoCodigo ? 1 : novaQuantidade, // Se for código personalizado, quantidade é 1
      codigo_personalizado: novoCodigo || undefined // Envia 'undefined' se estiver vazio
    };

    try {
      const response = await createGiftCard(data);

      alert(
        `Gift Card(s) criado com sucesso!\n\n` +
        `Códigos: ${response.data.codigos_gerados.join(', ')}`
      );

      // Limpa o formulário e recarrega a lista
      setNovoValor(10);
      setNovaQuantidade(1);
      setNovoCodigo('');
      setShowForm(false);
      setFilterStatus('nao_usados'); // Volta para o filtro "Não Usados"
      carregarGiftCards('nao_usados'); // Atualiza a tabela

    } catch (err: any) {
      console.error("Erro ao criar gift card:", err);
      const errorMsg = err.response?.data?.detail || "Falha ao criar gift card.";
      alert(`Erro: ${errorMsg}`);
    }
  };

  // --- 6. Lógica de Renderização ---
  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <h1>🎁 Gerenciamento de Gift Cards</h1>
      <p>Crie e gerencie os códigos de presente para seus usuários.</p>

      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancelar' : '➕ Novo Gift Card'}
      </button>

      {/* --- Formulário de Novo Gift Card (Condicional) --- */}
      {showForm && (
        <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px 0' }}>
          <h3>Criar Novo(s) Gift Card(s)</h3>
          <form onSubmit={handleCreateGiftCard}>

            <div style={{ marginBottom: '10px' }}>
              <label>Valor (R$): </label>
              <input 
                type="number" 
                step="0.01" 
                min="1"
                value={novoValor}
                onChange={(e) => setNovoValor(parseFloat(e.target.value))}
                required 
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label>Quantidade: </label>
              <input 
                type="number" 
                step="1" 
                min="1"
                value={novaQuantidade}
                onChange={(e) => setNovaQuantidade(parseInt(e.target.value))}
                required
                disabled={!!novoCodigo} // Desabilita se estiver a usar código personalizado
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label>Código Personalizado (Opcional): </label>
              <input 
                type="text" 
                value={novoCodigo}
                onChange={(e) => setNovoCodigo(e.target.value)}
                placeholder="Ex: NATAL2025"
              />
              <br />
              <small>(Se preenchido, a quantidade será 1)</small>
            </div>

            <button type="submit">Gerar Código(s)</button>
          </form>
        </div>
      )}

      <hr style={{ margin: '20px 0' }} />

      {/* --- Tabela de Gift Cards --- */}
      <h3>Códigos Gerados</h3>

      {/* Filtros de Status */}
      <div style={{ marginBottom: '20px' }}>
        Filtar por:
        <button onClick={() => setFilterStatus('nao_usados')} style={{ background: filterStatus === 'nao_usados' ? '#ddd' : 'white' }}>Não Usados</button>
        <button onClick={() => setFilterStatus('usados')} style={{ background: filterStatus === 'usados' ? '#ddd' : 'white' }}>Usados</button>
        <button onClick={() => setFilterStatus('todos')} style={{ background: filterStatus === 'todos' ? '#ddd' : 'white' }}>Todos</button>
      </div>

      {isLoading ? (
        <p>Carregando gift cards...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <table border={1} cellPadding={5} style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Valor (R$)</th>
              <th>Status</th>
              <th>Data de Criação</th>
              <th>Usado por (Telegram ID)</th>
            </tr>
          </thead>
          <tbody>
            {giftCards.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>Nenhum gift card encontrado para este filtro.</td>
              </tr>
            ) : (
              giftCards.map((gc) => (
                <tr key={gc.id}>
                  <td><strong>{gc.codigo}</strong></td>
                  <td>R$ {gc.valor}</td>
                  <td>{gc.is_utilizado ? '✅ Usado' : 'Não usado'}</td>
                  <td>{new Date(gc.criado_em).toLocaleString('pt-BR')}</td>
                  <td>{gc.utilizado_por_telegram_id || '---'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};