import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

const OP_TYPE_LABELS = {
  PAY: 'Оплата',
  REFUND: 'Возврат',
  RESERVE: 'Резервирование',
  CANCEL: 'Отмена резервирования',
};

function opColor(op, userId) {
  if (op.type === 'PAY') return op.clientId === userId ? 'var(--negative)' : 'var(--positive)';
  if (op.type === 'REFUND') return op.clientId === userId ? 'var(--positive)' : 'var(--negative)';
  if (op.type === 'RESERVE') return 'var(--muted)';
  if (op.type === 'CANCEL') return 'var(--positive)';
  return 'var(--text)';
}

function opSign(op, userId) {
  if (op.type === 'PAY') return op.clientId === userId ? '-' : '+';
  if (op.type === 'REFUND') return op.clientId === userId ? '+' : '-';
  if (op.type === 'RESERVE') return '-';
  if (op.type === 'CANCEL') return '+';
  return '';
}

export default function Wallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupSuccess, setTopupSuccess] = useState('');
  const [topupError, setTopupError] = useState('');

  function load() {
    if (!user?.id) return;
    Promise.all([
      api.wallets.get(user.id),
      api.wallets.getOperations(user.id),
    ]).then(([w, ops]) => {
      setWallet(w);
      setOperations(ops || []);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [user?.id]);

  async function handleTopup(e) {
    e.preventDefault();
    const amount = Number(topupAmount);
    if (!amount || amount <= 0) return setTopupError('Введите сумму больше 0');
    setTopupLoading(true);
    setTopupError('');
    setTopupSuccess('');
    try {
      const updated = await api.wallets.topUp(user.id, amount);
      setWallet(updated);
      setTopupAmount('');
      setTopupSuccess(`Начислено ${amount} t`);
      setTimeout(() => setTopupSuccess(''), 3000);
      load();
    } catch (err) {
      setTopupError(err.message || 'Ошибка пополнения');
    } finally {
      setTopupLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main style={{ flex: 1, padding: 'var(--pad)', maxWidth: 700, width: '100%', margin: '0 auto' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Кошелёк</h1>

        {loading ? (
          <div style={{ color: 'var(--muted)', fontSize: 13, padding: 40, textAlign: 'center' }}>Загрузка...</div>
        ) : (
          <>
            {/* Balance cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div style={{
                background: 'var(--accent)',
                borderRadius: 'var(--radius)',
                padding: 'var(--stat-pad)',
                color: '#fff',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.8, marginBottom: 8 }}>
                  Доступно
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 700 }}>
                  {(wallet?.availableTokens ?? 0).toLocaleString('ru')}
                </div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>токенов</div>
              </div>
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: 'var(--stat-pad)',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
                  Зарезервировано
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>
                  {(wallet?.reservedTokens ?? 0).toLocaleString('ru')}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>токенов</div>
              </div>
            </div>

            {/* Top-up form */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: 20,
              marginBottom: 24,
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Пополнить счёт</div>
              <form onSubmit={handleTopup} style={{ display: 'flex', gap: 10 }}>
                <input
                  type="number"
                  value={topupAmount}
                  onChange={e => setTopupAmount(e.target.value)}
                  placeholder="Сумма токенов"
                  min="1"
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    fontSize: 13,
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg)',
                    outline: 'none',
                    color: 'var(--text)',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
                <button
                  type="submit"
                  disabled={topupLoading}
                  style={{
                    padding: '9px 20px',
                    fontSize: 13,
                    fontWeight: 600,
                    background: topupLoading ? 'var(--border)' : 'var(--accent)',
                    color: topupLoading ? 'var(--muted)' : '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: topupLoading ? 'not-allowed' : 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {topupLoading ? '...' : 'Пополнить'}
                </button>
              </form>
              {topupSuccess && (
                <div style={{ marginTop: 10, fontSize: 13, color: 'var(--positive)', fontWeight: 600 }}>✓ {topupSuccess}</div>
              )}
              {topupError && (
                <div style={{ marginTop: 10, fontSize: 13, color: 'var(--negative)' }}>{topupError}</div>
              )}
            </div>

            {/* Operations history */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>История операций</div>
              {operations.length === 0 ? (
                <div style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '32px 0',
                  textAlign: 'center',
                  color: 'var(--muted)',
                  fontSize: 13,
                }}>
                  Операций пока нет
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {operations.map(op => (
                    <div
                      key={op.id}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: op.type === 'REFUND' ? 'oklch(0.95 0.04 150)' : 'oklch(0.95 0.04 25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        flexShrink: 0,
                      }}>
                        {op.type === 'PAY' ? '↑' : op.type === 'REFUND' ? '↓' : '⋯'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{op.title || OP_TYPE_LABELS[op.type] || op.type}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                          {new Date(op.time).toLocaleString('ru')}
                        </div>
                      </div>
                      <div style={{
                        fontFamily: 'var(--mono)',
                        fontSize: 14,
                        fontWeight: 700,
                        color: opColor(op, user?.id),
                        flexShrink: 0,
                      }}>
                        {opSign(op, user?.id)}{op.amount} t
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
