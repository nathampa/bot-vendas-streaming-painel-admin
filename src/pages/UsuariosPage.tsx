import { useState, useEffect } from 'react';
import { getAdminUsuarios } from '../services/apiClient';
import type { IUsuarioAdminList } from '../types/api.types';

export const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState<IUsuarioAdminList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarUsuarios = async () => {
    setIsLoading(true);
    try {
      const response = await getAdminUsuarios();
      setUsuarios(response.data);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar usuÃ¡rios:", err);
      setError("Falha ao carregar usuÃ¡rios.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const formatarData = (dataIso: string) => {
    return new Date(dataIso.endsWith('Z') ? dataIso : dataIso + 'Z')
      .toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });
  };

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Carregando usuÃ¡rios...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>ðŸ‘¥ UsuÃ¡rios do Sistema</h1>
          <p style={styles.subtitle}>Lista de todos os clientes cadastrados</p>
        </div>
      </div>
      
      {error && (
        <div style={styles.alert}>
          <span style={styles.alertIcon}>âš ï¸</span>
          <span>{error}</span>
        </div>
      )}

      {/* Tabela */}
      <div style={styles.tableContainer}>
        {usuarios.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>ðŸ‘¥</span>
            <h3 style={styles.emptyTitle}>Nenhum usuÃ¡rio encontrado</h3>
            <p style={styles.emptyText}>Quando novos usuÃ¡rios se registrarem, eles aparecerÃ£o aqui.</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>UsuÃ¡rio</th>
                <th style={styles.th}>ID Telegram</th>
                <th style={styles.th}>Saldo Atual</th>
                <th style={styles.th}>Total Compras</th>
                <th style={styles.th}>Registrado Em</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((user) => (
                <tr key={user.id}>
                  <td style={styles.td}>{user.nome_completo}</td>
                  <td style={styles.td}>{user.telegram_id}</td>
                  <td style={styles.td}>
                    <span style={styles.saldo}>R$ {user.saldo_carteira}</span>
                  </td>
                  <td style={styles.td}>{user.total_pedidos}</td>
                  <td style={styles.td}>{formatarData(user.criado_em)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// Estilos (similares aos de PedidosPage)
const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1400px', margin: '0 auto' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' },
  spinner: { width: '48px', height: '48px', border: '4px solid var(--border-subtle)', borderTop: '4px solid var(--brand-500)', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { fontSize: '16px', color: 'var(--text-secondary)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' },
  title: { margin: '0 0 4px 0', fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' },
  subtitle: { margin: 0, fontSize: '15px', color: 'var(--text-secondary)' },
  alert: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', marginBottom: '24px' },
  alertIcon: { fontSize: '18px' },
  tableContainer: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '700px' },
  th: { padding: '14px 18px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: 'var(--text-secondary)', backgroundColor: 'var(--surface-soft)', borderBottom: '2px solid var(--border-subtle)', textTransform: 'uppercase' },
  td: { padding: '16px 18px', borderBottom: '1px solid var(--surface-muted)', color: 'var(--text-primary)', fontSize: '14px', whiteSpace: 'nowrap' },
  saldo: { fontWeight: 600, color: '#10b981' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '16px' },
  emptyIcon: { fontSize: '64px', opacity: 0.5 },
  emptyTitle: { margin: 0, fontSize: '20px', color: 'var(--text-primary)' },
  emptyText: { margin: 0, fontSize: '14px', color: 'var(--text-secondary)' },
};

