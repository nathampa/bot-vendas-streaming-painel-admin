import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Para o botão Sair

// Estilos simples (CSS-in-JS) para o layout
const layoutStyle: React.CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
};

const sidebarStyle: React.CSSProperties = {
  width: '220px',
  background: '#f4f4f4',
  padding: '20px',
  borderRight: '1px solid #ccc',
};

const contentStyle: React.CSSProperties = {
  flex: 1, // Ocupa o resto do espaço
  padding: '20px',
};

const navLinkStyle: React.CSSProperties = {
  display: 'block',
  padding: '10px',
  textDecoration: 'none',
  color: '#333',
  borderRadius: '5px',
};

// --- O Componente de Layout ---
export const AdminLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); // Redireciona para o login após sair
  };

  return (
    <div style={layoutStyle}>
      {/* 1. Barra Lateral (Sidebar) */}
      <nav style={sidebarStyle}>
        <h2>Ferreira Streamings</h2>
        <p>Painel de Admin</p>
        <hr />

        {/* Links de Navegação (ATUALIZADO) */}
        <Link to="/dashboard" style={navLinkStyle}>📊 Dashboard</Link>
        <Link to="/produtos" style={navLinkStyle}>🛍️ Produtos</Link>
        <Link to="/estoque" style={navLinkStyle}>📦 Estoque</Link>
        <Link to="/tickets" style={navLinkStyle}>🎟️ Tickets</Link>
        <Link to="/giftcards" style={navLinkStyle}>🎁 Gift Cards</Link>
        <Link to="/sugestoes" style={navLinkStyle}>💡 Sugestões</Link>


        {/* Botão de Sair (Logout) */}
        <button onClick={handleLogout} style={{ marginTop: '30px' }}>
          Sair (Logout)
        </button>
      </nav>

      {/* 2. Conteúdo Principal da Página */}
      <main style={contentStyle}>
        <Outlet />
      </main>
    </div>
  );
};