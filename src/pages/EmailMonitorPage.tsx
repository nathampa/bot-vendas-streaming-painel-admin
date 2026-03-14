import { useEffect, useMemo, useRef, useState } from 'react';
import MailOutlineOutlinedIcon from '@mui/icons-material/MailOutlineOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import SyncOutlinedIcon from '@mui/icons-material/SyncOutlined';
import RuleFolderOutlinedIcon from '@mui/icons-material/RuleFolderOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import VolumeUpOutlinedIcon from '@mui/icons-material/VolumeUpOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import LaunchOutlinedIcon from '@mui/icons-material/LaunchOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import DoneOutlinedIcon from '@mui/icons-material/DoneOutlined';
import type {
  IEmailMonitorAccount,
  IEmailMonitorAlertItem,
  IEmailMonitorAuditLog,
  IEmailMonitorMessageDetail,
  IEmailMonitorMessagesPage,
  IEmailMonitorOverview,
  IEmailMonitorRule,
} from '../types/api.types';
import {
  acknowledgeEmailMonitorAlert,
  createEmailMonitorAccount,
  createEmailMonitorRule,
  deleteEmailMonitorAccount,
  getEmailMonitorAccounts,
  getEmailMonitorAlerts,
  getEmailMonitorAudit,
  getEmailMonitorMessage,
  getEmailMonitorMessages,
  getEmailMonitorOverview,
  getEmailMonitorRules,
  syncAllEmailMonitorAccounts,
  syncEmailMonitorAccount,
  testEmailMonitorConnection,
  updateEmailMonitorAccount,
  updateEmailMonitorMessage,
  updateEmailMonitorRule,
} from '../services/apiClient';
import { useToast } from '../contexts/ToastContext';
import { getApiErrorMessage } from '../utils/errors';
import { Alert, Badge, Button, Card, EmptyState, Input, LoadingSpinner, MetricCard, PageHeader, PanelCard, Select } from '../components/UI';

type TabKey = 'dashboard' | 'accounts' | 'rules' | 'messages' | 'audit';

type AccountFormState = {
  id: string | null;
  display_name: string;
  email: string;
  imap_host: string;
  imap_port: number;
  imap_username: string;
  password: string;
  use_ssl: boolean;
  is_active: boolean;
  selected_folders: string;
  sync_interval_minutes: number;
  retain_irrelevant_days: number;
};

type RuleFormState = {
  id: string | null;
  name: string;
  account_id: string;
  sender_pattern: string;
  subject_pattern: string;
  body_keywords: string;
  folder_pattern: string;
  category: string;
  mark_relevant: boolean;
  raise_dashboard_alert: boolean;
  highlight: boolean;
  enabled: boolean;
  priority: number;
  webhook_url: string;
};

const defaultAccountForm: AccountFormState = {
  id: null,
  display_name: '',
  email: '',
  imap_host: 'imap.gmail.com',
  imap_port: 993,
  imap_username: '',
  password: '',
  use_ssl: true,
  is_active: true,
  selected_folders: 'INBOX',
  sync_interval_minutes: 5,
  retain_irrelevant_days: 3,
};

const defaultRuleForm: RuleFormState = {
  id: null,
  name: '',
  account_id: '',
  sender_pattern: '',
  subject_pattern: '',
  body_keywords: '',
  folder_pattern: 'INBOX',
  category: '',
  mark_relevant: true,
  raise_dashboard_alert: true,
  highlight: true,
  enabled: true,
  priority: 100,
  webhook_url: '',
};

const tabs: { key: TabKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'accounts', label: 'Contas' },
  { key: 'rules', label: 'Regras' },
  { key: 'messages', label: 'Mensagens' },
  { key: 'audit', label: 'Auditoria' },
];

const formatDateTime = (value: string | null) => {
  if (!value) return '-';
  const iso = value.endsWith('Z') ? value : `${value}Z`;
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
};

const formatRelativeWindow = (value: string | null) => {
  if (!value) return 'nunca';
  const deltaMs = Date.now() - new Date(value.endsWith('Z') ? value : `${value}Z`).getTime();
  const deltaMinutes = Math.round(deltaMs / 60000);
  if (deltaMinutes < 1) return 'agora';
  if (deltaMinutes < 60) return `${deltaMinutes} min`; 
  const deltaHours = Math.round(deltaMinutes / 60);
  if (deltaHours < 24) return `${deltaHours} h`;
  return `${Math.round(deltaHours / 24)} d`;
};

const splitCsv = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const getStatusVariant = (status: string) => {
  if (status === 'SUCCESS' || status === 'IDLE' || status === 'SENT') return 'success';
  if (status === 'SYNCING' || status === 'PENDING') return 'info';
  if (status === 'FAILED') return 'error';
  return 'warning';
};

const playNotificationTone = () => {
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const ctx = new AudioContextClass();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.value = 880;
  gain.gain.value = 0.0001;
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
  oscillator.stop(ctx.currentTime + 0.36);
};

