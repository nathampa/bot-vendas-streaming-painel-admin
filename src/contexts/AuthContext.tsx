import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// Importa a nossa função de login da API
import { loginAdmin } from '../services/apiClient';

// 1. Define o "formato" (shape) do nosso contexto
interface AuthContextType {
  token: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

// 2. Cria o Contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Define as "props" (propriedades) que o nosso Provedor aceita
interface AuthProviderProps {
  children: ReactNode; // 'children' é a nossa aplicação React
}

// 4. Cria o "Provedor" (o componente que "guarda" a memória)
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Efeito que roda UMA VEZ quando a app carrega
  useEffect(() => {
    // Verifica se temos um token guardado do último login
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
      setIsAdmin(true);
    }
  }, []); // O '[]' significa "rodar apenas uma vez"

  // Função de Login
  const login = async (email: string, senha: string) => {
  setIsLoading(true);
  try {
    // 1. Prepara o FormData
    const formData = new FormData();
    formData.append('username', email); 
    formData.append('password', senha);

    // 2. Chama a API
    const response = await loginAdmin(formData);

    // --- ⬇️ LINHAS DE DEBUG ADICIONADAS ⬇️ ---
    console.log("Resposta COMPLETA da API recebida:", response);
    console.log("Dados da resposta (response.data):", response.data);
    // --- ⬆️ FIM DAS LINHAS DE DEBUG ⬆️ ---

    // 3. Sucesso! Pega o token
    const { access_token } = response.data;

    // 4. Guarda o token
    setToken(access_token);
    setIsAdmin(true);
    localStorage.setItem('authToken', access_token);
    setIsLoading(false);

  } catch (error: any) {

    // --- ⬇️ LINHA DE DEBUG ADICIONADA ⬇️ ---
    console.error("ERRO BRUTO (dentro do 'catch'):", error);
    // --- ⬆️ FIM DAS LINHAS DE DEBUG ⬆️ ---

    console.error("Erro no login:", error);
    setIsLoading(false);
    // Lança o erro para a página de Login poder mostrá-lo
    throw new Error("Email ou senha inválidos.");
  }
};

  // Função de Logout
  const logout = () => {
    setToken(null);
    setIsAdmin(false);
    localStorage.removeItem('authToken');
    // (Numa app maior, também chamaríamos uma API de /logout aqui)
  };

  return (
    <AuthContext.Provider value={{ token, isAdmin, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 5. Cria o "Hook" (o atalho para usar o contexto)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};