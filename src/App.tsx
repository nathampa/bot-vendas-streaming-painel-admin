import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// 1. Importa o Layout
import { AdminLayout } from './components/AdminLayout';

// 2. Importa todas as nossas Páginas (ATUALIZADO)
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProdutosPage } from './pages/ProdutosPage';
import { EstoquePage } from './pages/EstoquePage';
import { TicketsPage } from './pages/TicketsPage';

// --- IMPORTAÇÕES ADICIONADAS ---
import { GiftCardsPage } from './pages/GiftCardsPage'; 
import { SugestoesPage } from './pages/SugestoesPage';
// --- FIM DAS IMPORTAÇÕES ---

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
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/giftcards" element={<GiftCardsPage />} />
          <Route path="/sugestoes" element={<SugestoesPage />} />

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