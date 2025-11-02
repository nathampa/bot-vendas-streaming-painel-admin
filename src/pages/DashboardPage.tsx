import { useState, useEffect } from 'react';
// Removemos 'useAuth' pois o logout está no layout

import { getDashboardKPIs, getTopProdutos } from '../services/apiClient';

// ... (Interfaces IKPIs e ITopProduto continuam as mesmas) ...
interface IKPIs {
  faturamento_24h: string;
  vendas_24h: number;
  novos_usuarios_24h: number;
  tickets_abertos: number;
}

interface ITopProduto {
  produto_nome: string;
  total_vendas: number;
  faturamento_total: string;
}


export const DashboardPage = () => {
  // 3. Estados (iguais a antes)
  const [kpis, setKpis] = useState<IKPIs | null>(null);
  const [topProdutos, setTopProdutos] = useState<ITopProduto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 4. Efeito (igual a antes)
  useEffect(() => {
    (async () => {
      try {
        console.log("Dashboard: Buscando dados da API...");
        const [kpiResponse, topProdutosResponse] = await Promise.all([
          getDashboardKPIs(),
          getTopProdutos()
        ]);
        setKpis(kpiResponse.data);
        setTopProdutos(topProdutosResponse.data);
        setError(null);
        console.log("Dashboard: Dados recebidos!", kpiResponse.data);
      } catch (err: any) {
        console.error("Erro ao buscar dados do dashboard:", err);
        setError("Falha ao carregar os dados do dashboard. Verifique se a API está online.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // 8. Lógica de Renderização (igual a antes)
  if (isLoading) {
    return <h1>Carregando Dashboard...</h1>;
  }
  if (error) {
    return <div style={{ color: 'red' }}><h1>Erro</h1><p>{error}</p></div>;
  }

  // --- RENDERIZAÇÃO CORRIGIDA (SEM o botão de logout) ---
  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <h1>📊 Dashboard</h1>
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

// Estilo simples (igual a antes)
const kpiBoxStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '20px',
  border: '1px solid #ccc',
  borderRadius: '8px',
  minWidth: '150px',
  textAlign: 'center',
};