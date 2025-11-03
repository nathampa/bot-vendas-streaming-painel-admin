import { useState, useEffect } from 'react';
import { getAdminPedidos, getPedidoDetalhes } from '../services/apiClient';
import type { IPedidoAdminList, IPedidoAdminDetails } from '../types/api.types';

export const PedidosPage = () => {
  const [pedidos, setPedidos] = useState<IPedidoAdminList[]>([]);
  const [selectedPedido, setSelectedPedido] = useState<IPedidoAdminDetails | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarPedidos = async () => {
    setIsLoadingList(true);
    try {
      const response = await getAdminPedidos();
      setPedidos(response.data);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar pedidos:", err);
      setError("Falha ao carregar pedidos.");
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, []);

  const handleVerDetalhes = async (pedidoId: string) => {
    setIsLoadingDetails(true);
    setError(null);
    try {
      const response = await getPedidoDetalhes(pedidoId);
      setSelectedPedido(response.data);
    } catch (err: any) {
      console.error("Erro ao buscar detalhes:", err);
      const errorMsg = err.response?.data?.detail || "Falha ao carregar detalhes.";
      alert(`❌ Erro: ${errorMsg}`);
    } finally {
      setIsLoadingDetails(false);
    }
  };
  
  const formatarData = (dataIso: string) => {
    return new Date(dataIso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('📋 Copiado!');
  };

  if (isLoadingList) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Carregando pedidos...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🧾 Pedidos</h1>
          <p style={styles.subtitle}>Histórico de todas as vendas realizadas</p>
        </div>
      </div>
      
      {/* Error Alert */}
      {error && (
        <div style={styles.alert}>
          <span style={styles.alertIcon}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Tabela de Pedidos */}
      <div style={styles.tableContainer}>
        {pedidos.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>🧾</span>
            <h3 style={styles.emptyTitle}>Nenhum pedido encontrado</h3>
            <p style={styles.emptyText}>Quando as vendas começarem, elas aparecerão aqui.</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Data</th>
                <th style={styles.th}>Produto</th>
                <th style={styles.th}>Usuário</th>
                <th style={styles.th}>Valor</th>
                <th style={styles.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido) => (
                <tr key={pedido.id}>
                  <td style={styles.td}>{formatarData(pedido.criado_em)}</td>
                  <td style={styles.td}>{pedido.produto_nome}</td>
                  <td style={styles.td}>
                    <div style={styles.userCell}>
                      <span>{pedido.usuario_nome_completo}</span>
                      <span style={styles.userId}>ID: {pedido.usuario_telegram_id}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.price}>R$ {pedido.valor_pago}</span>
                  </td>
                  <td style={styles.td}>
                    <button 
                      onClick={() => handleVerDetalhes(pedido.id)}
                      style={styles.detailsButton}
                    >
                      👁️ Ver Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Detalhes do Pedido */}
      {(selectedPedido || isLoadingDetails) && (
        <div style={styles.modalOverlay} onClick={() => !isLoadingDetails && setSelectedPedido(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>🧾 Detalhes do Pedido</h3>
              <button onClick={() => setSelectedPedido(null)} style={styles.modalClose}>✕</button>
            </div>
            
            {isLoadingDetails ? (
              <div style={styles.loadingContainer}>
                <div style={styles.spinner} />
                <p style={styles.loadingText}>Carregando conta...</p>
              </div>
            ) : selectedPedido ? (
              <>
                <div style={styles.modalBody}>
                  {/* Informações do Pedido */}
                  <div style={styles.infoGrid}>
                    <div style={styles.infoBox}>
                      <span style={styles.infoLabel}>Produto</span>
                      <span style={styles.infoValue}>{selectedPedido.produto_nome}</span>
                    </div>
                    <div style={styles.infoBox}>
                      <span style={styles.infoLabel}>Valor Pago</span>
                      <span style={{...styles.infoValue, color: '#10b981'}}>R$ {selectedPedido.valor_pago}</span>
                    </div>
                    <div style={styles.infoBox}>
                      <span style={styles.infoLabel}>Usuário</span>
                      <span style={styles.infoValue}>{selectedPedido.usuario_nome_completo}</span>
                    </div>
                    <div style={styles.infoBox}>
                      <span style={styles.infoLabel}>Data</span>
                      <span style={styles.infoValue}>{formatarData(selectedPedido.criado_em)}</span>
                    </div>
                  </div>
                  
                  {/* Credenciais da Conta */}
                  <div style={styles.contaCard}>
                    <h4 style={styles.contaTitle}>🔐 Credenciais Entregues</h4>
                    <div style={styles.contaRow}>
                      <span style={styles.contaLabel}>Login:</span>
                      <div style={styles.copyBox} onClick={() => copyToClipboard(selectedPedido.conta.login)}>
                        <span style={styles.contaValue}>{selectedPedido.conta.login}</span>
                        <button style={styles.copyButton} title="Copiar login">📋</button>
                      </div>
                    </div>
                    <div style={styles.contaRow}>
                      <span style={styles.contaLabel}>Senha:</span>
                      <div style={styles.copyBox} onClick={() => copyToClipboard(selectedPedido.conta.senha)}>
                        <span style={styles.contaValue}>{selectedPedido.conta.senha}</span>
                        <button style={styles.copyButton} title="Copiar senha">📋</button>
                      </div>
                    </div>
                  </div>
                  
                  {/* ID do Pedido */}
                  <div style={styles.idFooter}>
                    ID do Pedido: {selectedPedido.id}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

// Estilos
const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1400px', margin: '0 auto' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' },
  spinner: { width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { fontSize: '16px', color: '#6b7280' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' },
  title: { margin: '0 0 4px 0', fontSize: '28px', fontWeight: 700, color: '#1a1d29' },
  subtitle: { margin: 0, fontSize: '15px', color: '#6b7280' },
  alert: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', marginBottom: '24px' },
  alertIcon: { fontSize: '18px' },
  tableContainer: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '14px 18px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#6b7280', backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb', textTransform: 'uppercase', letterSpacing: '0.5px' },
  td: { padding: '16px 18px', borderBottom: '1px solid #f5f7fa', color: '#1a1d29', fontSize: '14px' },
  userCell: { display: 'flex', flexDirection: 'column', gap: '2px' },
  userId: { fontSize: '12px', color: '#6b7280' },
  price: { fontSize: '14px', fontWeight: 600, color: '#10b981' },
  detailsButton: { padding: '8px 16px', fontSize: '13px', fontWeight: 600, backgroundColor: '#f5f7fa', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '16px' },
  emptyIcon: { fontSize: '64px', opacity: 0.5 },
  emptyTitle: { margin: 0, fontSize: '20px', color: '#1a1d29' },
  emptyText: { margin: 0, fontSize: '14px', color: '#6b7280' },
  
  // Estilos do Modal (reutilizados)
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' },
  modal: { backgroundColor: '#fff', borderRadius: '16px', maxWidth: '550px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', minHeight: '300px' },
  modalHeader: { padding: '24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { margin: 0, fontSize: '20px', fontWeight: 700 },
  modalClose: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', padding: '4px', color: '#6b7280' },
  modalBody: { padding: '24px' },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' },
  infoBox: { padding: '12px 16px', backgroundColor: '#f9fafb', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' },
  infoLabel: { fontSize: '13px', color: '#6b7280', fontWeight: 500 },
  infoValue: { fontSize: '15px', color: '#1a1d29', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  contaCard: { padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' },
  contaTitle: { margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#1a1d29' },
  contaRow: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' },
  contaLabel: { fontSize: '13px', color: '#6b7280', fontWeight: 500 },
  contaValue: { fontSize: '16px', color: '#1a1d29', fontWeight: 600, fontFamily: 'monospace' },
  copyBox: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d1d5db', cursor: 'pointer', transition: 'all 0.2s ease' },
  copyButton: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', padding: '4px' },
  idFooter: { marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', fontSize: '12px', color: '#9ca3af', textAlign: 'center' },
};