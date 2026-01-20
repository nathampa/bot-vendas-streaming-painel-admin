import axios from 'axios';
import type { IPedidoAdminEntregaRequest } from '../types/api.types';

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
};

// -----------------------------------------------------------------
// PILAR 8: Autenticação
// -----------------------------------------------------------------

export const loginAdmin = (formData: FormData) => {
  return axios.post(`${VITE_API_BASE_URL}/admin/login`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// -----------------------------------------------------------------
// PILAR 9: Dashboard
// -----------------------------------------------------------------
export const getDashboardKPIs = () => {
  return axios.get(`${VITE_API_BASE_URL}/admin/dashboard/kpis`, {
    headers: getAuthHeaders(),
  });
};

export const getTopProdutos = () => {
  return axios.get(`${VITE_API_BASE_URL}/admin/dashboard/top-produtos`, {
    headers: getAuthHeaders(),
  });
};

export const getEstoqueBaixo = (limite: number = 5) => {
  return axios.get(`${VITE_API_BASE_URL}/admin/dashboard/estoque-baixo`, {
    headers: getAuthHeaders(),
    params: { limite },
  });
};

export const getRecentPedidos = () => {
  return axios.get(`${VITE_API_BASE_URL}/admin/dashboard/recentes-pedidos`, {
    headers: getAuthHeaders(),
  });
};

// -----------------------------------------------------------------
// PILAR 1: Produtos
// -----------------------------------------------------------------
export const getAdminProdutos = () => {
  return axios.get(`${VITE_API_BASE_URL}/admin/produtos/`, {
    headers: getAuthHeaders(),
  });
};

export const createProduto = (data: { 
  nome: string; 
  descricao?: string; 
  instrucoes_pos_compra?: string;
  preco: number; 
  is_ativo: boolean;
  tipo_entrega: string;
}) => {
  return axios.post(`${VITE_API_BASE_URL}/admin/produtos/`, data, {
    headers: getAuthHeaders(),
  });
};

export const updateProduto = (produtoId: string, data: any) => {
  return axios.put(`${VITE_API_BASE_URL}/admin/produtos/${produtoId}`, data, {
    headers: getAuthHeaders(),
  });
};

export const deleteProduto = (produtoId: string) => {
  return axios.delete(`${VITE_API_BASE_URL}/admin/produtos/${produtoId}`, {
    headers: getAuthHeaders(),
  });
};

// -----------------------------------------------------------------
// PILAR 5: Estoque
// -----------------------------------------------------------------
export const getAdminEstoque = (params?: { produto_id?: string; requer_atencao?: boolean }) => {
  return axios.get(`${VITE_API_BASE_URL}/admin/estoque/`, {
    headers: getAuthHeaders(),
    params: params,
  });
};

export const getEstoqueDetalhes = (estoqueId: string) => {
  return axios.get(`${VITE_API_BASE_URL}/admin/estoque/${estoqueId}`, {
    headers: getAuthHeaders(),
  });
};

export const createEstoque = (data: { 
  produto_id: string; 
  login: string; 
  senha: string; 
  max_slots: number; 
  data_expiracao?: string | null; 
  instrucoes_especificas?: string | null; 
}) => {
  return axios.post(`${VITE_API_BASE_URL}/admin/estoque/`, data, {
    headers: getAuthHeaders(),
  });
};


export const updateEstoque = (estoqueId: string, data: any) => {
  return axios.put(`${VITE_API_BASE_URL}/admin/estoque/${estoqueId}`, data, {
    headers: getAuthHeaders(),
  });
};

export const deleteEstoque = (estoqueId: string) => {
  return axios.delete(`${VITE_API_BASE_URL}/admin/estoque/${estoqueId}`, {
    headers: getAuthHeaders(),
  });
};

// -----------------------------------------------------------------
// PILAR 6: Tickets
// -----------------------------------------------------------------
export const getAdminTickets = (status: 'ABERTO' | 'EM_ANALISE' | 'RESOLVIDO' | 'FECHADO' | null) => {
  return axios.get(`${VITE_API_BASE_URL}/admin/tickets/`, {
    headers: getAuthHeaders(),
    params: { status: status },
  });
};

export const getTicketDetalhes = (ticketId: string) => {
  return axios.get(`${VITE_API_BASE_URL}/admin/tickets/${ticketId}`, {
    headers: getAuthHeaders(),
  });
};

export const resolverTicket = (
  ticketId: string,
  acao: 'TROCAR_CONTA' | 'REEMBOLSAR_CARTEIRA' | 'FECHAR_MANUALMENTE',
  mensagem?: string | null
) => {
  return axios.post(`${VITE_API_BASE_URL}/admin/tickets/${ticketId}/resolver`, { acao, mensagem }, {
    headers: getAuthHeaders(),
  });
};

// -----------------------------------------------------------------
// PILAR 7: Gift Cards
// -----------------------------------------------------------------
export const getAdminGiftCards = (params?: { is_utilizado?: boolean }) => {
  return axios.get(`${VITE_API_BASE_URL}/admin/giftcards/`, {
    headers: getAuthHeaders(),
    params: params,
  });
};

export const createGiftCard = (data: { valor: number; quantidade: number; codigo_personalizado?: string }) => {
  return axios.post(`${VITE_API_BASE_URL}/admin/giftcards/`, data, {
    headers: getAuthHeaders(),
  });
};

export const deleteGiftCard = (giftcardId: string) => {
  return axios.delete(`${VITE_API_BASE_URL}/admin/giftcards/${giftcardId}`, {
    headers: getAuthHeaders(),
  });
};

// -----------------------------------------------------------------
// PILAR 4: Sugestões
// -----------------------------------------------------------------
export const getAdminSugestoes = () => {
  return axios.get(`${VITE_API_BASE_URL}/admin/sugestoes/`, {
    headers: getAuthHeaders(),
  });
};

export const getAdminPedidos = () => {
  return axios.get(`${VITE_API_BASE_URL}/admin/pedidos/`, {
    headers: getAuthHeaders(),
  });
};

export const getPedidoDetalhes = (pedidoId: string) => {
  return axios.get(`${VITE_API_BASE_URL}/admin/pedidos/${pedidoId}/detalhes`, {
    headers: getAuthHeaders(),
  });
};

// NOVA FUNÇÃO: Entregar Pedido Manual
export const entregarPedidoManual = (pedidoId: string, data: IPedidoAdminEntregaRequest) => {
  return axios.post(`${VITE_API_BASE_URL}/admin/pedidos/${pedidoId}/entregar`, data, {
    headers: getAuthHeaders(),
  });
};

// -----------------------------------------------------------------
// PILAR: Usuários
// -----------------------------------------------------------------
export const getAdminUsuarios = () => {
  return axios.get(`${VITE_API_BASE_URL}/admin/usuarios/`, {
    headers: getAuthHeaders(),
  });
};

// -----------------------------------------------------------------
// PILAR: Recargas
// -----------------------------------------------------------------
export const getAdminRecargas = () => {
  return axios.get(`${VITE_API_BASE_URL}/admin/recargas/`, {
    headers: getAuthHeaders(),
  });
};

// -----------------------------------------------------------------
// PILAR: Configurações
// -----------------------------------------------------------------
export const getAdminConfig = () => {
  return axios.get(`${VITE_API_BASE_URL}/admin/configuracoes/`, {
    headers: getAuthHeaders(),
  });
};

export const updateAdminConfig = (data: any) => {
  return axios.put(`${VITE_API_BASE_URL}/admin/configuracoes/`, data, {
    headers: getAuthHeaders(),
  });
};
