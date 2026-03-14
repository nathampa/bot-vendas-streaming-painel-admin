import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import CardGiftcardOutlinedIcon from '@mui/icons-material/CardGiftcardOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import MailOutlineOutlinedIcon from '@mui/icons-material/MailOutlineOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';

const THEME_KEY = 'adminThemePreference';

type MenuItem = {
  path: string;
  icon: ReactNode;
  label: string;
};

const menuItems: MenuItem[] = [
  { path: '/dashboard', icon: <DashboardOutlinedIcon sx={{ fontSize: 17 }} />, label: 'Dashboard' },
  { path: '/email-monitor', icon: <MailOutlineOutlinedIcon sx={{ fontSize: 17 }} />, label: 'Email Monitor' },
  { path: '/produtos', icon: <StorefrontOutlinedIcon sx={{ fontSize: 17 }} />, label: 'Produtos' },
  { path: '/estoque', icon: <Inventory2OutlinedIcon sx={{ fontSize: 17 }} />, label: 'Estoque' },
  { path: '/contas-mae', icon: <GroupsOutlinedIcon sx={{ fontSize: 17 }} />, label: 'Contas Mãe' },
  { path: '/tickets', icon: <SupportAgentOutlinedIcon sx={{ fontSize: 17 }} />, label: 'Tickets' },
  { path: '/pedidos', icon: <ReceiptLongOutlinedIcon sx={{ fontSize: 17 }} />, label: 'Pedidos' },
  { path: '/usuarios', icon: <PersonOutlineOutlinedIcon sx={{ fontSize: 17 }} />, label: 'Usuários' },
  { path: '/recargas', icon: <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 17 }} />, label: 'Recargas' },
  { path: '/giftcards', icon: <CardGiftcardOutlinedIcon sx={{ fontSize: 17 }} />, label: 'Gift Cards' },
  { path: '/sugestoes', icon: <LightbulbOutlinedIcon sx={{ fontSize: 17 }} />, label: 'Sugestões' },
  { path: '/configuracoes', icon: <SettingsOutlinedIcon sx={{ fontSize: 17 }} />, label: 'Configurações' },
];

