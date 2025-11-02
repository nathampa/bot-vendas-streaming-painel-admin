import { useState, useEffect } from 'react';
// 1. Importa a função da nossa API
import { getAdminSugestoes } from '../services/apiClient';
// 2. Importa o tipo que acabamos de definir (usando 'import type')
import type { ISugestaoAdminRead } from '../types/api.types';

// --- O Componente da Página ---
export const SugestoesPage = () => {

  // Estados para os dados da API
  const [sugestoes, setSugestoes] = useState<ISugestaoAdminRead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 3. Função para carregar os dados da API
  const carregarSugestoes = async () => {
    setIsLoading(true);
    try {
      const response = await getAdminSugestoes();
      setSugestoes(response.data);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar sugestões:", err);
      setError("Falha ao carregar sugestões.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Efeito que roda UMA VEZ quando a página carrega
  useEffect(() => {
    carregarSugestoes();
  }, []); // O '[]' vazio faz este 'useEffect' rodar só uma vez.

  // --- 5. Lógica de Renderização ---
  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <h1>💡 Sugestões dos Usuários</h1>
      <p>Veja aqui o que os seus usuários mais pedem (ordenado por popularidade).</p>
      <p><i>(A API agrupa sugestões idênticas, ex: "disney plus" e "Disney Plus" são contados juntos.)</i></p>

      <hr style={{ margin: '20px 0' }} />

      {/* --- Tabela de Sugestões --- */}
      <h3>Lista de Sugestões</h3>
      {isLoading ? (
        <p>Carregando sugestões...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <table border={1} cellPadding={5} style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>Nome do Streaming Sugerido</th>
              <th>Nº de Pedidos</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sugestoes.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center' }}>Nenhuma sugestão encontrada.</td>
              </tr>
            ) : (
              sugestoes.map((sugestao) => (
                // Usamos o nome como 'key' pois ele é único (agrupado pela API)
                <tr key={sugestao.nome_streaming}> 
                  <td>{sugestao.nome_streaming}</td>
                  <td><strong>{sugestao.contagem}</strong></td>
                  <td>{sugestao.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};