import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// 1. Importa as funções da nossa API que já definimos
import { getDashboardKPIs, getTopProdutos } from '../services/apiClient';

// 2. (Opcional, mas boa prática) Define os "tipos" de dados que esperamos
interface IKPIs {
  faturamento_24h: string; // A API retorna Decimal como string
  vendas_24h: number;
  novos_usuarios_24h: number;
  tickets_abertos: number;
}

interface ITopProduto {
  produto_nome: string;
  total_vendas: number;
  faturamento_total: string; // A API retorna Decimal como string
}

// --- O Componente da Página ---
export const DashboardPage = () => {
  const { logout } = useAuth(); // Hook para o botão de sair

  // 3. Estados para guardar os dados da API
  const [kpis, setKpis] = useState<IKPIs | null>(null);
  const [topProdutos, setTopProdutos] = useState<ITopProduto[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Começa carregando
  const [error, setError] = useState<string | null>(null);

  // 4. Efeito que roda UMA VEZ quando a página carrega (note o '[]' no final)
  useEffect(() => {
    // Função "auto-executável" para podermos usar async/await
    (async () => {
      try {
        console.log("Dashboard: Buscando dados da API...");

        // 5. Chama a API em paralelo
        const [kpiResponse, topProdutosResponse] = await Promise.all([
          getDashboardKPIs(),
          getTopProdutos()
        ]);

        // 6. Guarda os dados no estado
        setKpis(kpiResponse.data);
        setTopProdutos(topProdutosResponse.data);
        setError(null); // Limpa erros antigos

        console.log("Dashboard: Dados recebidos!", kpiResponse.data);

      } catch (err: any) {
        console.error("Erro ao buscar dados do dashboard:", err);
        setError("Falha ao carregar os dados do dashboard. Verifique se a API está online.");
      } finally {
        // 7. Para de carregar (mesmo se deu erro)
        setIsLoading(false);
      }
    })();
  }, []); // O '[]' vazio faz este 'useEffect' rodar só uma vez.

  // --- 8. Lógica de Renderização ---

  // Se estiver carregando, mostra um "Loading..."
  if (isLoading) {
    return <div style={{ padding: '20px' }}><h1>Carregando Dashboard...</h1></div>;
  }

  // Se deu erro, mostra o erro
  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}><h1>Erro</h1><p>{error}</p></div>;
  }

  // Se tudo deu certo, mostra os dados
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Dashboard</h1>
        <button onClick={logout}>Sair (Logout)</button>
      </div>
      <p>Bem-vindo ao painel, aqui estão suas estatísticas:</p>

      <hr style={{ margin: '20px 0' }} />

      {/* Seção de KPIs */}
      <h3>KPIs (Últimas 24h)</h3>
      {kpis ? (
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={kpiBoxStyle}>
            <strong>Faturamento</strong>
            <span style={{ fontSize: '24px' }}>R$ {kpis.faturamento_24h}</span>
          </div>
          <div style={kpiBoxStyle}>
            <strong>Vendas</strong>
            <span style={{ fontSize: '24px' }}>{kpis.vendas_24h}</span>
          </div>
          <div style={kpiBoxStyle}>
            <strong>Novos Usuários</strong>
            <span style={{ fontSize: '24px' }}>{kpis.novos_usuarios_24h}</span>
          </div>
          <div style={kpiBoxStyle}>
            <strong>Tickets Abertos</strong>
            <span style={{ fontSize: '24px' }}>{kpis.tickets_abertos}</span>
          </div>
        </div>
      ) : (
        <p>Não foi possível carregar os KPIs.</p>
      )}

      <hr style={{ margin: '20px 0' }} />

      {/* Seção de Top Produtos */}
      <h3>🏆 Top Produtos (Por Faturamento)</h3>
      {topProdutos.length > 0 ? (
        <table border={1} cellPadding={5} style={{ borderCollapse: 'collapse', width: '50%' }}>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Total de Vendas</th>
              <th>Faturamento Total</th>
            </tr>
          </thead>
          <tbody>
            {topProdutos.map((produto) => (
              <tr key={produto.produto_nome}>
                <td>{produto.produto_nome}</td>
                <td>{produto.total_vendas}</td>
                <td>R$ {produto.faturamento_total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Nenhuma venda registrada ainda.</p>
      )}
    </div>
  );
};

// Estilo simples para as caixas de KPI (só para ficar bonito)
const kpiBoxStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '20px',
  border: '1px solid #ccc',
  borderRadius: '8px',
  minWidth: '150px',
  textAlign: 'center',
};