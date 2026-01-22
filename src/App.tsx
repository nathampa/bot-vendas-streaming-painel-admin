import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// 1. Importa o Layout
import { AdminLayout } from './components/AdminLayout';

// 2. Importa todas as nossas Páginas
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProdutosPage } from './pages/ProdutosPage';
import { EstoquePage } from './pages/EstoquePage';
import { TicketsPage } from './pages/TicketsPage';
import { PedidosPage } from './pages/PedidosPage';
import { GiftCardsPage } from './pages/GiftCardsPage'; 
import { SugestoesPage } from './pages/SugestoesPage';
import { UsuariosPage } from './pages/UsuariosPage';
import { RecargasPage } from './pages/RecargasPage';
import { ConfiguracoesPage } from './pages/ConfiguracoesPage';
import { ContasMaePage } from './pages/ContasMaePage';


/**
 * Componente "Protetor" (Wrapper)
 * (Exatamente o mesmo de antes)
 */
const ProtectedRoute = () => {
  const { isAdmin, token } = useAuth();
  if (!isAdmin || !token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />; // Renderiza as rotas "filhas"
};

/**
 * Componente "Público"
 * (Exatamente o mesmo de antes)
 */
const PublicRoute = () => {
  const { isAdmin } = useAuth();
  if (isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
};

/**
 * Componente principal da Aplicação (Atualizado)
 */
function App() {
  return (
    <Routes>
      {/* Rota de Login (Pública) */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Rotas Protegidas (Privadas do Admin) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}> 

          {/* Rotas existentes */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/produtos" element={<ProdutosPage />} />
          <Route path="/estoque" element={<EstoquePage />} />
          <Route path="/contas-mae" element={<ContasMaePage />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/giftcards" element={<GiftCardsPage />} />
          <Route path="/sugestoes" element={<SugestoesPage />} />
          <Route path="/pedidos" element={<PedidosPage />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
          <Route path="/recargas" element={<RecargasPage />} />
          <Route path="/configuracoes" element={<ConfiguracoesPage />} />

          {/* Rota de fallback (índice) */}
          <Route index element={<Navigate to="/dashboard" replace />} />

        </Route>
      </Route>

      {/* Rota Padrão (Catch-all) */}
      <Route 
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}

export default App;
