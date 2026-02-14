// Este é o schema 'EstoqueAdminReadDetails'
export interface IEstoqueDetalhes {
  id: string;
  produto_id: string;
  login: string;
  max_slots: number;
  slots_ocupados: number;
  is_ativo: boolean;
  requer_atencao: boolean;
  senha: string | null; // A senha descriptografada
  // --- CAMPO ADICIONADO ---
  instrucoes_especificas: string | null;
}

// Este é o schema 'TicketAdminRead' (para a lista)
export interface ITicketLista {
  id: string;
  status: 'ABERTO' | 'EM_ANALISE' | 'RESOLVIDO' | 'FECHADO';
  motivo: 'LOGIN_INVALIDO' | 'SEM_ASSINATURA' | 'CONTA_CAIU' | 'OUTRO';
  criado_em: string;
  usuario_id: string;
  pedido_id: string;
}

// Este é o schema 'TicketAdminReadDetails' (para os detalhes)
export interface ITicketDetalhes extends ITicketLista {
  descricao_outros: string | null;
  resolucao: 'N/A' | 'CONTA_TROCADA' | 'REEMBOLSAR_CARTEIRA' | 'MANUAL';
  atualizado_em: string;

  // Campos extra que a API preenche
  usuario_telegram_id: number;
  produto_nome: string;
  conta_problematica: IEstoqueDetalhes | null;
}

export interface IGiftCardAdminRead {
  id: string;
  codigo: string;
  valor: string; // A API retorna Decimal como string
  is_utilizado: boolean;
  criado_em: string;
  utilizado_em: string | null;
  utilizado_por_telegram_id: number | null;
}

export interface ISugestaoAdminRead {
  nome_streaming: string;
  contagem: number;
  status: string;
}

export interface IDashboardRecentPedido {
  id: string;
  produto_nome: string;
  valor_pago: string;
  criado_em: string;
  usuario_telegram_id: number,
  nome_completo: string;
}

export interface IPedidoAdminList {
  id: string;
  criado_em: string;
  valor_pago: string;
  status_entrega: 'ENTREGUE' | 'PENDENTE';
  produto_nome: string;
  usuario_nome_completo: string;
  usuario_telegram_id: number;
  email_cliente: string | null;
}

export interface IPedidoAdminEntregaRequest {
  login: string;
  senha: string;
}

export interface IPedidoAdminConta {
  login: string;
  senha: string;
}

export interface IPedidoAdminContaMae {
  id: string;
  login: string;
  data_expiracao: string | null;
  dias_restantes: number | null;
}

export interface IPedidoAdminDetails extends IPedidoAdminList {
  conta: IPedidoAdminConta | null;
  conta_mae: IPedidoAdminContaMae | null;
}

// Schema 'UsuarioAdminRead'
export interface IUsuarioAdminList {
  id: string;
  telegram_id: number;
  nome_completo: string;
  saldo_carteira: string; // API envia Decimal como string
  criado_em: string;
  total_pedidos: number;
}

// Schema 'RecargaAdminRead'
export interface IRecargaAdminList {
  id: string;
  valor_solicitado: string;
  status_pagamento: 'PENDENTE' | 'PAGO' | 'FALHOU' | 'ESTORNADO';
  gateway_id: string | null;
  criado_em: string;
  pago_em: string | null;
  
  // Dados do JOIN
  usuario_telegram_id: number;
  usuario_nome_completo: string;
}

// Schema 'Configuracao'
export interface IConfiguracao {
  id: string;
  afiliado_ativo: boolean;
  afiliado_gatilho: 'primeira_recarga' | 'primeira_compra';
  afiliado_tipo_premio: 'cashback_pendente' | 'giftcard_imediato';
  afiliado_valor_premio: string; // Decimal vem como string
}

export interface IContaMae {
  id: string;
  produto_id: string;
  login: string;
  max_slots: number;
  slots_ocupados: number;
  is_ativo: boolean;
  data_expiracao: string | null;
  dias_restantes: number | null;
  total_convites: number | null;
}

export interface IContaMaeConvite {
  id: string;
  email_cliente: string;
  criado_em: string;
  pedido_id: string | null;
}

export interface IContaMaeDetalhes extends IContaMae {
  senha: string | null;
  convites: IContaMaeConvite[];
}

