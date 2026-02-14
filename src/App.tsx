import { Suspense, lazy } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './components/AdminLayout';
import { useAuth } from './contexts/AuthContext';

const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const ProdutosPage = lazy(() => import('./pages/ProdutosPage').then((m) => ({ default: m.ProdutosPage })));
const EstoquePage = lazy(() => import('./pages/EstoquePage').then((m) => ({ default: m.EstoquePage })));
const ContasMaePage = lazy(() =>
  import('./pages/ContasMaePage').then((m) => ({ default: m.ContasMaePage })),
);
const TicketsPage = lazy(() => import('./pages/TicketsPage').then((m) => ({ default: m.TicketsPage })));
const PedidosPage = lazy(() => import('./pages/PedidosPage').then((m) => ({ default: m.PedidosPage })));
const GiftCardsPage = lazy(() =>
  import('./pages/GiftCardsPage').then((m) => ({ default: m.GiftCardsPage })),
);
const SugestoesPage = lazy(() =>
  import('./pages/SugestoesPage').then((m) => ({ default: m.SugestoesPage })),
);
const UsuariosPage = lazy(() => import('./pages/UsuariosPage').then((m) => ({ default: m.UsuariosPage })));
const RecargasPage = lazy(() => import('./pages/RecargasPage').then((m) => ({ default: m.RecargasPage })));
const ConfiguracoesPage = lazy(() =>
  import('./pages/ConfiguracoesPage').then((m) => ({ default: m.ConfiguracoesPage })),
);

const ProtectedRoute = () => {
  const { isAdmin, token } = useAuth();
  if (!isAdmin || !token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

const PublicRoute = () => {
  const { isAdmin } = useAuth();
  if (isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
};

const PageFallback = () => (
  <div style={{ display: 'grid', placeItems: 'center', minHeight: '40vh', color: '#6b7280' }}>
    Carregando pagina...
  </div>
);

function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
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
            <Route index element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;

