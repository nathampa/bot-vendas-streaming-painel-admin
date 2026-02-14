/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { loginAdmin } from '../services/apiClient';
import { getApiErrorMessage } from '../utils/errors';

interface AuthContextType {
  token: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
      setIsAdmin(true);
    }
  }, []);

  const login = async (email: string, senha: string) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', senha);

      const response = await loginAdmin(formData);
      const { access_token } = response.data as { access_token: string };

      setToken(access_token);
      setIsAdmin(true);
      localStorage.setItem('authToken', access_token);
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, 'Email ou senha invalidos.'));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setIsAdmin(false);
    localStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider value={{ token, isAdmin, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

