import { useState, useEffect } from 'react';
import { getDashboardKPIs, getTopProdutos } from '../services/apiClient';

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
  const [kpis, setKpis] = useState<IKPIs | null>(null);
  const [topProdutos, setTopProdutos] = useState<ITopProduto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [kpiResponse, topProdutosResponse] = await Promise.all([
          getDashboardKPIs(),
          getTopProdutos()
        ]);
        setKpis(kpiResponse.data);
        setTopProdutos(topProdutosResponse.data);
        setError(null);
      } catch (err: any) {
        console.error("Erro ao buscar dados do dashboard:", err);
        setError("Falha ao carregar os dados do dashboard.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}>⏳</div>
        <p style={styles.loadingText}>Carregando dados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <span style={styles.errorIcon}>⚠️</span>
        <h2 style={styles.errorTitle}>Erro ao Carregar</h2>
        <p style={styles.errorText}>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Welcome Section */}
      <div style={styles.welcomeSection}>
        <div>
          <h1 style={styles.welcomeTitle}>Bem-vindo de volta! 👋</h1>
          <p style={styles.welcomeText}>Aqui está um resumo das últimas 24 horas</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={styles.kpiGrid}>
        <div style={{...styles.kpiCard, ...styles.kpiCard1}}>
          <div style={styles.kpiIcon}>💰</div>
          <div style={styles.kpiContent}>
            <p style={styles.kpiLabel}>Faturamento</p>
            <h2 style={styles.kpiValue}>R$ {kpis?.faturamento_24h || '0,00'}</h2>
            <span style={styles.kpiBadge}>Últimas 24h</span>
          </div>
        </div>

        <div style={{...styles.kpiCard, ...styles.kpiCard2}}>
          <div style={styles.kpiIcon}>🛒</div>
          <div style={styles.kpiContent}>
            <p style={styles.kpiLabel}>Vendas</p>
            <h2 style={styles.kpiValue}>{kpis?.vendas_24h || 0}</h2>
            <span style={styles.kpiBadge}>Últimas 24h</span>
          </div>
        </div>

        <div style={{...styles.kpiCard, ...styles.kpiCard3}}>
          <div style={styles.kpiIcon}>👥</div>
          <div style={styles.kpiContent}>
            <p style={styles.kpiLabel}>Novos Usuários</p>
            <h2 style={styles.kpiValue}>{kpis?.novos_usuarios_24h || 0}</h2>
            <span style={styles.kpiBadge}>Últimas 24h</span>
          </div>
        </div>

        <div style={{...styles.kpiCard, ...styles.kpiCard4}}>
          <div style={styles.kpiIcon}>🎟️</div>
          <div style={styles.kpiContent}>
            <p style={styles.kpiLabel}>Tickets Abertos</p>
            <h2 style={styles.kpiValue}>{kpis?.tickets_abertos || 0}</h2>
            <span style={{...styles.kpiBadge, ...styles.alertBadge}}>
              {kpis?.tickets_abertos ? 'Requer atenção' : 'Tudo certo'}
            </span>
          </div>
        </div>
      </div>

      {/* Top Products Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>🏆 Produtos Mais Vendidos</h2>
          <span style={styles.sectionSubtitle}>Por faturamento total</span>
        </div>

        {topProdutos.length > 0 ? (
          <div style={styles.productsGrid}>
            {topProdutos.map((produto, index) => (
              <div key={produto.produto_nome} style={styles.productCard}>
                <div style={styles.productRank}>#{index + 1}</div>
                <div style={styles.productInfo}>
                  <h3 style={styles.productName}>{produto.produto_nome}</h3>
                  <div style={styles.productStats}>
                    <div style={styles.productStat}>
                      <span style={styles.productStatLabel}>Vendas</span>
                      <span style={styles.productStatValue}>{produto.total_vendas}</span>
                    </div>
                    <div style={styles.productStat}>
                      <span style={styles.productStatLabel}>Faturamento</span>
                      <span style={styles.productStatValue}>R$ {produto.faturamento_total}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>📦</span>
            <p style={styles.emptyText}>Nenhuma venda registrada ainda</p>
          </div>
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
    fontSize: '48px',
    animation: 'spin 2s linear infinite',
  },
  loadingText: {
    fontSize: '16px',
    color: '#6b7280',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '16px',
  },
  errorIcon: {
    fontSize: '64px',
  },
  errorTitle: {
    margin: 0,
    fontSize: '24px',
    color: '#1a1d29',
  },
  errorText: {
    margin: 0,
    fontSize: '16px',
    color: '#6b7280',
  },
  welcomeSection: {
    marginBottom: '32px',
  },
  welcomeTitle: {
    margin: '0 0 8px 0',
    fontSize: '32px',
    fontWeight: 700,
    color: '#1a1d29',
  },
  welcomeText: {
    margin: 0,
    fontSize: '16px',
    color: '#6b7280',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  kpiCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    gap: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease',
    border: '2px solid transparent',
  },
  kpiCard1: {
    borderColor: '#10b981',
  },
  kpiCard2: {
    borderColor: '#3b82f6',
  },
  kpiCard3: {
    borderColor: '#8b5cf6',
  },
  kpiCard4: {
    borderColor: '#f59e0b',
  },
  kpiIcon: {
    fontSize: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  kpiLabel: {
    margin: 0,
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  kpiValue: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 700,
    color: '#1a1d29',
  },
  kpiBadge: {
    fontSize: '11px',
    color: '#10b981',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  alertBadge: {
    color: '#f59e0b',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  sectionHeader: {
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e5e7eb',
  },
  sectionTitle: {
    margin: '0 0 4px 0',
    fontSize: '20px',
    fontWeight: 700,
    color: '#1a1d29',
  },
  sectionSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
  },
  productsGrid: {
    display: 'grid',
    gap: '16px',
  },
  productCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  },
  productRank: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    backgroundColor: '#667eea',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 700,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a1d29',
  },
  productStats: {
    display: 'flex',
    gap: '24px',
  },
  productStat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  productStatLabel: {
    fontSize: '12px',
    color: '#6b7280',
  },
  productStatValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1a1d29',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    gap: '16px',
  },
  emptyIcon: {
    fontSize: '64px',
    opacity: 0.5,
  },
  emptyText: {
    margin: 0,
    fontSize: '16px',
    color: '#6b7280',
  },
};