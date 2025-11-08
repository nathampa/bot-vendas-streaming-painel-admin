import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export const AdminLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/produtos', icon: '🛍️', label: 'Produtos' },
    { path: '/estoque', icon: '📦', label: 'Estoque' },
    { path: '/tickets', icon: '🎟️', label: 'Tickets' },
    { path: '/pedidos', icon: '🧾', label: 'Pedidos' },
    { path: '/usuarios', icon: '👥', label: 'Usuários' },
    { path: '/recargas', icon: '💰', label: 'Recargas' },
    { path: '/giftcards', icon: '🎁', label: 'Gift Cards' },
    { path: '/sugestoes', icon: '💡', label: 'Sugestões' },
    { path: '/configuracoes', icon: '⚙️', label: 'Configurações' }
  ];

  return (
    <div style={styles.container}>
      {/* Inject mobile styles */}
      <style>{mobileStyles}</style>

      {/* Sidebar */}
      <aside 
        className={`sidebar-mobile ${sidebarOpen ? 'open' : ''}`}
        style={styles.sidebar}
      >
        <div style={styles.sidebarHeader}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>🎬</span>
            <div style={styles.logoText}>
              <h2 style={styles.logoTitle}>Ferreira Streamings</h2>
              <p style={styles.logoSubtitle}>Painel Admin</p>
            </div>
          </div>
        </div>

        <nav style={styles.nav}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.navLink,
                ...(isActive(item.path) ? styles.navLinkActive : {}),
              }}
              onClick={() => setSidebarOpen(false)}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <button onClick={handleLogout} style={styles.logoutButton}>
            <span style={styles.navIcon}>🚪</span>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div 
          className="overlay-mobile"
          style={styles.overlay} 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="main-wrapper-mobile" style={styles.mainWrapper}>
        {/* Top Bar */}
        <header style={styles.topBar}>
          <button 
            className="menu-button-mobile"
            style={styles.menuButton}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <div style={styles.topBarContent}>
            <h1 style={styles.pageTitle}>
              {menuItems.find(item => item.path === location.pathname)?.label || 'Admin'}
            </h1>
            <div style={styles.userInfo}>
              <span style={styles.userIcon}>👤</span>
              <span style={styles.userName}>Administrador</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  sidebar: {
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    width: '260px',
    backgroundColor: '#1a1d29',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
    zIndex: 1000,
    transition: 'transform 0.3s ease',
  },
  sidebarHeader: {
    padding: '24px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    fontSize: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    flex: 1,
  },
  logoTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff',
  },
  logoSubtitle: {
    margin: '2px 0 0 0',
    fontSize: '12px',
    color: '#8b92a7',
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
    color: '#8b92a7',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    fontSize: '14px',
    fontWeight: 500,
  },
  navLinkActive: {
    backgroundColor: '#2d3142',
    color: '#fff',
  },
  navIcon: {
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
  },
  sidebarFooter: {
    padding: '20px 12px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  logoutButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#8b92a7',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  mainWrapper: {
    flex: 1,
    marginLeft: '260px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  topBar: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #e5e7eb',
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
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '8px',
    color: '#1a1d29',
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
    color: '#1a1d29',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#f5f7fa',
    borderRadius: '8px',
  },
  userIcon: {
    fontSize: '18px',
  },
  userName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1a1d29',
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

// Estilos responsivos para mobile via CSS-in-JS
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