export const EmailMonitorPage = () => {
  const { showToast } = useToast();
  const [tab, setTab] = useState<TabKey>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<IEmailMonitorOverview | null>(null);
  const [accounts, setAccounts] = useState<IEmailMonitorAccount[]>([]);
  const [rules, setRules] = useState<IEmailMonitorRule[]>([]);
  const [alerts, setAlerts] = useState<IEmailMonitorAlertItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<IEmailMonitorAuditLog[]>([]);
  const [messagesPage, setMessagesPage] = useState<IEmailMonitorMessagesPage | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<IEmailMonitorMessageDetail | null>(null);
  const [accountForm, setAccountForm] = useState<AccountFormState>(defaultAccountForm);
  const [ruleForm, setRuleForm] = useState<RuleFormState>(defaultRuleForm);
  const [searchInput, setSearchInput] = useState('');
  const [messageFilters, setMessageFilters] = useState({
    account_id: '',
    sender: '',
    category: '',
    days: '7',
    relevant_only: true,
    archived: 'false',
    page: 1,
    page_size: 20,
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isSubmittingAccount, setIsSubmittingAccount] = useState(false);
  const [isSubmittingRule, setIsSubmittingRule] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const previousUnreadAlerts = useRef(0);

  const debouncedSearch = useDebouncedValue(searchInput, 350);

  const loadMessages = async (nextPage = messageFilters.page) => {
    setIsMessagesLoading(true);
    try {
      const response = await getEmailMonitorMessages({
        account_id: messageFilters.account_id || undefined,
        sender: messageFilters.sender || undefined,
        category: messageFilters.category || undefined,
        days: messageFilters.days ? Number(messageFilters.days) : undefined,
        relevant_only: messageFilters.relevant_only,
        archived: messageFilters.archived === 'all' ? undefined : messageFilters.archived === 'true',
        search: debouncedSearch || undefined,
        page: nextPage,
        page_size: messageFilters.page_size,
      });
      setMessagesPage(response.data);
      setMessageFilters((current) => ({ ...current, page: nextPage }));
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, 'Falha ao carregar mensagens.'), 'error');
    } finally {
      setIsMessagesLoading(false);
    }
  };

  const loadModuleData = async () => {
    setIsLoading(true);
    try {
      const [overviewRes, accountsRes, rulesRes, alertsRes, auditRes, messagesRes] = await Promise.all([
        getEmailMonitorOverview(),
        getEmailMonitorAccounts(),
        getEmailMonitorRules(),
        getEmailMonitorAlerts(false),
        getEmailMonitorAudit(60),
        getEmailMonitorMessages({ page: 1, page_size: messageFilters.page_size, relevant_only: true, days: 7, archived: false }),
      ]);
      setOverview(overviewRes.data);
      setAccounts(accountsRes.data);
      setRules(rulesRes.data);
      setAlerts(alertsRes.data);
      setAuditLogs(auditRes.data);
      setMessagesPage(messagesRes.data);
      setError(null);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Falha ao carregar o módulo de email.'));
    } finally {
      setIsLoading(false);
    }
  };

  const refreshOverviewOnly = async () => {
    try {
      const [overviewRes, alertsRes] = await Promise.all([getEmailMonitorOverview(), getEmailMonitorAlerts(false)]);
      setOverview(overviewRes.data);
      setAlerts(alertsRes.data);
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, 'Falha ao atualizar o dashboard do módulo.'), 'error');
    }
  };

  useEffect(() => {
    loadModuleData();
  }, []);

  useEffect(() => {
    loadMessages(1);
  }, [debouncedSearch, messageFilters.account_id, messageFilters.sender, messageFilters.category, messageFilters.days, messageFilters.relevant_only, messageFilters.archived]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const intervalId = window.setInterval(() => {
      refreshOverviewOnly();
      loadMessages(messageFilters.page);
    }, 30000);
    return () => window.clearInterval(intervalId);
  }, [autoRefresh, debouncedSearch, messageFilters]);

  useEffect(() => {
    const unreadAlerts = overview?.unread_alerts ?? 0;
    if (soundEnabled && previousUnreadAlerts.current && unreadAlerts > previousUnreadAlerts.current) {
      playNotificationTone();
    }
    previousUnreadAlerts.current = unreadAlerts;
  }, [overview?.unread_alerts, soundEnabled]);

  const accountOptions = useMemo(
    () => [{ value: '', label: 'Global' }, ...accounts.map((account) => ({ value: account.id, label: account.display_name }))],
    [accounts],
  );

  const categories = useMemo(() => {
    const unique = new Set<string>();
    rules.forEach((rule) => rule.category && unique.add(rule.category));
    messagesPage?.items.forEach((message) => message.category && unique.add(message.category));
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [messagesPage?.items, rules]);

  const resetAccountForm = () => setAccountForm(defaultAccountForm);
  const resetRuleForm = () => setRuleForm(defaultRuleForm);

  const handleEditAccount = (account: IEmailMonitorAccount) => {
    setTab('accounts');
    setAccountForm({
      id: account.id,
      display_name: account.display_name,
      email: account.email,
      imap_host: account.imap_host,
      imap_port: account.imap_port,
      imap_username: account.imap_username,
      password: '',
      use_ssl: account.use_ssl,
      is_active: account.is_active,
      selected_folders: account.selected_folders.join(', '),
      sync_interval_minutes: account.sync_interval_minutes,
      retain_irrelevant_days: account.retain_irrelevant_days,
    });
  };

  const handleEditRule = (rule: IEmailMonitorRule) => {
    setTab('rules');
    setRuleForm({
      id: rule.id,
      name: rule.name,
      account_id: rule.account_id ?? '',
      sender_pattern: rule.sender_pattern ?? '',
      subject_pattern: rule.subject_pattern ?? '',
      body_keywords: rule.body_keywords.join(', '),
      folder_pattern: rule.folder_pattern ?? 'INBOX',
      category: rule.category ?? '',
      mark_relevant: rule.mark_relevant,
      raise_dashboard_alert: rule.raise_dashboard_alert,
      highlight: rule.highlight,
      enabled: rule.enabled,
      priority: rule.priority,
      webhook_url: rule.webhook_url ?? '',
    });
  };

  const submitAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmittingAccount(true);
    try {
      const payload = {
        display_name: accountForm.display_name.trim(),
        email: accountForm.email.trim(),
        imap_host: accountForm.imap_host.trim(),
        imap_port: Number(accountForm.imap_port),
        imap_username: accountForm.imap_username.trim(),
        password: accountForm.password,
        use_ssl: accountForm.use_ssl,
        is_active: accountForm.is_active,
        selected_folders: splitCsv(accountForm.selected_folders),
        sync_interval_minutes: Number(accountForm.sync_interval_minutes),
        retain_irrelevant_days: Number(accountForm.retain_irrelevant_days),
      };
      if (accountForm.id) {
        const updatePayload: Record<string, unknown> = { ...payload };
        if (!payload.password) delete updatePayload.password;
        await updateEmailMonitorAccount(accountForm.id, updatePayload);
        showToast('Conta IMAP atualizada com sucesso.', 'success');
      } else {
        if (!payload.password) {
          showToast('A senha é obrigatória para criar uma conta.', 'warning');
          return;
        }
        await createEmailMonitorAccount(payload);
        showToast('Conta IMAP criada com sucesso.', 'success');
      }
      resetAccountForm();
      await loadModuleData();
      await refreshOverviewOnly();
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, 'Falha ao salvar a conta IMAP.'), 'error');
    } finally {
      setIsSubmittingAccount(false);
    }
  };

  const submitRule = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmittingRule(true);
    try {
      const payload = {
        name: ruleForm.name.trim(),
        account_id: ruleForm.account_id || null,
        sender_pattern: ruleForm.sender_pattern.trim() || null,
        subject_pattern: ruleForm.subject_pattern.trim() || null,
        body_keywords: splitCsv(ruleForm.body_keywords),
        folder_pattern: ruleForm.folder_pattern.trim() || null,
        category: ruleForm.category.trim() || null,
        mark_relevant: ruleForm.mark_relevant,
        raise_dashboard_alert: ruleForm.raise_dashboard_alert,
        highlight: ruleForm.highlight,
        enabled: ruleForm.enabled,
        priority: Number(ruleForm.priority),
        webhook_url: ruleForm.webhook_url.trim() || null,
      };
      if (ruleForm.id) {
        await updateEmailMonitorRule(ruleForm.id, payload);
        showToast('Regra atualizada com sucesso.', 'success');
      } else {
        await createEmailMonitorRule(payload);
        showToast('Regra criada com sucesso.', 'success');
      }
      resetRuleForm();
      const rulesRes = await getEmailMonitorRules();
      setRules(rulesRes.data);
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, 'Falha ao salvar a regra.'), 'error');
    } finally {
      setIsSubmittingRule(false);
    }
  };

  const runConnectionTest = async () => {
    if (!accountForm.password) {
      showToast('Informe a senha temporariamente para testar a conexão.', 'warning');
      return;
    }
    setIsTestingConnection(true);
    try {
      const response = await testEmailMonitorConnection({
        display_name: accountForm.display_name,
        email: accountForm.email,
        imap_host: accountForm.imap_host,
        imap_port: Number(accountForm.imap_port),
        imap_username: accountForm.imap_username,
        password: accountForm.password,
        use_ssl: accountForm.use_ssl,
      });
      if (response.data.success) {
        showToast(response.data.message, 'success');
        if (response.data.folders.length) {
          setAccountForm((current) => ({ ...current, selected_folders: response.data.folders.slice(0, 3).join(', ') }));
        }
      } else {
        showToast(response.data.message, 'error');
      }
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, 'Falha ao testar a conexão IMAP.'), 'error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const runSyncAll = async () => {
    try {
      const response = await syncAllEmailMonitorAccounts(true);
      showToast(`Sincronização executada em ${response.data.results.length} conta(s).`, 'success');
      await loadModuleData();
      await loadMessages(messageFilters.page);
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, 'Falha ao sincronizar as contas.'), 'error');
    }
  };

  const runSyncAccount = async (accountId: string) => {
    try {
      const response = await syncEmailMonitorAccount(accountId, true);
      const tone = response.data.status === 'FAILED' ? 'warning' : 'success';
      showToast(`Sincronização ${response.data.status === 'FAILED' ? 'com falha' : 'concluída'} para ${response.data.account_display_name}.`, tone);
      await loadModuleData();
      await loadMessages(messageFilters.page);
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, 'Falha ao sincronizar a conta.'), 'error');
    }
  };

  const toggleAccountStatus = async (account: IEmailMonitorAccount) => {
    try {
      await updateEmailMonitorAccount(account.id, { is_active: !account.is_active });
      showToast(`Conta ${account.is_active ? 'desativada' : 'ativada'} com sucesso.`, 'success');
      const accountsRes = await getEmailMonitorAccounts();
      setAccounts(accountsRes.data);
      await refreshOverviewOnly();
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, 'Falha ao atualizar status da conta.'), 'error');
    }
  };

  const removeAccount = async (account: IEmailMonitorAccount) => {
    const confirmed = window.confirm(
      `Excluir permanentemente a conta "${account.display_name}"?\n\nEssa ação remove a conta do banco e apaga mensagens, regras por conta, alertas e histórico de sync relacionados.`,
    );
    if (!confirmed) return;

    try {
      await deleteEmailMonitorAccount(account.id);
      if (accountForm.id === account.id) {
        resetAccountForm();
      }
      if (selectedMessage?.account_id === account.id) {
        setSelectedMessage(null);
      }
      showToast('Conta IMAP excluída permanentemente.', 'success');
      await loadModuleData();
      await refreshOverviewOnly();
      await loadMessages(1);
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, 'Falha ao excluir a conta IMAP.'), 'error');
    }
  };

  const openMessage = async (messageId: string) => {
    try {
      const response = await getEmailMonitorMessage(messageId);
      setSelectedMessage(response.data);
      if (!response.data.is_read_internal) {
        await updateEmailMonitorMessage(messageId, { is_read_internal: true });
        await loadMessages(messageFilters.page);
        await refreshOverviewOnly();
      }
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, 'Falha ao abrir os detalhes da mensagem.'), 'error');
    }
  };

  const updateSelectedMessage = async (patch: Record<string, unknown>) => {
    if (!selectedMessage) return;
    try {
      const response = await updateEmailMonitorMessage(selectedMessage.id, patch);
      setSelectedMessage(response.data);
      await loadMessages(messageFilters.page);
      await refreshOverviewOnly();
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, 'Falha ao atualizar a mensagem.'), 'error');
    }
  };

  const handleAckAlert = async (alertId: string) => {
    try {
      await acknowledgeEmailMonitorAlert(alertId);
      const [alertsRes, overviewRes] = await Promise.all([getEmailMonitorAlerts(false), getEmailMonitorOverview()]);
      setAlerts(alertsRes.data);
      setOverview(overviewRes.data);
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, 'Falha ao confirmar o alerta.'), 'error');
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Carregando módulo de email monitor..." />;
  }

  return (
    <div style={styles.container}>
      <style>{pageStyles}</style>
      <PageHeader
        title="Email Monitor"
        subtitle="Monitor transacional IMAP com triagem operacional, sincronização incremental e alertas internos."
        icon={<MailOutlineOutlinedIcon fontSize="small" />}
        action={(
          <div style={styles.headerActions}>
            <button type="button" onClick={() => setAutoRefresh((current) => !current)} style={styles.togglePill}>
              <ScheduleOutlinedIcon sx={{ fontSize: 16 }} />
              Auto-refresh {autoRefresh ? 'ativo' : 'pausado'}
            </button>
            <button type="button" onClick={() => setSoundEnabled((current) => !current)} style={styles.togglePill}>
              <VolumeUpOutlinedIcon sx={{ fontSize: 16 }} />
              Som {soundEnabled ? 'ligado' : 'desligado'}
            </button>
            <Button onClick={runSyncAll} style={{ paddingInline: 18 }}>
              <SyncOutlinedIcon sx={{ fontSize: 16, marginRight: '6px', verticalAlign: 'text-bottom' }} />
              Sincronizar tudo
            </Button>
          </div>
        )}
      />

      {error && <Alert variant="error">{error}</Alert>}

      <div style={styles.tabRow}>
        {tabs.map((item) => {
          const isActive = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              style={{ ...styles.tabButton, ...(isActive ? styles.tabButtonActive : {}) }}
            >
              {item.label}
              {item.key === 'dashboard' && (overview?.unread_alerts ?? 0) > 0 ? (
                <span style={styles.tabCounter}>{overview?.unread_alerts}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tab === 'dashboard' && overview && (
        <div style={styles.sectionStack}>
          <div style={styles.metricsGrid}>
            <MetricCard label="Contas Ativas" value={overview.total_active_accounts} icon={<InboxOutlinedIcon fontSize="small" />} tone="info" />
            <MetricCard label="Emails Sincronizados Hoje" value={overview.emails_synced_today} icon={<SyncOutlinedIcon fontSize="small" />} tone="success" />
            <MetricCard label="Relevantes Hoje" value={overview.relevant_today} icon={<MarkEmailReadOutlinedIcon fontSize="small" />} tone="warning" />
            <MetricCard label="Alertas em Aberto" value={overview.unread_alerts} icon={<WarningAmberOutlinedIcon fontSize="small" />} tone={overview.unread_alerts > 0 ? 'danger' : 'success'} />
          </div>

          <div style={styles.twoColumnGrid}>
            <PanelCard>
              <div style={styles.panelHeader}>
                <div>
                  <h3 style={styles.panelTitle}>Mensagens relevantes recentes</h3>
                  <p style={styles.panelSubtitle}>Somente mensagens classificadas pelas regras.</p>
                </div>
                <Badge variant="info">{overview.recent_relevant_messages.length} itens</Badge>
              </div>
              {overview.recent_relevant_messages.length ? (
                <div style={styles.listBlock}>
                  {overview.recent_relevant_messages.map((message) => (
                    <button key={message.id} type="button" style={styles.feedItem} onClick={() => { setTab('messages'); void openMessage(message.id); }}>
                      <div>
                        <strong style={styles.feedTitle}>{message.subject || '(sem assunto)'}</strong>
                        <p style={styles.feedMeta}>{message.account_display_name} · {message.sender_email || 'remetente não informado'}</p>
                      </div>
                      <div style={styles.feedAside}>
                        {message.category && <Badge variant="info">{message.category}</Badge>}
                        <span>{formatDateTime(message.sent_at)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState icon={<MarkEmailReadOutlinedIcon />} title="Nenhuma mensagem relevante ainda" description="As mensagens classificadas aparecerão aqui conforme as regras forem disparadas." />
              )}
            </PanelCard>

            <PanelCard>
              <div style={styles.panelHeader}>
                <div>
                  <h3 style={styles.panelTitle}>Alertas internos</h3>
                  <p style={styles.panelSubtitle}>Notificações geradas por regras com alerta habilitado.</p>
                </div>
                <Badge variant={overview.unread_alerts > 0 ? 'error' : 'success'}>{overview.unread_alerts} não lidos</Badge>
              </div>
              {alerts.length ? (
                <div style={styles.listBlock}>
                  {alerts.slice(0, 8).map((alert) => (
                    <div key={alert.id} style={styles.feedItemStatic}>
                      <div>
                        <strong style={styles.feedTitle}>{alert.subject || '(sem assunto)'}</strong>
                        <p style={styles.feedMeta}>{alert.account_display_name} · {alert.sender_email || 'remetente não informado'}</p>
                      </div>
                      <div style={styles.feedAside}>
                        <Badge variant={getStatusVariant(alert.webhook_status)}>{alert.webhook_status}</Badge>
                        {!alert.is_read && <Button variant="secondary" onClick={() => handleAckAlert(alert.id)} style={styles.smallButton}>Marcar lido</Button>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={<WarningAmberOutlinedIcon />} title="Sem alertas pendentes" description="Os alertas aparecem quando uma regra relevante dispara no sincronizador." />
              )}
            </PanelCard>
          </div>

          <PanelCard>
            <div style={styles.panelHeader}>
              <div>
                <h3 style={styles.panelTitle}>Falhas recentes de sincronização</h3>
                <p style={styles.panelSubtitle}>Retentativas seguem backoff exponencial sem derrubar o sistema.</p>
              </div>
              <Badge variant={overview.recent_failures.length ? 'warning' : 'success'}>
                {overview.recent_failures.length ? 'Atenção' : 'Saudável'}
              </Badge>
            </div>
            {overview.recent_failures.length ? (
              <div style={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Conta</th>
                      <th>Último erro</th>
                      <th>Falhas</th>
                      <th>Próxima tentativa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.recent_failures.map((failure) => (
                      <tr key={failure.account_id}>
                        <td>{failure.account_display_name}</td>
                        <td title={failure.last_error_message || ''}>{failure.last_error_message || '-'}</td>
                        <td>{failure.consecutive_failures}</td>
                        <td>{formatDateTime(failure.next_retry_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={<DoneOutlinedIcon />} title="Sem falhas recentes" description="As contas ativas estão sincronizando normalmente." />
            )}
          </PanelCard>
        </div>
      )}

      {tab === 'accounts' && (
        <div style={styles.sectionStack}>
          <div style={styles.formAndTableGrid}>
            <Card>
              <div style={styles.formHeader}>
                <h3 style={styles.panelTitle}>{accountForm.id ? 'Editar conta IMAP' : 'Nova conta IMAP'}</h3>
                <button type="button" onClick={resetAccountForm} style={styles.linkButton}>Limpar</button>
              </div>
              <form onSubmit={submitAccount} style={styles.formGrid}>
                <Input label="Nome interno" value={accountForm.display_name} onChange={(e) => setAccountForm((c) => ({ ...c, display_name: e.target.value }))} required />
                <Input label="Email" value={accountForm.email} onChange={(e) => setAccountForm((c) => ({ ...c, email: e.target.value }))} required />
                <Input label="Host IMAP" value={accountForm.imap_host} onChange={(e) => setAccountForm((c) => ({ ...c, imap_host: e.target.value }))} required />
                <Input label="Porta" type="number" value={accountForm.imap_port} onChange={(e) => setAccountForm((c) => ({ ...c, imap_port: Number(e.target.value) }))} required />
                <Input label="Usuário IMAP" value={accountForm.imap_username} onChange={(e) => setAccountForm((c) => ({ ...c, imap_username: e.target.value }))} required />
                <Input label={accountForm.id ? 'Senha IMAP (preencha só para trocar)' : 'Senha IMAP'} type="password" value={accountForm.password} onChange={(e) => setAccountForm((c) => ({ ...c, password: e.target.value }))} required={!accountForm.id} />
                <Input label="Pastas" value={accountForm.selected_folders} onChange={(e) => setAccountForm((c) => ({ ...c, selected_folders: e.target.value }))} placeholder="INBOX, Financeiro" />
                <Input label="Intervalo de sync (min)" type="number" value={accountForm.sync_interval_minutes} onChange={(e) => setAccountForm((c) => ({ ...c, sync_interval_minutes: Number(e.target.value) }))} />
                <Input label="Retenção irrelevantes (dias)" type="number" value={accountForm.retain_irrelevant_days} onChange={(e) => setAccountForm((c) => ({ ...c, retain_irrelevant_days: Number(e.target.value) }))} />
                <div style={styles.checkboxRow}>
                  <label style={styles.checkboxLabel}><input type="checkbox" checked={accountForm.use_ssl} onChange={(e) => setAccountForm((c) => ({ ...c, use_ssl: e.target.checked }))} /> SSL</label>
                  <label style={styles.checkboxLabel}><input type="checkbox" checked={accountForm.is_active} onChange={(e) => setAccountForm((c) => ({ ...c, is_active: e.target.checked }))} /> Ativa</label>
                </div>
                <div style={styles.formActions}>
                  <Button type="button" variant="secondary" onClick={runConnectionTest} disabled={isTestingConnection}>
                    Testar conexão
                  </Button>
                  <Button type="submit" disabled={isSubmittingAccount}>{accountForm.id ? 'Salvar conta' : 'Cadastrar conta'}</Button>
                </div>
              </form>
            </Card>

            <PanelCard>
              <div style={styles.panelHeader}>
                <div>
                  <h3 style={styles.panelTitle}>Contas cadastradas</h3>
                  <p style={styles.panelSubtitle}>Ative, desative e acompanhe o último ciclo de sincronização.</p>
                </div>
                <Badge variant="info">{accounts.length} contas</Badge>
              </div>
              {accounts.length ? (
                <div style={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        <th>Conta</th>
                        <th>Status</th>
                        <th>Pastas</th>
                        <th>Último sync</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map((account) => (
                        <tr key={account.id}>
                          <td>
                            <strong>{account.display_name}</strong>
                            <div style={styles.mutedLine}>{account.email}</div>
                          </td>
                          <td>
                            <Badge variant={getStatusVariant(account.sync_status)}>{account.sync_status}</Badge>
                            <div style={styles.mutedLine}>{account.is_active ? 'Ativa' : 'Pausada'}</div>
                          </td>
                          <td>{account.selected_folders.join(', ')}</td>
                          <td>
                            <strong>{formatDateTime(account.last_synced_at)}</strong>
                            <div style={styles.mutedLine}>há {formatRelativeWindow(account.last_synced_at)}</div>
                          </td>
                          <td>
                            <div style={styles.inlineActions}>
                              <Button variant="secondary" onClick={() => handleEditAccount(account)} style={styles.smallButton}>Editar</Button>
                              <Button variant="secondary" onClick={() => runSyncAccount(account.id)} style={styles.smallButton}>Sync</Button>
                              <Button variant={account.is_active ? 'warning' : 'success'} onClick={() => toggleAccountStatus(account)} style={styles.smallButton}>
                                {account.is_active ? 'Desativar' : 'Ativar'}
                              </Button>
                              <Button variant="danger" onClick={() => removeAccount(account)} style={styles.smallButton}>Excluir</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState icon={<InboxOutlinedIcon />} title="Nenhuma conta cadastrada" description="Cadastre as contas IMAP autorizadas para iniciar o monitoramento." />
              )}
            </PanelCard>
          </div>
        </div>
      )}

      {tab === 'rules' && (
        <div style={styles.sectionStack}>
          <div style={styles.formAndTableGrid}>
            <Card>
              <div style={styles.formHeader}>
                <h3 style={styles.panelTitle}>{ruleForm.id ? 'Editar regra' : 'Nova regra de triagem'}</h3>
                <button type="button" onClick={resetRuleForm} style={styles.linkButton}>Limpar</button>
              </div>
              <form onSubmit={submitRule} style={styles.formGrid}>
                <Input label="Nome da regra" value={ruleForm.name} onChange={(e) => setRuleForm((c) => ({ ...c, name: e.target.value }))} required />
                <Select label="Escopo" value={ruleForm.account_id} onChange={(e) => setRuleForm((c) => ({ ...c, account_id: e.target.value }))} options={accountOptions} />
                <Input label="Padrão de remetente" value={ruleForm.sender_pattern} onChange={(e) => setRuleForm((c) => ({ ...c, sender_pattern: e.target.value }))} placeholder="billing@provedor.com ou *@stripe.com" />
                <Input label="Padrão de assunto" value={ruleForm.subject_pattern} onChange={(e) => setRuleForm((c) => ({ ...c, subject_pattern: e.target.value }))} placeholder="Fatura, Recibo, Pedido" />
                <Input label="Palavras-chave do corpo" value={ruleForm.body_keywords} onChange={(e) => setRuleForm((c) => ({ ...c, body_keywords: e.target.value }))} placeholder="invoice, order, receipt" />
                <Input label="Pasta" value={ruleForm.folder_pattern} onChange={(e) => setRuleForm((c) => ({ ...c, folder_pattern: e.target.value }))} placeholder="INBOX" />
                <Input label="Categoria" value={ruleForm.category} onChange={(e) => setRuleForm((c) => ({ ...c, category: e.target.value }))} placeholder="Financeiro" />
                <Input label="Prioridade" type="number" value={ruleForm.priority} onChange={(e) => setRuleForm((c) => ({ ...c, priority: Number(e.target.value) }))} />
                <Input label="Webhook interno" value={ruleForm.webhook_url} onChange={(e) => setRuleForm((c) => ({ ...c, webhook_url: e.target.value }))} placeholder="https://intranet.local/webhook" />
                <div style={styles.checkboxGrid}>
                  <label style={styles.checkboxLabel}><input type="checkbox" checked={ruleForm.mark_relevant} onChange={(e) => setRuleForm((c) => ({ ...c, mark_relevant: e.target.checked }))} /> Marcar relevante</label>
                  <label style={styles.checkboxLabel}><input type="checkbox" checked={ruleForm.raise_dashboard_alert} onChange={(e) => setRuleForm((c) => ({ ...c, raise_dashboard_alert: e.target.checked }))} /> Gerar alerta</label>
                  <label style={styles.checkboxLabel}><input type="checkbox" checked={ruleForm.highlight} onChange={(e) => setRuleForm((c) => ({ ...c, highlight: e.target.checked }))} /> Destacar mensagem</label>
                  <label style={styles.checkboxLabel}><input type="checkbox" checked={ruleForm.enabled} onChange={(e) => setRuleForm((c) => ({ ...c, enabled: e.target.checked }))} /> Regra ativa</label>
                </div>
                <div style={styles.formActions}>
                  <Button type="submit" disabled={isSubmittingRule}>{ruleForm.id ? 'Salvar regra' : 'Criar regra'}</Button>
                </div>
              </form>
            </Card>

            <PanelCard>
              <div style={styles.panelHeader}>
                <div>
                  <h3 style={styles.panelTitle}>Regras configuradas</h3>
                  <p style={styles.panelSubtitle}>Precedência é definida pela prioridade crescente e escopo por conta.</p>
                </div>
                <Badge variant="info">{rules.length} regras</Badge>
              </div>
              {rules.length ? (
                <div style={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Escopo</th>
                        <th>Categoria</th>
                        <th>Prioridade</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.map((rule) => (
                        <tr key={rule.id}>
                          <td>
                            <strong>{rule.name}</strong>
                            <div style={styles.mutedLine}>{rule.sender_pattern || rule.subject_pattern || 'Filtro operacional genérico'}</div>
                          </td>
                          <td><Badge variant={rule.account_id ? 'info' : 'warning'}>{rule.scope_label}</Badge></td>
                          <td>{rule.category || '-'}</td>
                          <td>{rule.priority}</td>
                          <td>
                            <div style={styles.inlineActions}>
                              <Button variant="secondary" onClick={() => handleEditRule(rule)} style={styles.smallButton}>Editar</Button>
                              <Badge variant={rule.enabled ? 'success' : 'warning'}>{rule.enabled ? 'Ativa' : 'Pausada'}</Badge>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState icon={<RuleFolderOutlinedIcon />} title="Nenhuma regra criada" description="Crie filtros por remetente, assunto, pasta e palavras-chave genéricas do corpo." />
              )}
            </PanelCard>
          </div>
        </div>
      )}

      {tab === 'messages' && (
        <div style={styles.sectionStack}>
          <Card>
            <div style={styles.filterGrid}>
              <Input label="Busca textual" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Assunto, remetente ou preview" />
              <Select label="Conta" value={messageFilters.account_id} onChange={(e) => setMessageFilters((current) => ({ ...current, account_id: e.target.value }))} options={[{ value: '', label: 'Todas' }, ...accounts.map((account) => ({ value: account.id, label: account.display_name }))]} />
              <Input label="Remetente" value={messageFilters.sender} onChange={(e) => setMessageFilters((current) => ({ ...current, sender: e.target.value }))} placeholder="@provedor.com" />
              <Select label="Categoria" value={messageFilters.category} onChange={(e) => setMessageFilters((current) => ({ ...current, category: e.target.value }))} options={[{ value: '', label: 'Todas' }, ...categories.map((category) => ({ value: category, label: category }))]} />
              <Select label="Período" value={messageFilters.days} onChange={(e) => setMessageFilters((current) => ({ ...current, days: e.target.value }))} options={[{ value: '1', label: 'Hoje' }, { value: '7', label: '7 dias' }, { value: '30', label: '30 dias' }, { value: '90', label: '90 dias' }]} />
              <Select label="Arquivadas" value={messageFilters.archived} onChange={(e) => setMessageFilters((current) => ({ ...current, archived: e.target.value }))} options={[{ value: 'false', label: 'Ativas' }, { value: 'true', label: 'Arquivadas' }, { value: 'all', label: 'Todas' }]} />
              <label style={{ ...styles.checkboxLabel, alignSelf: 'end' }}>
                <input type="checkbox" checked={messageFilters.relevant_only} onChange={(e) => setMessageFilters((current) => ({ ...current, relevant_only: e.target.checked }))} />
                Mostrar apenas relevantes
              </label>
            </div>
          </Card>

          <PanelCard>
            <div style={styles.panelHeader}>
              <div>
                <h3 style={styles.panelTitle}>Mensagens relevantes</h3>
                <p style={styles.panelSubtitle}>Conteúdo bruto permitido, HTML sanitizado e ações internas de leitura, destaque e arquivamento.</p>
              </div>
              <Badge variant="info">{messagesPage?.total ?? 0} registros</Badge>
            </div>
            {isMessagesLoading ? (
              <LoadingSpinner text="Atualizando mensagens..." />
            ) : messagesPage?.items.length ? (
              <>
                <div style={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        <th>Conta</th>
                        <th>Remetente</th>
                        <th>Assunto</th>
                        <th>Categoria</th>
                        <th>Filtro</th>
                        <th>Data</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {messagesPage.items.map((message) => (
                        <tr key={message.id} style={message.is_highlighted ? styles.highlightRow : undefined}>
                          <td>{message.account_display_name}</td>
                          <td>{message.sender_email || '-'}</td>
                          <td>
                            <strong>{message.subject || '(sem assunto)'}</strong>
                            <div style={styles.mutedLine}>{message.body_preview || 'Sem preview de texto.'}</div>
                          </td>
                          <td>{message.category ? <Badge variant="info">{message.category}</Badge> : '-'}</td>
                          <td>{message.matched_rule_name || '-'}</td>
                          <td>{formatDateTime(message.sent_at)}</td>
                          <td>
                            <div style={styles.statusStack}>
                              <Badge variant={message.is_read_internal ? 'success' : 'warning'}>{message.is_read_internal ? 'Lido' : 'Novo'}</Badge>
                              {message.is_archived && <Badge variant="default">Arquivado</Badge>}
                            </div>
                          </td>
                          <td>
                            <Button variant="secondary" onClick={() => openMessage(message.id)} style={styles.smallButton}>Abrir</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={styles.paginationRow}>
                  <span style={styles.paginationText}>Página {messagesPage.page} de {messagesPage.total_pages}</span>
                  <div style={styles.inlineActions}>
                    <Button variant="secondary" disabled={messagesPage.page <= 1} onClick={() => loadMessages(messagesPage.page - 1)} style={styles.smallButton}>Anterior</Button>
                    <Button variant="secondary" disabled={messagesPage.page >= messagesPage.total_pages} onClick={() => loadMessages(messagesPage.page + 1)} style={styles.smallButton}>Próxima</Button>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState icon={<SearchOutlinedIcon />} title="Nenhuma mensagem encontrada" description="Ajuste os filtros ou aguarde a próxima sincronização." />
            )}
          </PanelCard>
        </div>
      )}

      {tab === 'audit' && (
        <PanelCard>
          <div style={styles.panelHeader}>
            <div>
              <h3 style={styles.panelTitle}>Auditoria</h3>
              <p style={styles.panelSubtitle}>Logins no painel, alterações de contas, regras e execuções de sincronização.</p>
            </div>
            <Badge variant="info">{auditLogs.length} eventos</Badge>
          </div>
          {auditLogs.length ? (
            <div style={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Quando</th>
                    <th>Evento</th>
                    <th>Mensagem</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatDateTime(log.created_at)}</td>
                      <td><Badge variant="info">{log.event_type}</Badge></td>
                      <td>
                        <strong>{log.message}</strong>
                        <div style={styles.mutedLine}>{Object.entries(log.metadata_json || {}).slice(0, 3).map(([key, value]) => `${key}: ${String(value)}`).join(' · ') || '-'}</div>
                      </td>
                      <td>{log.ip_address || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={<HistoryOutlinedIcon />} title="Sem eventos auditados" description="Os eventos do módulo começam a aparecer após as primeiras ações operacionais." />
          )}
        </PanelCard>
      )}

      {selectedMessage && (
        <div style={styles.modalOverlay} onClick={() => setSelectedMessage(null)}>
          <div style={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>{selectedMessage.subject || '(sem assunto)'}</h3>
                <p style={styles.panelSubtitle}>{selectedMessage.account_display_name} · {selectedMessage.sender_email || 'remetente não informado'}</p>
              </div>
              <div style={styles.inlineActions}>
                {selectedMessage.provider_message_url && (
                  <Button variant="secondary" onClick={() => window.open(selectedMessage.provider_message_url || '#', '_blank', 'noopener,noreferrer')} style={styles.smallButton}>
                    <LaunchOutlinedIcon sx={{ fontSize: 16, marginRight: '6px', verticalAlign: 'text-bottom' }} />
                    Abrir original
                  </Button>
                )}
                <button type="button" style={styles.closeButton} onClick={() => setSelectedMessage(null)}>Fechar</button>
              </div>
            </div>

            <div style={styles.modalMetaGrid}>
              <div><strong>Conta</strong><span>{selectedMessage.account_email}</span></div>
              <div><strong>Pasta</strong><span>{selectedMessage.folder_name}</span></div>
              <div><strong>Remetente</strong><span>{selectedMessage.sender_name || selectedMessage.sender_email || '-'}</span></div>
              <div><strong>Destinatário</strong><span>{selectedMessage.recipient_email || '-'}</span></div>
              <div><strong>Categoria</strong><span>{selectedMessage.category || '-'}</span></div>
              <div><strong>Data</strong><span>{formatDateTime(selectedMessage.sent_at || selectedMessage.internal_date)}</span></div>
            </div>

            <div style={styles.inlineActionsWrap}>
              <Button variant="secondary" onClick={() => updateSelectedMessage({ is_read_internal: !selectedMessage.is_read_internal })} style={styles.smallButton}>
                {selectedMessage.is_read_internal ? 'Marcar não lida' : 'Marcar lida'}
              </Button>
              <Button variant="secondary" onClick={() => updateSelectedMessage({ is_highlighted: !selectedMessage.is_highlighted })} style={styles.smallButton}>
                {selectedMessage.is_highlighted ? 'Remover destaque' : 'Destacar'}
              </Button>
              <Button variant="secondary" onClick={() => updateSelectedMessage({ is_archived: !selectedMessage.is_archived })} style={styles.smallButton}>
                {selectedMessage.is_archived ? 'Desarquivar' : 'Arquivar'}
              </Button>
            </div>

            <div style={styles.detailSectionsGrid}>
              <Card style={{ padding: 18 }}>
                <h4 style={styles.detailTitle}>Cabeçalhos relevantes</h4>
                <div style={styles.headerList}>
                  {Object.entries(selectedMessage.headers || {}).map(([key, value]) => (
                    <div key={key} style={styles.headerRow}><strong>{key}</strong><span>{String(value)}</span></div>
                  ))}
                </div>
              </Card>
              <Card style={{ padding: 18 }}>
                <h4 style={styles.detailTitle}>Histórico de filtros</h4>
                {selectedMessage.matches.length ? (
                  <div style={styles.matchList}>
                    {selectedMessage.matches.map((match) => (
                      <div key={match.id} style={styles.matchCard}>
                        <strong>{match.rule_name}</strong>
                        <span>{match.reason_summary}</span>
                        <small>{formatDateTime(match.matched_at)}</small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={styles.panelSubtitle}>Nenhuma regra registrada para esta mensagem.</p>
                )}
              </Card>
            </div>

            <Card style={{ padding: 18 }}>
              <h4 style={styles.detailTitle}>Corpo sanitizado</h4>
              {selectedMessage.body_html_sanitized ? (
                <div style={styles.htmlPreview} dangerouslySetInnerHTML={{ __html: selectedMessage.body_html_sanitized }} />
              ) : (
                <pre style={styles.preBlock}>{selectedMessage.body_text || 'Sem conteúdo textual disponível.'}</pre>
              )}
              {selectedMessage.body_text && selectedMessage.body_html_sanitized && (
                <details style={styles.textFallback}>
                  <summary>Texto simples</summary>
                  <pre style={styles.preBlock}>{selectedMessage.body_text}</pre>
                </details>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

const useDebouncedValue = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeoutId);
  }, [delay, value]);
  return debouncedValue;
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1600px',
    margin: '0 auto',
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  togglePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '999px',
    border: '1px solid var(--border-subtle)',
    backgroundColor: 'var(--surface-base)',
    color: 'var(--text-primary)',
  },
  tabRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '22px',
  },
  tabButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    borderRadius: '14px',
    border: '1px solid var(--border-subtle)',
    backgroundColor: 'var(--surface-base)',
    color: 'var(--text-secondary)',
  },
  tabButtonActive: {
    background: 'var(--brand-gradient)',
    color: 'var(--text-inverse)',
    borderColor: 'transparent',
    boxShadow: 'var(--shadow-md)',
  },
  tabCounter: {
    minWidth: '20px',
    height: '20px',
    borderRadius: '999px',
    backgroundColor: 'rgba(255,255,255,0.22)',
    display: 'grid',
    placeItems: 'center',
    paddingInline: '6px',
    fontSize: '12px',
  },
  sectionStack: {
    display: 'grid',
    gap: '18px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  twoColumnGrid: {
    display: 'grid',
    gap: '18px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
  },
  formAndTableGrid: {
    display: 'grid',
    gap: '18px',
    gridTemplateColumns: 'minmax(320px, 420px) minmax(0, 1fr)',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '14px',
    padding: '18px 20px',
    borderBottom: '1px solid var(--border-subtle)',
  },
  panelTitle: {
    margin: 0,
    fontSize: '18px',
  },
  panelSubtitle: {
    margin: '4px 0 0 0',
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  listBlock: {
    display: 'grid',
  },
  feedItem: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: '14px',
    padding: '16px 18px',
    textAlign: 'left',
    borderRadius: 0,
    backgroundColor: 'transparent',
    borderBottom: '1px solid var(--border-subtle)',
    color: 'inherit',
  },
  feedItemStatic: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: '14px',
    padding: '16px 18px',
    borderBottom: '1px solid var(--border-subtle)',
  },
  feedTitle: {
    display: 'block',
    color: 'var(--text-primary)',
  },
  feedMeta: {
    margin: '4px 0 0 0',
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  feedAside: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px',
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  mutedLine: {
    marginTop: '4px',
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  inlineActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  inlineActionsWrap: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '18px',
  },
  smallButton: {
    padding: '8px 12px',
    fontSize: '12px',
  },
  formHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '18px',
  },
  linkButton: {
    padding: 0,
    backgroundColor: 'transparent',
    color: 'var(--brand-500)',
    border: 'none',
  },
  formGrid: {
    display: 'grid',
    gap: '14px',
  },
  checkboxGrid: {
    display: 'grid',
    gap: '10px',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  },
  checkboxRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  checkboxLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-secondary)',
    fontSize: '14px',
  },
  formActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  filterGrid: {
    display: 'grid',
    gap: '14px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    alignItems: 'end',
  },
  paginationRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px 18px',
    gap: '12px',
    flexWrap: 'wrap',
  },
  paginationText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  statusStack: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  highlightRow: {
    backgroundColor: 'rgba(45,127,224,0.06)',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15,23,42,0.42)',
    display: 'grid',
    placeItems: 'center',
    padding: '24px',
    zIndex: 2000,
  },
  modalCard: {
    width: 'min(1180px, 100%)',
    maxHeight: '90vh',
    overflowY: 'auto',
    backgroundColor: 'var(--surface-base)',
    borderRadius: '22px',
    boxShadow: 'var(--shadow-xl)',
    padding: '22px',
    display: 'grid',
    gap: '18px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  modalTitle: {
    margin: 0,
    fontSize: '24px',
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)',
  },
  modalMetaGrid: {
    display: 'grid',
    gap: '12px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  },
  detailSectionsGrid: {
    display: 'grid',
    gap: '18px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  },
  detailTitle: {
    margin: '0 0 12px 0',
    fontSize: '16px',
  },
  headerList: {
    display: 'grid',
    gap: '10px',
  },
  headerRow: {
    display: 'grid',
    gap: '4px',
    fontSize: '13px',
  },
  matchList: {
    display: 'grid',
    gap: '10px',
  },
  matchCard: {
    display: 'grid',
    gap: '4px',
    padding: '12px 14px',
    borderRadius: '12px',
    backgroundColor: 'var(--surface-soft)',
    border: '1px solid var(--border-subtle)',
    fontSize: '13px',
  },
  htmlPreview: {
    border: '1px solid var(--border-subtle)',
    borderRadius: '16px',
    padding: '18px',
    backgroundColor: 'var(--surface-soft)',
    maxHeight: '420px',
    overflowY: 'auto',
  },
  preBlock: {
    margin: 0,
    whiteSpace: 'pre-wrap',
    fontFamily: 'inherit',
    fontSize: '14px',
    lineHeight: 1.6,
    color: 'var(--text-primary)',
  },
  textFallback: {
    marginTop: '14px',
  },
};

const pageStyles = `
  .email-monitor-page tbody tr:hover {
    background-color: var(--surface-soft);
  }
  @media (max-width: 1080px) {
    .email-monitor-form-grid {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 900px) {
    .email-monitor-modal {
      width: 100%;
    }
  }
  @media (max-width: 820px) {
    table {
      min-width: 760px;
    }
  }
`;
