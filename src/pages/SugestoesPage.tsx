import { useState, useEffect } from 'react';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import { getAdminSugestoes } from '../services/apiClient';
import type { ISugestaoAdminRead } from '../types/api.types';
import { MetricCard, PageHeader } from '../components/UI';

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
    return 'var(--text-secondary)'; // Cinza - Baixo
  };

  const getPopularityLabel = (contagem: number): string => {
    if (contagem >= 20) return 'Muito Popular';
    if (contagem >= 10) return 'Popular';
    if (contagem >= 5) return 'Crescendo';
    return 'Novo';
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
      <PageHeader
        title="Sugestões dos Usuários"
        subtitle="Veja o que os usuários mais pedem, ordenado por popularidade."
        icon={<LightbulbOutlinedIcon fontSize="small" />}
      />

      {/* Info Box */}
      <div style={styles.infoBox}>
        <span style={styles.infoIcon}><InfoOutlinedIcon sx={{ fontSize: 20 }} /></span>
        <div style={styles.infoContent}>
          <p style={styles.infoText}>
            <strong>Como funciona:</strong> A API agrupa sugestões idênticas automaticamente. 
            Por exemplo, "disney plus" e "Disney Plus" são contados juntos.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <MetricCard label="Total de sugestões" value={sugestoes.length} icon={<LightbulbOutlinedIcon fontSize="small" />} tone="info" />
        <MetricCard label="Mais pedido" value={sugestoes.length > 0 ? sugestoes[0].nome_streaming : '---'} icon={<EmojiEventsOutlinedIcon fontSize="small" />} tone="warning" />
        <MetricCard label="Total de pedidos" value={sugestoes.reduce((sum, s) => sum + s.contagem, 0)} icon={<TrendingUpOutlinedIcon fontSize="small" />} tone="success" />
      </div>

      {/* Error Alert */}
      {error && (
        <div style={styles.alert}>
          <span style={styles.alertIcon}><ErrorOutlineOutlinedIcon sx={{ fontSize: 18 }} /></span>
          <span>{error}</span>
        </div>
      )}

      {/* Sugestões Grid */}
      <div style={styles.sugestoesContainer}>
        {sugestoes.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}><LightbulbOutlinedIcon sx={{ fontSize: 52 }} /></span>
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
                    borderColor: isTop3 ? color : 'var(--border-subtle)'
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
                             sugestao.status === 'DISPONIVEL' ? '#065f46' : 'var(--text-secondary)'
                    }}>
                      {sugestao.status === 'PENDENTE' ? 'Pendente' :
                       sugestao.status === 'EM_ANALISE' ? 'Em Análise' :
                       sugestao.status === 'DISPONIVEL' ? 'Disponível' :
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
            <strong>Dica:</strong> Priorize os streamings com mais pedidos para maximizar suas vendas.
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
    border: '4px solid var(--border-subtle)',
    borderTop: '4px solid var(--brand-500)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '16px',
    color: 'var(--text-secondary)',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    margin: '0 0 4px 0',
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  subtitle: {
    margin: 0,
    fontSize: '15px',
    color: 'var(--text-secondary)',
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
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statValue: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--text-primary)',
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
    color: 'var(--text-primary)',
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
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  contagemValue: {
    fontSize: '32px',
    fontWeight: 700,
  },
  progressBar: {
    width: '100%',
    height: '12px',
    backgroundColor: 'var(--border-subtle)',
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
    borderTop: '1px solid var(--border-subtle)',
  },
  statusLabel: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
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
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  emptyTitle: {
    margin: 0,
    fontSize: '20px',
    color: 'var(--text-primary)',
  },
  emptyText: {
    margin: 0,
    fontSize: '14px',
    color: 'var(--text-secondary)',
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

