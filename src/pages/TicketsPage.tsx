import { useState, useEffect } from 'react';
// 1. Importa as 3 funções da API que usaremos
import { 
  getAdminTickets, 
  getTicketDetalhes, 
  resolverTicket 
} from '../services/apiClient';
// 2. Importa os tipos que acabamos de definir
import type { ITicketLista, ITicketDetalhes } from '../types/api.types';

type TicketStatus = 'ABERTO' | 'EM_ANALISE' | 'RESOLVIDO' | 'FECHADO' | null;

// --- O Componente da Página ---
export const TicketsPage = () => {

  // Estados para os dados da API
  const [tickets, setTickets] = useState<ITicketLista[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<ITicketDetalhes | null>(null);

  // Estados de UI
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<TicketStatus>('ABERTO');

  // 3. Função para carregar a LISTA de tickets
  const carregarTickets = async (status: TicketStatus) => {
    setIsLoadingList(true);
    setSelectedTicket(null); // Fecha os detalhes ao mudar o filtro
    try {
      const response = await getAdminTickets(status);
      setTickets(response.data);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar tickets:", err);
      setError("Falha ao carregar tickets.");
    } finally {
      setIsLoadingList(false);
    }
  };

  // 4. Efeito que roda UMA VEZ e sempre que o 'filterStatus' mudar
  useEffect(() => {
    carregarTickets(filterStatus);
  }, [filterStatus]); // Re-carrega a lista quando o filtro muda

  // 5. Função para ver os DETALHES de um ticket
  const handleVerDetalhes = async (ticketId: string) => {
    setIsLoadingDetails(true);
    setError(null);
    try {
      const response = await getTicketDetalhes(ticketId);
      setSelectedTicket(response.data);
    } catch (err) {
      console.error("Erro ao buscar detalhes do ticket:", err);
      setError("Falha ao carregar detalhes do ticket.");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // 6. Função para RESOLVER um ticket (Troca, Reembolso, etc.)
  const handleResolver = async (acao: 'TROCAR_CONTA' | 'REEMBOLSAR_CARTEIRA' | 'FECHAR_MANUALMENTE') => {
    if (!selectedTicket) return;

    const ticketId = selectedTicket.id;

    const confirmMsg = 
      acao === 'TROCAR_CONTA' ? "Tem certeza que deseja alocar uma NOVA conta para este usuário?" :
      acao === 'REEMBOLSAR_CARTEIRA' ? "Tem certeza que deseja REEMBOLSAR o valor para a carteira deste usuário?" :
      "Tem certeza que deseja fechar este ticket manualmente?";

    if (!window.confirm(confirmMsg)) {
      return; // Admin cancelou
    }

    setIsLoadingDetails(true); // Reutilizamos o loading
    try {
      // Chama a API, que vai enfileirar a tarefa no Celery
      await resolverTicket(ticketId, acao);

      alert("Solicitação de resolução enviada! O worker Celery está processando. A lista será atualizada.");

      // Fecha os detalhes e recarrega a lista
      setSelectedTicket(null);
      // O ticket aparecerá como 'EM_ANALISE'
      setFilterStatus('EM_ANALISE'); 
      // (Se o worker for rápido, ele já estará RESOLVIDO quando a lista recarregar)
      carregarTickets('EM_ANALISE');

    } catch (err: any) {
      console.error("Erro ao resolver ticket:", err);
      const errorMsg = err.response?.data?.detail || "Falha ao enviar solicitação.";
      alert(`Erro: ${errorMsg}`);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // --- 7. Lógica de Renderização ---
  return (
    <div style={{ fontFamily: 'sans-serif', display: 'flex', gap: '20px' }}>

      {/* Coluna da Lista de Tickets */}
      <div style={{ flex: 1 }}>
        <h1>🎟️ Fila de Suporte (Tickets)</h1>
        <p>Aqui você irá ver e resolver os tickets abertos pelos usuários.</p>

        {/* Filtros de Status */}
        <div style={{ marginBottom: '20px' }}>
          Filtar por:
          <button onClick={() => setFilterStatus('ABERTO')} style={{ background: filterStatus === 'ABERTO' ? '#ddd' : 'white' }}>Abertos</button>
          <button onClick={() => setFilterStatus('EM_ANALISE')} style={{ background: filterStatus === 'EM_ANALISE' ? '#ddd' : 'white' }}>Em Análise</button>
          <button onClick={() => setFilterStatus('RESOLVIDO')} style={{ background: filterStatus === 'RESOLVIDO' ? '#ddd' : 'white' }}>Resolvidos</button>
          <button onClick={() => setFilterStatus(null)} style={{ background: filterStatus === null ? '#ddd' : 'white' }}>Todos</button>
        </div>

        {/* Tabela de Tickets */}
        {isLoadingList ? (
          <p>Carregando tickets...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <table border={1} cellPadding={5} style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th>Status</th>
                <th>Motivo</th>
                <th>Data</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center' }}>Nenhum ticket encontrado para este filtro.</td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} style={{ 
                    background: selectedTicket?.id === ticket.id ? '#e0e0ff' : 'white',
                    cursor: 'pointer'
                  }}
                    onClick={() => handleVerDetalhes(ticket.id)}
                  >
                    <td>{ticket.status}</td>
                    <td>{ticket.motivo}</td>
                    <td>{new Date(ticket.criado_em).toLocaleString('pt-BR')}</td>
                    <td><button>Ver Detalhes</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Coluna de Detalhes do Ticket (Condicional) */}
      <div style={{ width: '400px', borderLeft: '2px solid #ccc', paddingLeft: '20px' }}>
        <h2>Detalhes do Ticket</h2>
        {isLoadingDetails ? (
          <p>Carregando detalhes...</p>
        ) : !selectedTicket ? (
          <p>Selecione um ticket da lista para ver os detalhes.</p>
        ) : (
          <div>
            <p><strong>ID:</strong> {selectedTicket.id}</p>
            <p><strong>Status:</strong> {selectedTicket.status}</p>
            <p><strong>Usuário (Telegram ID):</strong> {selectedTicket.usuario_telegram_id}</p>
            <p><strong>Produto:</strong> {selectedTicket.produto_nome}</p>
            <p><strong>Motivo:</strong> {selectedTicket.motivo}</p>
            {selectedTicket.descricao_outros && <p><strong>Descrição:</strong> {selectedTicket.descricao_outros}</p>}

            <hr />
            <h4>Conta Problemática:</h4>
            <p><strong>Login:</strong> {selectedTicket.conta_problematica.login}</p>
            <p><strong>Senha:</strong> {selectedTicket.conta_problematica.senha} (descriptografada)</p>
            <p><strong>(Slots:</strong> {selectedTicket.conta_problematica.slots_ocupados} / {selectedTicket.conta_problematica.max_slots})</p>

            <hr />

            {/* Botões de Ação (só aparecem se o ticket estiver aberto) */}
            {selectedTicket.status === 'ABERTO' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <strong>Ações de Resolução:</strong>
                <button 
                  style={{ background: '#a0e0a0' }}
                  onClick={() => handleResolver('TROCAR_CONTA')}
                >
                  🔁 Trocar Conta (Hot-Swap)
                </button>
                <button 
                  style={{ background: '#a0a0e0' }}
                  onClick={() => handleResolver('REEMBOLSAR_CARTEIRA')}
                >
                  💰 Reembolsar na Carteira
                </button>
                <button 
                  style={{ background: '#e0a0a0' }}
                  onClick={() => handleResolver('FECHAR_MANUALMENTE')}
                >
                  Manual (Apenas Fechar Ticket)
                </button>
              </div>
            )}

            <button onClick={() => setSelectedTicket(null)} style={{ marginTop: '20px' }}>
              Fechar Detalhes
            </button>
          </div>
        )}
      </div>

    </div>
  );
};