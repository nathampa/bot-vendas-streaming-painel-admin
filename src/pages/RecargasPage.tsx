import { useState, useEffect } from 'react';
import { getAdminRecargas } from '../services/apiClient';
import type { IRecargaAdminList } from '../types/api.types';

export const RecargasPage = () => {
  const [recargas, setRecargas] = useState<IRecargaAdminList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarRecargas = async () => {
    setIsLoading(true);
    try {
      const response = await getAdminRecargas();
      setRecargas(response.data);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar recargas:", err);
      setError("Falha ao carregar recargas.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarRecargas();
  }, []);

  const formatarData = (dataIso: string | null) => {
    if (!dataIso) return <span style={styles.noData}>N/A</span>;
    return new Date(dataIso.endsWith('Z') ? dataIso : dataIso + 'Z')
      .toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });
  };

  const getStatusBadge = (status: string) => {
    if (status === 'PAGO') {
      return <span style={{...styles.badge, ...styles.badgeSuccess}}>✓ Pago</span>;
    }
    if (status === 'PENDENTE') {
      return <span style={{...styles.badge, ...styles.badgeWarning}}>⏳ Pendente</span>;
    }
    return <span style={{...styles.badge, ...styles.badgeError}}>✕ Falhou</span>;
  };

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Carregando recargas...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>💰 Recargas</h1>
          <p style={styles.subtitle}>Histórico das últimas 50 recargas de saldo</p>
        </div>
      </div>
      
      {error && (
        <div style={styles.alert}>
          <span style={styles.alertIcon}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Tabela */}
      <div style={styles.tableContainer}>
        {recargas.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>💰</span>
            <h3 style={styles.emptyTitle}>Nenhuma recarga encontrada</h3>
            <p style={styles.emptyText}>Quando usuários adicionarem saldo, aparecerá aqui.</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Data Criação</th>
                <th style={styles.th}>Usuário</th>
                <th style={styles.th}>Valor</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Data Pagamento</th>
                <th style={styles.th}>Gateway ID</th>
              </tr>
            </thead>
            <tbody>
              {recargas.map((recarga) => (
                <tr key={recarga.id}>
                  <td style={styles.td}>{formatarData(recarga.criado_em)}</td>
                  <td style={styles.td}>
                    <div style={styles.userCell}>
                      <span>{recarga.usuario_nome_completo}</span>
                      <span style={styles.userId}>ID: {recarga.usuario_telegram_id}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.valor}>R$ {recarga.valor_solicitado}</span>
                  </td>
                  <td style={styles.td}>{getStatusBadge(recarga.status_pagamento)}</td>
                  <td style={styles.td}>{formatarData(recarga.pago_em)}</td>
                  <td style={styles.td}>
                    <span style={styles.gatewayId} title={recarga.gateway_id || ''}>
                      {recarga.gateway_id ? `${recarga.gateway_id.substring(0, 10)}...` : 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// Estilos
const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1400px', margin: '0 auto' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' },
  spinner: { width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { fontSize: '16px', color: '#6b7280' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' },
  title: { margin: '0 0 4px 0', fontSize: '28px', fontWeight: 700, color: '#1a1d29' },
  subtitle: { margin: 0, fontSize: '15px', color: '#6b7280' },
  alert: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', marginBottom: '24px' },
  alertIcon: { fontSize: '18px' },
  tableContainer: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '800px' },
  th: { padding: '14px 18px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#6b7280', backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb', textTransform: 'uppercase' },
  td: { padding: '16px 18px', borderBottom: '1px solid #f5f7fa', color: '#1a1d29', fontSize: '14px', whiteSpace: 'nowrap' },
  userCell: { display: 'flex', flexDirection: 'column', gap: '2px' },
  userId: { fontSize: '12px', color: '#6b7280' },
  valor: { fontWeight: 600, color: '#1a1d29' },
  gatewayId: { fontFamily: 'monospace', fontSize: '12px', color: '#6b7280' },
  badge: { padding: '4px 10px', fontSize: '11px', fontWeight: 600, borderRadius: '6px' },
  badgeSuccess: { backgroundColor: '#d1fae5', color: '#065f46' },
  badgeWarning: { backgroundColor: '#fef3c7', color: '#92400e' },
  badgeError: { backgroundColor: '#fee2e2', color: '#991b1b' },
  noData: { color: '#9ca3af', fontStyle: 'italic' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '16px' },
  emptyIcon: { fontSize: '64px', opacity: 0.5 },
  emptyTitle: { margin: 0, fontSize: '20px', color: '#1a1d29' },
  emptyText: { margin: 0, fontSize: '14px', color: '#6b7280' },
};
