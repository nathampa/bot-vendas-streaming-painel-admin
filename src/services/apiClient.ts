import type { IPedidoAdminEntregaRequest } from '../types/api.types';
import { httpClient } from './httpClient';

type UpdatePayload = Record<string, unknown>;

// -----------------------------------------------------------------
// PILAR 8: Autenticacao
// -----------------------------------------------------------------
export const loginAdmin = (formData: FormData) =>
  httpClient.post('/admin/login', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// -----------------------------------------------------------------
// PILAR 9: Dashboard
// -----------------------------------------------------------------
export const getDashboardKPIs = () => httpClient.get('/admin/dashboard/kpis');
export const getTopProdutos = () => httpClient.get('/admin/dashboard/top-produtos');
export const getEstoqueBaixo = (limite = 5) =>
  httpClient.get('/admin/dashboard/estoque-baixo', { params: { limite } });
export const getRecentPedidos = () => httpClient.get('/admin/dashboard/recentes-pedidos');

// -----------------------------------------------------------------
// PILAR 1: Produtos
// -----------------------------------------------------------------
export const getAdminProdutos = () => httpClient.get('/admin/produtos/');
export const createProduto = (data: {
  nome: string;
  descricao?: string;
  instrucoes_pos_compra?: string;
  preco: number;
  is_ativo: boolean;
  tipo_entrega: string;
}) => httpClient.post('/admin/produtos/', data);
export const updateProduto = (produtoId: string, data: UpdatePayload) =>
  httpClient.put(`/admin/produtos/${produtoId}`, data);
export const deleteProduto = (produtoId: string) => httpClient.delete(`/admin/produtos/${produtoId}`);

// -----------------------------------------------------------------
// PILAR 5: Estoque
// -----------------------------------------------------------------
export const getAdminEstoque = (params?: { produto_id?: string; requer_atencao?: boolean }) =>
  httpClient.get('/admin/estoque/', { params });
export const getEstoqueDetalhes = (estoqueId: string) => httpClient.get(`/admin/estoque/${estoqueId}`);
export const createEstoque = (data: {
  produto_id: string;
  login: string;
  senha: string;
  max_slots: number;
  data_expiracao?: string | null;
  instrucoes_especificas?: string | null;
}) => httpClient.post('/admin/estoque/', data);
export const updateEstoque = (estoqueId: string, data: UpdatePayload) =>
  httpClient.put(`/admin/estoque/${estoqueId}`, data);
export const deleteEstoque = (estoqueId: string) => httpClient.delete(`/admin/estoque/${estoqueId}`);

// -----------------------------------------------------------------
// PILAR 6: Tickets
// -----------------------------------------------------------------
export const getAdminTickets = (
  status: 'ABERTO' | 'EM_ANALISE' | 'RESOLVIDO' | 'FECHADO' | null,
) => httpClient.get('/admin/tickets/', { params: { status } });
export const getTicketDetalhes = (ticketId: string) => httpClient.get(`/admin/tickets/${ticketId}`);
export const resolverTicket = (
  ticketId: string,
  acao: 'TROCAR_CONTA' | 'REEMBOLSAR_CARTEIRA' | 'FECHAR_MANUALMENTE',
  mensagem?: string | null,
) => httpClient.post(`/admin/tickets/${ticketId}/resolver`, { acao, mensagem });

// -----------------------------------------------------------------
// PILAR 7: Gift Cards
// -----------------------------------------------------------------
export const getAdminGiftCards = (params?: { is_utilizado?: boolean }) =>
  httpClient.get('/admin/giftcards/', { params });
export const createGiftCard = (data: { valor: number; quantidade: number; codigo_personalizado?: string }) =>
  httpClient.post('/admin/giftcards/', data);
export const deleteGiftCard = (giftcardId: string) => httpClient.delete(`/admin/giftcards/${giftcardId}`);

// -----------------------------------------------------------------
// PILAR 4: Sugestoes
// -----------------------------------------------------------------
export const getAdminSugestoes = () => httpClient.get('/admin/sugestoes/');

export const getAdminPedidos = () => httpClient.get('/admin/pedidos/');
export const getPedidoDetalhes = (pedidoId: string) => httpClient.get(`/admin/pedidos/${pedidoId}/detalhes`);
export const entregarPedidoManual = (pedidoId: string, data: IPedidoAdminEntregaRequest) =>
  httpClient.post(`/admin/pedidos/${pedidoId}/entregar`, data);

// -----------------------------------------------------------------
// PILAR: Usuarios
// -----------------------------------------------------------------
export const getAdminUsuarios = () => httpClient.get('/admin/usuarios/');

// -----------------------------------------------------------------
// PILAR: Recargas
// -----------------------------------------------------------------
export const getAdminRecargas = () => httpClient.get('/admin/recargas/');

// -----------------------------------------------------------------
// PILAR: Configuracoes
// -----------------------------------------------------------------
export const getAdminConfig = () => httpClient.get('/admin/configuracoes/');
export const updateAdminConfig = (data: UpdatePayload) => httpClient.put('/admin/configuracoes/', data);

// -----------------------------------------------------------------
// PILAR: Contas Mae
// -----------------------------------------------------------------
export const getAdminContasMae = () => httpClient.get('/admin/contas-mae/');
export const getContaMaeDetalhes = (contaMaeId: string) => httpClient.get(`/admin/contas-mae/${contaMaeId}`);
export const createContaMae = (data: {
  produto_id: string;
  login: string;
  senha: string;
  max_slots: number;
  data_expiracao?: string | null;
  is_ativo: boolean;
}) => httpClient.post('/admin/contas-mae/', data);
export const updateContaMae = (contaMaeId: string, data: UpdatePayload) =>
  httpClient.put(`/admin/contas-mae/${contaMaeId}`, data);
export const deleteContaMae = (contaMaeId: string) => httpClient.delete(`/admin/contas-mae/${contaMaeId}`);
export const addContaMaeConvite = (contaMaeId: string, data: { email_cliente: string }) =>
  httpClient.post(`/admin/contas-mae/${contaMaeId}/convites`, data);

