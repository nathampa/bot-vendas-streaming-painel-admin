import { useState, type CSSProperties } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type MenuItem = {
  path: string;
  icon: string;
  label: string;
};

const menuItems: MenuItem[] = [
  { path: '/dashboard', icon: 'DB', label: 'Dashboard' },
  { path: '/produtos', icon: 'PR', label: 'Produtos' },
  { path: '/estoque', icon: 'ES', label: 'Estoque' },
  { path: '/contas-mae', icon: 'CM', label: 'Contas Mae' },
  { path: '/tickets', icon: 'TK', label: 'Tickets' },
  { path: '/pedidos', icon: 'PD', label: 'Pedidos' },
  { path: '/usuarios', icon: 'US', label: 'Usuarios' },
  { path: '/recargas', icon: 'RC', label: 'Recargas' },
  { path: '/giftcards', icon: 'GC', label: 'Gift Cards' },
  { path: '/sugestoes', icon: 'SG', label: 'Sugestoes' },
  { path: '/configuracoes', icon: 'CF', label: 'Configuracoes' },
];

export const AdminLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentPageLabel = menuItems.find((item) => item.path === location.pathname)?.label ?? 'Admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <style>{mobileStyles}</style>

      <aside id="admin-sidebar" className={`sidebar-mobile ${sidebarOpen ? 'open' : ''}`} style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>FS</span>
            <div style={styles.logoText}>
              <h2 style={styles.logoTitle}>Ferreira Streamings</h2>
              <p style={styles.logoSubtitle}>Painel Admin</p>
            </div>
          </div>
        </div>

        <nav style={styles.nav} aria-label="Navegacao principal do painel">
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={active ? 'page' : undefined}
                style={{ ...styles.navLink, ...(active ? styles.navLinkActive : {}) }}
                onClick={() => setSidebarOpen(false)}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={styles.sidebarFooter}>
          <button type="button" onClick={handleLogout} style={styles.logoutButton} aria-label="Sair da conta">
            <span style={styles.navIcon}>OUT</span>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="overlay-mobile" style={styles.overlay} onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      <div className="main-wrapper-mobile" style={styles.mainWrapper}>
        <header style={styles.topBar}>
          <button
            className="menu-button-mobile"
            style={styles.menuButton}
            onClick={() => setSidebarOpen((current) => !current)}
            aria-label="Abrir menu lateral"
            aria-expanded={sidebarOpen}
            aria-controls="admin-sidebar"
          >
            MENU
          </button>
          <div style={styles.topBarContent}>
            <h1 style={styles.pageTitle}>{currentPageLabel}</h1>
            <div style={styles.userInfo}>
              <span style={styles.userName}>Administrador</span>
            </div>
          </div>
        </header>

        <main style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: 'var(--surface-muted)',
  },
  sidebar: {
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    width: '260px',
    backgroundColor: 'var(--surface-dark)',
    color: 'var(--text-inverse)',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    boxShadow: 'var(--shadow-lg)',
    zIndex: 1000,
    transition: 'transform 0.3s ease',
  },
  sidebarHeader: {
    padding: '24px 20px',
    borderBottom: '1px solid rgba(248,250,252,0.12)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    background: 'var(--brand-gradient)',
    display: 'grid',
    placeItems: 'center',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: 1,
  },
  logoText: {
    flex: 1,
  },
  logoTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-inverse)',
  },
  logoSubtitle: {
    margin: '2px 0 0 0',
    fontSize: '12px',
    color: 'rgba(248,250,252,0.65)',
  },
  nav: {
    flex: 1,
    padding: '20px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    textDecoration: 'none',
    color: 'rgba(248,250,252,0.68)',
    borderRadius: '8px',
    transition: 'background-color 0.2s ease, color 0.2s ease',
    fontSize: '14px',
    fontWeight: 500,
  },
  navLinkActive: {
    backgroundColor: 'rgba(45,127,224,0.24)',
    color: 'var(--text-inverse)',
  },
  navIcon: {
    fontSize: '11px',
    fontWeight: 700,
    width: '24px',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  sidebarFooter: {
    padding: '20px 12px',
    borderTop: '1px solid rgba(248,250,252,0.12)',
  },
  logoutButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    border: '1px solid rgba(248,250,252,0.16)',
    color: 'rgba(248,250,252,0.72)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'background-color 0.2s ease, color 0.2s ease',
  },
  mainWrapper: {
    flex: 1,
    marginLeft: '260px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  topBar: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    backdropFilter: 'blur(8px)',
    borderBottom: '1px solid var(--border-subtle)',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  menuButton: {
    display: 'none',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-default)',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    padding: '8px',
    color: 'var(--text-primary)',
  },
  topBarContent: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: 'var(--surface-soft)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
  },
  userName: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
  content: {
    flex: 1,
    padding: '24px',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
    display: 'none',
  },
};

const mobileStyles = `
  @media (max-width: 768px) {
    .sidebar-mobile {
      transform: translateX(-100%) !important;
    }
    .sidebar-mobile.open {
      transform: translateX(0) !important;
    }
    .main-wrapper-mobile {
      margin-left: 0 !important;
    }
    .menu-button-mobile {
      display: block !important;
    }
    .overlay-mobile {
      display: block !important;
    }
  }
`;


