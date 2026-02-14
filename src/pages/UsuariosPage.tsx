import { useState, useEffect } from 'react';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import { getAdminUsuarios } from '../services/apiClient';
import type { IUsuarioAdminList } from '../types/api.types';
import { MetricCard, PageHeader } from '../components/UI';

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
      console.error("Erro ao buscar usuários:", err);
      setError("Falha ao carregar usuários.");
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

  const saldoTotal = usuarios.reduce((soma, user) => soma + Number(user.saldo_carteira || 0), 0);
  const totalCompras = usuarios.reduce((soma, user) => soma + Number(user.total_pedidos || 0), 0);

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <PageHeader
        title="Usuários do Sistema"
        subtitle="Lista de todos os clientes cadastrados."
        icon={<GroupOutlinedIcon fontSize="small" />}
      />

      <div style={styles.statsGrid}>
        <MetricCard label="Usuários" value={usuarios.length} icon={<PersonOutlineOutlinedIcon fontSize="small" />} tone="info" />
        <MetricCard label="Saldo total" value={`R$ ${saldoTotal.toFixed(2)}`} icon={<PaidOutlinedIcon fontSize="small" />} tone="success" />
        <MetricCard label="Total compras" value={totalCompras} icon={<ShoppingCartOutlinedIcon fontSize="small" />} tone="warning" />
      </div>
      
      {error && (
        <div style={styles.alert}>
          <span style={styles.alertIcon}><ErrorOutlineOutlinedIcon sx={{ fontSize: 18 }} /></span>
          <span>{error}</span>
        </div>
      )}

      {/* Tabela */}
      <div style={styles.tableContainer}>
        {usuarios.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}><GroupOutlinedIcon sx={{ fontSize: 52 }} /></span>
            <h3 style={styles.emptyTitle}>Nenhum usuário encontrado</h3>
            <p style={styles.emptyText}>Quando novos usuários se registrarem, eles aparecerão aqui.</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Usuário</th>
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
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' },
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