export const AdminLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === 'dark' ? 'dark' : 'light';
  });

  const currentPageLabel = useMemo(
    () => menuItems.find((item) => item.path === location.pathname)?.label ?? 'Admin',
    [location.pathname],
  );

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    if (window.innerWidth > 960) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

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
            <div>
              <h2 style={styles.logoTitle}>Ferreira Streamings</h2>
              <p style={styles.logoSubtitle}>Painel Admin</p>
            </div>
          </div>
        </div>

        <nav style={styles.nav} aria-label="Navegação principal do painel">
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={active ? 'page' : undefined}
                style={{ ...styles.navLink, ...(active ? styles.navLinkActive : {}) }}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={styles.sidebarFooter}>
          <button type="button" onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))} style={styles.utilityButton}>
            <span style={styles.navIcon}>{theme === 'light' ? <DarkModeOutlinedIcon sx={{ fontSize: 17 }} /> : <LightModeOutlinedIcon sx={{ fontSize: 17 }} />}</span>
            <span>{theme === 'light' ? 'Modo escuro' : 'Modo claro'}</span>
          </button>
          <button type="button" onClick={handleLogout} style={styles.logoutButton} aria-label="Sair da conta">
            <span style={styles.navIcon}><LogoutOutlinedIcon sx={{ fontSize: 17 }} /></span>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="overlay-mobile" style={styles.overlay} onClick={() => setSidebarOpen(false)} aria-hidden="true" />}

      <div className="main-wrapper-mobile" style={styles.mainWrapper}>
        <header className="admin-topbar-mobile" style={styles.topBar}>
          <button type="button" className="menu-button-mobile" style={styles.menuButton} onClick={() => setSidebarOpen((current) => !current)}>
            MENU
          </button>
          <div style={styles.topBarContent}>
            <div>
              <h1 style={styles.pageTitle}>{currentPageLabel}</h1>
              <p style={styles.pageSubtitle}>{theme === 'light' ? 'Tema claro ativo' : 'Tema escuro ativo'}</p>
            </div>
            <div style={styles.topBarActions}>
              <button type="button" onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))} style={styles.themeButton}>
                {theme === 'light' ? <DarkModeOutlinedIcon sx={{ fontSize: 18 }} /> : <LightModeOutlinedIcon sx={{ fontSize: 18 }} />}
              </button>
              <div style={styles.userBadge}>Administrador</div>
            </div>
          </div>
        </header>

        <main className="admin-content-mobile" style={styles.content}>
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
    inset: '0 auto 0 0',
    width: '270px',
    background: 'linear-gradient(180deg, var(--surface-dark) 0%, color-mix(in srgb, var(--surface-dark) 88%, black) 100%)',
    color: 'var(--text-inverse)',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    boxShadow: 'var(--shadow-lg)',
    zIndex: 1000,
    transition: 'transform 0.25s ease',
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
    width: '44px',
    height: '44px',
    borderRadius: '14px',
    display: 'grid',
    placeItems: 'center',
    background: 'var(--brand-gradient)',
    fontSize: '12px',
    fontWeight: 800,
    letterSpacing: 1,
  },
  logoTitle: {
    margin: 0,
    fontSize: '16px',
    color: 'var(--text-inverse)',
  },
  logoSubtitle: {
    margin: '2px 0 0 0',
    fontSize: '12px',
    color: 'rgba(248,250,252,0.66)',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '20px 12px',
    flex: 1,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    borderRadius: '12px',
    color: 'rgba(248,250,252,0.72)',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 600,
  },
  navLinkActive: {
    color: 'var(--text-inverse)',
    backgroundColor: 'rgba(45,127,224,0.24)',
    boxShadow: 'inset 0 0 0 1px rgba(191,219,254,0.18)',
  },
  navIcon: {
    width: '24px',
    height: '24px',
    borderRadius: '8px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    flexShrink: 0,
  },
  sidebarFooter: {
    padding: '18px 12px',
    borderTop: '1px solid rgba(248,250,252,0.12)',
    display: 'grid',
    gap: '10px',
  },
  utilityButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'transparent',
    border: '1px solid rgba(248,250,252,0.14)',
    color: 'rgba(248,250,252,0.78)',
  },
  logoutButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'transparent',
    border: '1px solid rgba(248,250,252,0.14)',
    color: 'rgba(248,250,252,0.78)',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15,23,42,0.48)',
    zIndex: 900,
  },
  mainWrapper: {
    flex: 1,
    marginLeft: '270px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  topBar: {
    position: 'sticky',
    top: 0,
    zIndex: 800,
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '18px 24px',
    backgroundColor: 'color-mix(in srgb, var(--surface-base) 88%, transparent)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--border-subtle)',
  },
  menuButton: {
    display: 'none',
    backgroundColor: 'var(--surface-base)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-subtle)',
    padding: '10px 12px',
  },
  topBarContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flex: 1,
    flexWrap: 'wrap',
  },
  pageTitle: {
    margin: 0,
    fontSize: '24px',
    color: 'var(--text-primary)',
  },
  pageSubtitle: {
    margin: '4px 0 0 0',
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  topBarActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  themeButton: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    display: 'grid',
    placeItems: 'center',
    backgroundColor: 'var(--surface-base)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-subtle)',
    padding: 0,
  },
  userBadge: {
    padding: '10px 14px',
    borderRadius: '999px',
    backgroundColor: 'var(--surface-base)',
    border: '1px solid var(--border-subtle)',
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  content: {
    padding: '24px',
    flex: 1,
  },
};

const mobileStyles = `
  @media (max-width: 960px) {
    .sidebar-mobile {
      transform: translateX(-100%);
    }
    .sidebar-mobile.open {
      transform: translateX(0);
    }
    .main-wrapper-mobile {
      margin-left: 0;
    }
    .menu-button-mobile {
      display: inline-flex;
    }
    .admin-content-mobile {
      padding: 18px;
    }
  }
`;
