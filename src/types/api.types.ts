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

export type IUsuarioSaldoOperacao = 'ADICIONAR' | 'REMOVER' | 'DEFINIR';

export interface IUsuarioSaldoAjustePayload {
  operacao: IUsuarioSaldoOperacao;
  valor: number;
  motivo?: string | null;
}

export interface IUsuarioSaldoAjusteResponse {
  usuario_id: string;
  operacao: IUsuarioSaldoOperacao;
  valor: string;
  saldo_anterior: string;
  saldo_atual: string;
  motivo?: string | null;
  ajustado_em: string;
}

export interface IUsuarioSaldoHistoricoItem {
  id: string;
  operacao: IUsuarioSaldoOperacao;
  valor: string;
  saldo_anterior: string;
  saldo_atual: string;
  motivo?: string | null;
  criado_em: string;
  admin_id: string;
  admin_nome_completo: string;
  admin_telegram_id: number;
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
  emails_vinculados: string[];
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

export interface IEmailMonitorFolderState {
  id: string;
  folder_name: string;
  last_seen_uid: number | null;
  last_synced_at: string | null;
  last_success_at: string | null;
  last_error_at: string | null;
  last_error_message: string | null;
  consecutive_failures: number;
  next_retry_at: string | null;
}

export interface IEmailMonitorAccount {
  id: string;
  display_name: string;
  email: string;
  imap_host: string;
  imap_port: number;
  imap_username: string;
  use_ssl: boolean;
  is_active: boolean;
  selected_folders: string[];
  sync_interval_minutes: number;
  retain_irrelevant_days: number;
  last_synced_at: string | null;
  last_success_at: string | null;
  last_error_at: string | null;
  last_error_message: string | null;
  consecutive_failures: number;
  next_retry_at: string | null;
  sync_status: 'IDLE' | 'SYNCING' | 'SUCCESS' | 'FAILED' | 'DISABLED';
  created_at: string;
  updated_at: string;
  has_password: boolean;
}

export interface IEmailMonitorAccountDetail extends IEmailMonitorAccount {
  folder_states: IEmailMonitorFolderState[];
}

export interface IEmailMonitorConnectionTestResult {
  success: boolean;
  message: string;
  folders: string[];
}

export interface IEmailMonitorRule {
  id: string;
  name: string;
  account_id: string | null;
  sender_pattern: string | null;
  subject_pattern: string | null;
  body_keywords: string[];
  folder_pattern: string | null;
  category: string | null;
  mark_relevant: boolean;
  raise_dashboard_alert: boolean;
  highlight: boolean;
  enabled: boolean;
  priority: number;
  webhook_url: string | null;
  created_at: string;
  updated_at: string;
  scope_label: string;
}

export interface IEmailMonitorFailureItem {
  account_id: string;
  account_display_name: string;
  last_error_at: string | null;
  last_error_message: string | null;
  consecutive_failures: number;
  next_retry_at: string | null;
}

export interface IEmailMonitorAlertItem {
  id: string;
  account_id: string;
  account_display_name: string;
  message_id: string;
  category: string | null;
  sender_email: string | null;
  subject: string | null;
  is_read: boolean;
  webhook_status: 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
  created_at: string;
}

export interface IEmailMonitorOverviewMessageItem {
  id: string;
  account_id: string;
  account_display_name: string;
  sender_email: string | null;
  subject: string | null;
  sent_at: string | null;
  category: string | null;
  matched_rule_name: string | null;
  is_read_internal: boolean;
  is_highlighted: boolean;
}

export interface IEmailMonitorOverview {
  total_active_accounts: number;
  emails_synced_today: number;
  relevant_today: number;
  unread_alerts: number;
  recent_failures: IEmailMonitorFailureItem[];
  recent_relevant_messages: IEmailMonitorOverviewMessageItem[];
  recent_alerts: IEmailMonitorAlertItem[];
}

export interface IEmailMonitorMessageListItem {
  id: string;
  account_id: string;
  account_display_name: string;
  folder_name: string;
  sender_email: string | null;
  subject: string | null;
  sent_at: string | null;
  category: string | null;
  matched_rule_name: string | null;
  is_relevant: boolean;
  is_read_remote: boolean;
  is_read_internal: boolean;
  is_archived: boolean;
  is_highlighted: boolean;
  body_preview: string | null;
}

export interface IEmailMonitorMessageMatch {
  id: string;
  rule_id: string;
  rule_name: string;
  matched_at: string;
  reason_summary: string;
}

export interface IEmailMonitorMessageDetail {
  id: string;
  account_id: string;
  account_display_name: string;
  account_email: string;
  folder_name: string;
  sender_name: string | null;
  sender_email: string | null;
  recipient_email: string | null;
  subject: string | null;
  sent_at: string | null;
  internal_date: string | null;
  category: string | null;
  matched_rule_name: string | null;
  is_relevant: boolean;
  is_read_remote: boolean;
  is_read_internal: boolean;
  is_archived: boolean;
  is_highlighted: boolean;
  body_text: string | null;
  body_html_sanitized: string | null;
  headers: Record<string, unknown>;
  provider_message_url: string | null;
  matches: IEmailMonitorMessageMatch[];
}

export interface IEmailMonitorMessagesPage {
  items: IEmailMonitorMessageListItem[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface IEmailMonitorSyncResult {
  account_id: string;
  account_display_name: string;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  messages_scanned: number;
  messages_saved: number;
  relevant_messages: number;
  started_at: string;
  finished_at: string | null;
  error_message: string | null;
}

export interface IEmailMonitorSyncBatchResponse {
  results: IEmailMonitorSyncResult[];
}

export interface IEmailMonitorAuditLog {
  id: string;
  actor_usuario_id: string | null;
  event_type: string;
  resource_type: string;
  resource_id: string | null;
  message: string;
  metadata_json: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}
