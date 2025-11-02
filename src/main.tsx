import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Para gerenciar as rotas
import { AuthProvider } from './contexts/AuthContext'; // A nossa "memória" de login
import App from './App.tsx';
import './index.css'; // Estilos globais (Vite)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Ativa o sistema de rotas (URLs) */}
    <BrowserRouter>
      {/* Disponibiliza o login/logout para toda a aplicação */}
      <AuthProvider>
        <App /> {/* O seu componente principal da aplicação */}
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);