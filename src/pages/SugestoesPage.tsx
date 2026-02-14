import { useState, useEffect } from 'react';
import { getAdminSugestoes } from '../services/apiClient';
import type { ISugestaoAdminRead } from '../types/api.types';

export const SugestoesPage = () => {
  const [sugestoes, setSugestoes] = useState<ISugestaoAdminRead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    carregarSugestoes();
  }, []);

  const getPopularityColor = (contagem: number): string => {
    if (contagem >= 20) return '#ef4444'; // Vermelho - Muito popular
    if (contagem >= 10) return '#f59e0b'; // Amarelo - Popular
    if (contagem >= 5) return '#3b82f6';  // Azul - Médio
    return '#6b7280'; // Cinza - Baixo
  };

  const getPopularityLabel = (contagem: number): string => {
    if (contagem >= 20) return '🔥 Muito Popular';
    if (contagem >= 10) return '⭐ Popular';
    if (contagem >= 5) return '📈 Crescendo';
    return '📊 Novo';
  };

  const maxContagem = Math.max(...sugestoes.map(s => s.contagem), 1);

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Carregando sugestões...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>💡 Sugestões dos Usuários</h1>
          <p style={styles.subtitle}>Veja o que os usuários mais pedem (ordenado por popularidade)</p>
        </div>
      </div>

      {/* Info Box */}
      <div style={styles.infoBox}>
        <span style={styles.infoIcon}>ℹ️</span>
        <div style={styles.infoContent}>
          <p style={styles.infoText}>
            <strong>Como funciona:</strong> A API agrupa sugestões idênticas automaticamente. 
            Por exemplo, "disney plus" e "Disney Plus" são contados juntos.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={{...styles.statIcon, backgroundColor: '#dbeafe', color: '#1e40af'}}>💡</span>
          <div>
            <p style={styles.statLabel}>Total de Sugestões</p>
            <h3 style={styles.statValue}>{sugestoes.length}</h3>
          </div>
        </div>
        <div style={styles.statCard}>
          <span style={{...styles.statIcon, backgroundColor: '#fef3c7', color: '#92400e'}}>🔥</span>
          <div>
            <p style={styles.statLabel}>Mais Pedido</p>
            <h3 style={styles.statValue}>
              {sugestoes.length > 0 ? sugestoes[0].nome_streaming : '---'}
            </h3>
          </div>
        </div>
        <div style={styles.statCard}>
          <span style={{...styles.statIcon, backgroundColor: '#d1fae5', color: '#065f46'}}>📊</span>
          <div>
            <p style={styles.statLabel}>Total de Pedidos</p>
            <h3 style={styles.statValue}>
              {sugestoes.reduce((sum, s) => sum + s.contagem, 0)}
            </h3>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={styles.alert}>
          <span style={styles.alertIcon}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Sugestões Grid */}
      <div style={styles.sugestoesContainer}>
        {sugestoes.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>💡</span>
            <h3 style={styles.emptyTitle}>Nenhuma sugestão ainda</h3>
            <p style={styles.emptyText}>
              Quando os usuários começarem a pedir novos streamings, eles aparecerão aqui
            </p>
          </div>
        ) : (
          <div style={styles.sugestoesGrid}>
            {sugestoes.map((sugestao, index) => {
              const color = getPopularityColor(sugestao.contagem);
              const barWidth = (sugestao.contagem / maxContagem) * 100;
              const isTop3 = index < 3;

              return (
                <div
                  key={sugestao.nome_streaming}
                  style={{
                    ...styles.sugestaoCard,
                    borderColor: isTop3 ? color : '#e5e7eb'
                  }}
                >
                  {/* Ranking Badge */}
                  {isTop3 && (
                    <div style={{...styles.rankBadge, backgroundColor: color}}>
                      #{index + 1}
                    </div>
                  )}

                  {/* Header */}
                  <div style={styles.cardHeader}>
                    <h3 style={styles.streamingName}>{sugestao.nome_streaming}</h3>
                    <span style={{...styles.popularityBadge, color: color}}>
                      {getPopularityLabel(sugestao.contagem)}
                    </span>
                  </div>

                  {/* Contagem */}
                  <div style={styles.contagemSection}>
                    <div style={styles.contagemHeader}>
                      <span style={styles.contagemLabel}>Número de Pedidos</span>
                      <span style={{...styles.contagemValue, color: color}}>
                        {sugestao.contagem}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div style={styles.progressBar}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${barWidth}%`,
                          backgroundColor: color
                        }}
                      />
                    </div>
                    
                    <span style={{...styles.progressPercent, color: color}}>
                      {((sugestao.contagem / maxContagem) * 100).toFixed(0)}% do mais pedido
                    </span>
                  </div>

                  {/* Status */}
                  <div style={styles.statusSection}>
                    <span style={styles.statusLabel}>Status:</span>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: sugestao.status === 'EM_ANALISE' ? '#fef3c7' : 
                                     sugestao.status === 'DISPONIVEL' ? '#d1fae5' : '#f3f4f6',
                      color: sugestao.status === 'EM_ANALISE' ? '#92400e' :
                             sugestao.status === 'DISPONIVEL' ? '#065f46' : '#6b7280'
                    }}>
                      {sugestao.status === 'PENDENTE' ? '⏳ Pendente' :
                       sugestao.status === 'EM_ANALISE' ? '🔍 Em Análise' :
                       sugestao.status === 'DISPONIVEL' ? '✅ Disponível' :
                       sugestao.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Info */}
      {sugestoes.length > 0 && (
        <div style={styles.bottomInfo}>
          <p style={styles.bottomInfoText}>
            💡 <strong>Dica:</strong> Priorize os streamings com mais pedidos para maximizar suas vendas!
          </p>
        </div>
      )}
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
    marginBottom: '32px',
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
  infoBox: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#dbeafe',
    border: '1px solid #bfdbfe',
    borderRadius: '12px',
    marginBottom: '32px',
  },
  infoIcon: {
    fontSize: '24px',
  },
  infoContent: {
    flex: 1,
  },
  infoText: {
    margin: 0,
    fontSize: '14px',
    color: '#1e40af',
    lineHeight: 1.5,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  statIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
  },
  statLabel: {
    margin: '0 0 4px 0',
    fontSize: '13px',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statValue: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#1a1d29',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
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
  sugestoesContainer: {
    marginBottom: '32px',
  },
  sugestoesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  },
  sugestaoCard: {
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '2px solid',
    transition: 'all 0.2s ease',
  },
  rankBadge: {
    position: 'absolute',
    top: '-10px',
    right: '20px',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 700,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '20px',
    gap: '12px',
  },
  streamingName: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    color: '#1a1d29',
    flex: 1,
    textTransform: 'capitalize',
  },
  popularityBadge: {
    fontSize: '13px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  contagemSection: {
    marginBottom: '20px',
  },
  contagemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  contagemLabel: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: 500,
  },
  contagemValue: {
    fontSize: '32px',
    fontWeight: 700,
  },
  progressBar: {
    width: '100%',
    height: '12px',
    backgroundColor: '#e5e7eb',
    borderRadius: '6px',
    overflow: 'hidden',
    marginBottom: '6px',
  },
  progressFill: {
    height: '100%',
    transition: 'all 0.5s ease',
    borderRadius: '6px',
  },
  progressPercent: {
    fontSize: '12px',
    fontWeight: 600,
  },
  statusSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb',
  },
  statusLabel: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: 500,
  },
  statusBadge: {
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: 600,
    borderRadius: '6px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    gap: '16px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
    textAlign: 'center',
  },
  bottomInfo: {
    padding: '16px 20px',
    backgroundColor: '#fef3c7',
    border: '1px solid #fde68a',
    borderRadius: '12px',
  },
  bottomInfoText: {
    margin: 0,
    fontSize: '14px',
    color: '#78350f',
    lineHeight: 1.5,
  },
};
