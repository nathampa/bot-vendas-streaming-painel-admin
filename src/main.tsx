import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import App from './App.tsx';

// 1. Importa o seu CSS global personalizado
import './index.css'; 
// 2. Removemos todas as importaÃ§Ãµes do @mui/material

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          {/* 3. Removemos o ThemeProvider e o CssBaseline */}
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);


