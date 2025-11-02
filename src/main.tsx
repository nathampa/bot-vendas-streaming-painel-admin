import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import App from './App.tsx';

// --- IMPORTAÇÕES ADICIONADAS ---
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
// --- FIM DAS IMPORTAÇÕES ---

// Define o nosso tema. Por agora, apenas o "dark mode".
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {/* O "ThemeProvider" aplica o tema escuro a tudo */}
        <ThemeProvider theme={darkTheme}>
          {/* O "CssBaseline" corrige inconsistências do navegador */}
          <CssBaseline />
          <App />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);