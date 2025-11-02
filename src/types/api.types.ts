// Em src/types/api.types.ts

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
  resolucao: 'N/A' | 'CONTA_TROCADA' | 'REEMBOLSO_CARTEIRA' | 'MANUAL';
  atualizado_em: string;

  // Campos extra que a API preenche
  usuario_telegram_id: number;
  produto_nome: string;
  conta_problematica: IEstoqueDetalhes;
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