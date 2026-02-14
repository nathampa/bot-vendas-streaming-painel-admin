import { useState, useEffect } from 'react';
import { getAdminGiftCards, createGiftCard, deleteGiftCard } from '../services/apiClient';
import type { IGiftCardAdminRead } from '../types/api.types';
import { useToast } from '../contexts/ToastContext';
import { getApiErrorMessage } from '../utils/errors';

type FilterStatus = 'todos' | 'usados' | 'nao_usados';

export const GiftCardsPage = () => {
  const { showToast } = useToast();
  const [giftCards, setGiftCards] = useState<IGiftCardAdminRead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('nao_usados');
  const [showForm, setShowForm] = useState(false);
  const [deletingGiftCard, setDeletingGiftCard] = useState<IGiftCardAdminRead | null>(null);

  // Form states
  const [novoValor, setNovoValor] = useState('10');
  const [novaQuantidade, setNovaQuantidade] = useState(1);
  const [novoCodigo, setNovoCodigo] = useState('');

  const carregarGiftCards = async (status: FilterStatus) => {
    setIsLoading(true);
    try {
      const params: { is_utilizado?: boolean } = {};
      if (status === 'usados') params.is_utilizado = true;
      if (status === 'nao_usados') params.is_utilizado = false;

      const response = await getAdminGiftCards(params);
      setGiftCards(response.data);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar gift cards:", err);
      setError("Falha ao carregar gift cards.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarGiftCards(filterStatus);
  }, [filterStatus]);

  const handleCreateGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      valor: parseFloat(novoValor),
      quantidade: novoCodigo ? 1 : novaQuantidade,
      codigo_personalizado: novoCodigo || undefined
    };

    try {
      const response = await createGiftCard(data);
      showToast(
        `Gift Card(s) criado(s) com sucesso. CÃ³digos: ${response.data.codigos_gerados.join(', ')}`,
        'success',
      );

      setNovoValor('10');
      setNovaQuantidade(1);
      setNovoCodigo('');
      setShowForm(false);
      setFilterStatus('nao_usados');
      carregarGiftCards('nao_usados');
    } catch (err: unknown) {
      console.error("Erro ao criar gift card:", err);
      const errorMsg = getApiErrorMessage(err, "Falha ao criar gift card.");
      showToast(errorMsg, 'error');
    }
  };

  const handleDelete = async () => {
    if (!deletingGiftCard) return;

    try {
      await deleteGiftCard(deletingGiftCard.id);
      showToast('Gift Card excluÃ­do com sucesso!', 'success');
      setDeletingGiftCard(null);
      carregarGiftCards(filterStatus);
    } catch (err: unknown) {
      console.error("Erro ao excluir gift card:", err);
      const errorMsg = getApiErrorMessage(err, "Falha ao excluir gift card.");
      showToast(errorMsg, 'error');
      setDeletingGiftCard(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    if (!text) {
      showToast('NÃ£o hÃ¡ cÃ³digo para copiar.', 'warning');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast('CÃ³digo copiado com sucesso!', 'success');
    } catch {
      showToast('Falha ao copiar cÃ³digo.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Carregando gift cards...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>ðŸŽ Gift Cards</h1>
          <p style={styles.subtitle}>Crie e gerencie cÃ³digos de presente</p>
        </div>
        <button type="button" onClick={() => setShowForm(!showForm)} style={styles.addButton}>
          {showForm ? 'âœ• Cancelar' : 'âž• Novo Gift Card'}
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={styles.alert}>
          <span style={styles.alertIcon}>âš ï¸</span>
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Criar Novo(s) Gift Card(s)</h3>
          <form onSubmit={handleCreateGiftCard} style={styles.form}>
            <div style={styles.inputRow}>
              <div style={styles.inputGroup}>
                <label htmlFor="giftcard-valor" style={styles.label}>
                  Valor (R$)
                </label>
                <input
                  id="giftcard-valor"
                  type="number"
                  step="0.01"
                  min="1"
                  value={novoValor}
                  onChange={(e) => setNovoValor(e.target.value)}
                  required
                  style={styles.input}
                  placeholder="10.00"
                />
              </div>

              <div style={styles.inputGroup}>
                <label htmlFor="giftcard-quantidade" style={styles.label}>
                  Quantidade
                </label>
                <input
                  id="giftcard-quantidade"
                  type="number"
                  step="1"
                  min="1"
                  value={novaQuantidade}
                  onChange={(e) => setNovaQuantidade(parseInt(e.target.value))}
                  required
                  disabled={!!novoCodigo}
                  style={{...styles.input, opacity: novoCodigo ? 0.5 : 1}}
                  placeholder="1"
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="giftcard-codigo" style={styles.label}>
                CÃ³digo Personalizado (Opcional)
              </label>
              <input
                id="giftcard-codigo"
                type="text"
                value={novoCodigo}
                onChange={(e) => setNovoCodigo(e.target.value)}
                style={styles.input}
                placeholder="Ex: NATAL2025"
              />
              <small style={styles.inputHint}>
                Se preenchido, a quantidade serÃ¡ ignorada (1 cÃ³digo personalizado)
              </small>
            </div>

            <div style={styles.formActions}>
              <button type="button" onClick={() => setShowForm(false)} style={styles.cancelButton}>
                Cancelar
              </button>
              <button type="submit" style={styles.submitButton}>
                Gerar CÃ³digo(s)
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={{...styles.statIcon, backgroundColor: '#dbeafe', color: '#1e40af'}}>ðŸŽ«</span>
          <div>
            <p style={styles.statLabel}>Total de CÃ³digos</p>
            <h3 style={styles.statValue}>{giftCards.length}</h3>
          </div>
        </div>
        <div style={styles.statCard}>
          <span style={{...styles.statIcon, backgroundColor: '#d1fae5', color: '#065f46'}}>âœ“</span>
          <div>
            <p style={styles.statLabel}>CÃ³digos Usados</p>
            <h3 style={styles.statValue}>{giftCards.filter(gc => gc.is_utilizado).length}</h3>
          </div>
        </div>
        <div style={styles.statCard}>
          <span style={{...styles.statIcon, backgroundColor: '#fef3c7', color: '#92400e'}}>â³</span>
          <div>
            <p style={styles.statLabel}>DisponÃ­veis</p>
            <h3 style={styles.statValue}>{giftCards.filter(gc => !gc.is_utilizado).length}</h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filtersContainer}>
        <span style={styles.filtersLabel}>Filtrar por:</span>
        <button
          type="button"
          onClick={() => setFilterStatus('nao_usados')}
          style={{...styles.filterButton, ...(filterStatus === 'nao_usados' && styles.filterButtonActive)}}
        >
          NÃ£o Usados
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('usados')}
          style={{...styles.filterButton, ...(filterStatus === 'usados' && styles.filterButtonActive)}}
        >
          Usados
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('todos')}
          style={{...styles.filterButton, ...(filterStatus === 'todos' && styles.filterButtonActive)}}
        >
          Todos
        </button>
      </div>

      {/* Gift Cards Grid */}
      <div style={styles.giftCardsGrid}>
        {giftCards.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>ðŸŽ</span>
            <h3 style={styles.emptyTitle}>Nenhum gift card encontrado</h3>
            <p style={styles.emptyText}>
              {filterStatus === 'nao_usados' ? 'Nenhum cÃ³digo disponÃ­vel no momento' :
               filterStatus === 'usados' ? 'Nenhum cÃ³digo foi usado ainda' :
               'Comece criando seu primeiro gift card'}
            </p>
          </div>
        ) : (
          giftCards.map((gc) => (
            <div
              key={gc.id}
              style={{
                ...styles.giftCard,
                borderColor: gc.is_utilizado ? 'var(--border-default)' : '#10b981'
              }}
            >
              {/* Header */}
              <div style={styles.cardHeader}>
                <span style={styles.cardValue}>R$ {gc.valor}</span>
                <span style={{
                  ...styles.badge,
                  ...(gc.is_utilizado ? styles.badgeUsed : styles.badgeAvailable)
                }}>
                  {gc.is_utilizado ? 'âœ“ Usado' : 'â³ DisponÃ­vel'}
                </span>
              </div>

              {/* Code */}
              <div style={styles.codeContainer}>
                <button
                  type="button"
                  style={styles.codeBox}
                  onClick={() => copyToClipboard(gc.codigo)}
                  aria-label={`Copiar cÃ³digo ${gc.codigo}`}
                >
                  <span style={styles.codeText}>{gc.codigo}</span>
                  <span style={styles.copyButton}>Copiar</span>
                </button>
              </div>

              {/* Info */}
              <div style={styles.cardInfo}>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Criado em:</span>
                  <span style={styles.infoValue}>
                    {new Date(gc.criado_em).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {gc.is_utilizado && (
                  <>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Usado em:</span>
                      <span style={styles.infoValue}>
                        {gc.utilizado_em ? new Date(gc.utilizado_em).toLocaleDateString('pt-BR') : '---'}
                      </span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>UsuÃ¡rio ID:</span>
                      <span style={styles.infoValue}>
                        {gc.utilizado_por_telegram_id || '---'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div style={styles.cardFooter}>
                <span style={styles.cardId}>ID: {gc.id.substring(0, 8)}...</span>
              </div>

              {/* Action Buttons - Apenas para nÃ£o utilizados */}
              {!gc.is_utilizado && (
                <div style={styles.actionButtons}>
                  <button
                    type="button"
                    onClick={() => setDeletingGiftCard(gc)}
                    style={{...styles.actionBtn, ...styles.deleteBtn}}
                    title="Excluir gift card"
                  >
                    ðŸ—‘ï¸ Excluir
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingGiftCard && (
        <div style={styles.modalOverlay} onClick={() => setDeletingGiftCard(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>âš ï¸ Confirmar ExclusÃ£o</h3>
              <button
                type="button"
                onClick={() => setDeletingGiftCard(null)}
                style={styles.modalClose}
                aria-label="Fechar confirmaÃ§Ã£o de exclusÃ£o"
              >
                x
              </button>
            </div>
            <div style={styles.modalBody}>
              <p style={styles.modalText}>
                Tem certeza que deseja excluir o Gift Card de <strong>R$ {deletingGiftCard.valor}</strong>?
              </p>
              <div style={styles.codeDisplayBox}>
                <span style={styles.codeDisplayLabel}>CÃ³digo:</span>
                <span style={styles.codeDisplayValue}>{deletingGiftCard.codigo}</span>
              </div>
              <div style={styles.warningBox}>
                <span style={styles.warningIcon}>â„¹ï¸</span>
                <p style={styles.warningText}>
                  Esta aÃ§Ã£o nÃ£o pode ser desfeita. O gift card serÃ¡ removido permanentemente do sistema.
                  {deletingGiftCard.is_utilizado && (
                    <span style={{fontWeight: 600, display: 'block', marginTop: '8px'}}>
                      âš ï¸ <strong>ATENÃ‡ÃƒO:</strong> Este gift card jÃ¡ foi utilizado!
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button type="button" onClick={() => setDeletingGiftCard(null)} style={styles.modalCancelBtn}>
                Cancelar
              </button>
              <button type="button" onClick={handleDelete} style={styles.modalDeleteBtn}>
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1400px', margin: '0 auto' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' },
  spinner: { width: '48px', height: '48px', border: '4px solid var(--border-subtle)', borderTop: '4px solid var(--brand-500)', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { fontSize: '16px', color: 'var(--text-secondary)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' },
  title: { margin: '0 0 4px 0', fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' },
  subtitle: { margin: 0, fontSize: '15px', color: 'var(--text-secondary)' },
  addButton: { padding: '12px 24px', fontSize: '14px', fontWeight: 600, background: 'linear-gradient(135deg, var(--brand-500) 0%, var(--brand-600) 100%)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  alert: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', marginBottom: '24px' },
  alertIcon: { fontSize: '18px' },
  formCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  formTitle: { margin: '0 0 20px 0', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: 600, color: '#374151' },
  input: { padding: '12px 16px', fontSize: '15px', border: '2px solid var(--border-subtle)', borderRadius: '8px', width: '100%', fontFamily: 'inherit' },
  inputHint: { fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' },
  formActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  cancelButton: { padding: '12px 24px', fontSize: '14px', fontWeight: 600, backgroundColor: 'var(--surface-muted)', color: 'var(--text-primary)', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  submitButton: { padding: '12px 24px', fontSize: '14px', fontWeight: 600, background: 'linear-gradient(135deg, var(--brand-500) 0%, var(--brand-600) 100%)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' },
  statCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  statIcon: { width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' },
  statLabel: { margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-secondary)' },
  statValue: { margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' },
  filtersContainer: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' },
  filtersLabel: { fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' },
  filterButton: { padding: '8px 16px', fontSize: '13px', fontWeight: 600, backgroundColor: 'var(--surface-soft)', color: 'var(--text-secondary)', border: '2px solid transparent', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' },
  filterButtonActive: { backgroundColor: '#ede9fe', borderColor: 'var(--brand-500)', color: 'var(--brand-500)' },
  giftCardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  giftCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '2px solid', transition: 'all 0.2s ease' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  cardValue: { fontSize: '28px', fontWeight: 700, color: '#10b981' },
  badge: { padding: '4px 10px', fontSize: '11px', fontWeight: 600, borderRadius: '6px' },
  badgeAvailable: { backgroundColor: '#d1fae5', color: '#065f46' },
  badgeUsed: { backgroundColor: '#f3f4f6', color: 'var(--text-secondary)' },
  codeContainer: { marginBottom: '16px' },
  codeBox: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: 'var(--surface-soft)', borderRadius: '8px', border: '2px dashed var(--border-default)', cursor: 'pointer', transition: 'all 0.2s ease', width: '100%', fontFamily: 'inherit', fontSize: 'inherit', textAlign: 'left' },
  codeText: { fontSize: '18px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)', letterSpacing: '1px' },
  copyButton: { fontSize: '12px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.4px' },
  cardInfo: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' },
  infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: '13px', color: 'var(--text-secondary)' },
  infoValue: { fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 },
  cardFooter: { paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', marginBottom: '12px' },
  cardId: { fontSize: '11px', color: 'var(--text-muted)' },
  actionButtons: { display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' },
  actionBtn: { flex: 1, padding: '10px 16px', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' },
  deleteBtn: { backgroundColor: '#fee2e2', color: '#991b1b' },
  emptyState: { gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '16px' },
  emptyIcon: { fontSize: '64px', opacity: 0.5 },
  emptyTitle: { margin: 0, fontSize: '20px', color: 'var(--text-primary)' },
  emptyText: { margin: 0, fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' },
  modal: { backgroundColor: '#fff', borderRadius: '16px', maxWidth: '500px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalHeader: { padding: '24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { margin: 0, fontSize: '20px', fontWeight: 700 },
  modalClose: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', padding: '4px', color: 'var(--text-secondary)' },
  modalBody: { padding: '24px' },
  modalText: { margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-primary)', lineHeight: 1.5 },
  codeDisplayBox: { display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 16px', backgroundColor: 'var(--surface-soft)', borderRadius: '8px', marginBottom: '16px' },
  codeDisplayLabel: { fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' },
  codeDisplayValue: { fontSize: '20px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)', letterSpacing: '1px' },
  warningBox: { display: 'flex', gap: '12px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' },
  warningIcon: { fontSize: '20px' },
  warningText: { margin: 0, fontSize: '14px', color: '#78350f', lineHeight: 1.5 },
  modalFooter: { padding: '24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  modalCancelBtn: { padding: '12px 24px', fontSize: '14px', fontWeight: 600, backgroundColor: 'var(--surface-muted)', color: 'var(--text-primary)', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  modalDeleteBtn: { padding: '12px 24px', fontSize: '14px', fontWeight: 600, backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
};


