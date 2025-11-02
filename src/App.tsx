import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
// Remove os imports de CSS e logo do Vite que não precisamos mais
// import './App.css'; 

/**
 * Componente "Protetor" (Wrapper)
 * Verifica se o admin está logado. Se não, redireciona para /login.
 */
const ProtectedRoute = () => {
  const { isAdmin, token } = useAuth(); // Pega o estado do nosso contexto

  // (Poderíamos adicionar uma verificação de 'isLoading' aqui também)

  if (!isAdmin || !token) {
    // Se não é admin, redireciona para a página de login
    return <Navigate to="/login" replace />;
  }

  // Se é admin, renderiza a página que está "dentro" (o <Outlet />)
  return <Outlet />; 
};

/**
 * Componente "Público"
 * Se o admin já está logado, redireciona para o dashboard
 * (impede o admin de ver a página de login de novo).
 */
const PublicRoute = () => {
  const { isAdmin } = useAuth();
  if (isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
};

/**
 * Componente principal da Aplicação
 * Define todas as URLs (rotas)
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
        <Route path="/dashboard" element={<DashboardPage />} />
        {/* No futuro, adicionaremos mais rotas protegidas aqui: */}
        {/* <Route path="/produtos" element={<ProdutosPage />} /> */}
        {/* <Route path="/estoque" element={<EstoquePage />} /> */}
        {/* <Route path="/tickets" element={<TicketsPage />} /> */}
      </Route>

      {/* Rota Padrão (Catch-all) */}
      {/* Se entrar em qualquer outra URL, redireciona para o login */}
      <Route 
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}

export default App;