import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // O nosso hook de autenticação
import { useNavigate } from 'react-router-dom'; // Para redirecionar

export const LoginPage = () => {
  // Estados locais para os campos do formulário
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Pega a função de login e o estado de "carregando" do nosso contexto
  const { login, isLoading } = useAuth();
  const navigate = useNavigate(); // Hook para redirecionar

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede o formulário de recarregar a página
    setError(null);

    try {
      // 1. Chama a função login (do AuthContext)
      await login(email, senha);

      // 2. Se o login deu certo, redireciona para o dashboard
      navigate('/dashboard'); 

    } catch (err: any) {
      // 3. Se o login falhou, mostra o erro
      setError(err.message || 'Erro desconhecido');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Painel Admin - Ferreira Streamings</h2>
      <h3>Login</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email: </label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ marginBottom: '10px' }}
          />
        </div>
        <div>
          <label>Senha: </label>
          <input 
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            style={{ marginBottom: '10px' }}
          />
        </div>

        {/* Mostra a mensagem de erro, se houver */}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
};