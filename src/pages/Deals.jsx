import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import CreateAdModal from '../components/CreateAdModal';
import EditAdModal from '../components/EditAdModal';

const STATUS_LABELS = { ACTIVE: 'Активно', PAUSED: 'Приостановлено', DRAFT: 'Черновик', ARCHIVED: 'В архиве' };
const STATUS_COLORS = { ACTIVE: 'var(--positive)', PAUSED: 'var(--muted)', DRAFT: 'var(--accent)', ARCHIVED: 'var(--muted)' };

export default function Deals() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ads, setAds] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('my');
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [actionError, setActionError] = useState({});
  const [editingAd, setEditingAd] = useState(null);

  function load() {
    if (!user?.id) return;
    setLoading(true);
    Promise.allSettled([
      api.advertisements.getAll({ authorId: user.id }),
      api.advertisements.getAll({ favorite: true }),
      api.wallets.getOperations(user.id),
    ]).then(([myAdsResult, favAdsResult, opsResult]) => {
      const myAds = myAdsResult.status === 'fulfilled' ? myAdsResult.value : [];
      const favAds = favAdsResult.status === 'fulfilled' ? favAdsResult.value : [];
      const ops = opsResult.status === 'fulfilled' ? opsResult.value : [];
      setAds(myAds || []);
      setFavorites(favAds || []);
      const reserveOps = (ops || []).filter(o => o.type === 'RESERVE' && o.clientId === user.id);
      const settledTitles = new Set((ops || []).filter(o => (o.type === 'PAY' || o.type === 'CANCEL') && o.clientId === user.id).map(o => o.title));
      setPurchases(reserveOps.filter(o => !settledTitles.has(o.title)));
    }).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [user?.id]);

  async function handleToggleStatus(ad) {
    setActionLoading(p => ({ ...p, [ad.id]: true }));
    setActionError(p => ({ ...p, [ad.id]: null }));
    try {
      let updated;
      if (ad.status === 'ACTIVE') {
        updated = await api.advertisements.pause(ad.id);
      } else {
        updated = await api.advertisements.publish(ad.id);
      }
      setAds(prev => prev.map(a => a.id === updated.id ? updated : a));
    } catch (err) {
      setActionError(p => ({ ...p, [ad.id]: err.message || 'Ошибка' }));
    }
    setActionLoading(p => ({ ...p, [ad.id]: false }));
  }

  const displayed = tab === 'my' ? ads : tab === 'purchases' ? null : favorites;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main style={{ flex: 1, padding: 'var(--pad)', maxWidth: 900, width: '100%', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>Мои сделки</h1>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            + Разместить
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
          {[['my', `Мои объявления (${ads.length})`], ['purchases', `Покупки (${purchases.length})`], ['favs', `Избранное (${favorites.length})`]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setTab(val)}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: tab === val ? 600 : 500,
                color: tab === val ? 'var(--accent)' : 'var(--muted)',
                background: 'none',
                border: 'none',
                borderBottom: tab === val ? '2px solid var(--accent)' : '2px solid transparent',
                cursor: 'pointer',
                marginBottom: -1,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>Загрузка...</div>
        ) : tab === 'purchases' ? (
          purchases.length === 0 ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '48px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              Нет активных резервирований.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {purchases.map(op => {
                const adId = op.title?.match(/^\[([^\]]+)\]/)?.[1];
                return (
                  <div key={op.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3, cursor: adId ? 'pointer' : 'default' }} onClick={() => adId && navigate(`/listing/${adId}`)}>
                        {op.title?.replace(/^\[[^\]]+\]\s*/, '') || op.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        Зарезервировано: {op.amount?.toLocaleString('ru')} t · {new Date(op.time).toLocaleDateString('ru')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={async () => {
                          setActionLoading(p => ({ ...p, [op.id]: 'pay' }));
                          try { await api.wallets.pay(op.clientId, op.performerId, op.amount, op.title); load(); }
                          catch (e) { setActionError(p => ({ ...p, [op.id]: e.message })); }
                          setActionLoading(p => ({ ...p, [op.id]: '' }));
                        }}
                        disabled={!!actionLoading[op.id]}
                        style={{ padding: '5px 12px', fontSize: 12, fontWeight: 600, background: 'var(--positive)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                      >
                        {actionLoading[op.id] === 'pay' ? '...' : 'Получил ✓'}
                      </button>
                      <button
                        onClick={async () => {
                          setActionLoading(p => ({ ...p, [op.id]: 'cancel' }));
                          try { await api.wallets.cancel(op.clientId, op.performerId, op.amount, op.title); load(); }
                          catch (e) { setActionError(p => ({ ...p, [op.id]: e.message })); }
                          setActionLoading(p => ({ ...p, [op.id]: '' }));
                        }}
                        disabled={!!actionLoading[op.id]}
                        style={{ padding: '5px 12px', fontSize: 12, fontWeight: 600, background: 'var(--surface)', border: '1px solid var(--negative)', color: 'var(--negative)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                      >
                        {actionLoading[op.id] === 'cancel' ? '...' : 'Отменить'}
                      </button>
                      {actionError[op.id] && <span style={{ fontSize: 11, color: 'var(--negative)' }}>{actionError[op.id]}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : displayed.length === 0 ? (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '48px 0',
            textAlign: 'center',
            color: 'var(--muted)',
            fontSize: 13,
          }}>
            {tab === 'my'
              ? <>У вас нет объявлений. <button onClick={() => setModalOpen(true)} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Разместите первое!</button></>
              : 'Нет избранных объявлений.'
            }
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {displayed.map(ad => (
              <div
                key={ad.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 6,
                    background: 'var(--bg)',
                    overflow: 'hidden',
                    flexShrink: 0,
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/listing/${ad.id}`)}
                >
                  {ad.photoUrls?.length > 0 ? (
                    <img src={ad.photoUrls[0]} alt={ad.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 10 }}>Фото</div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{ fontSize: 14, fontWeight: 600, marginBottom: 3, cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    onClick={() => navigate(`/listing/${ad.id}`)}
                  >
                    {ad.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {ad.categoryDisplayName || ad.category} · {ad.price != null ? `${ad.price.toLocaleString('ru')} t` : 'Бесплатно'}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: STATUS_COLORS[ad.status] || 'var(--muted)' }}>
                      {STATUS_LABELS[ad.status] || ad.status}
                    </span>
                    {tab === 'my' && (
                      <button onClick={() => setEditingAd(ad)} style={{ padding: '5px 10px', fontSize: 12, fontWeight: 600, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--muted)' }}>
                        Изменить
                      </button>
                    )}
                    {tab === 'my' && ad.status !== 'ARCHIVED' && (
                      <button
                        onClick={() => handleToggleStatus(ad)}
                        disabled={actionLoading[ad.id]}
                        style={{ padding: '5px 12px', fontSize: 12, fontWeight: 600, background: ad.status === 'ACTIVE' ? 'var(--surface)' : 'var(--accent)', border: ad.status === 'ACTIVE' ? '1px solid var(--border)' : 'none', borderRadius: 'var(--radius-sm)', cursor: actionLoading[ad.id] ? 'not-allowed' : 'pointer', color: ad.status === 'ACTIVE' ? 'var(--text)' : '#fff' }}
                      >
                        {actionLoading[ad.id] ? '...' : ad.status === 'ACTIVE' ? 'Приостановить' : 'Опубликовать'}
                      </button>
                    )}
                  </div>
                  {actionError[ad.id] && (
                    <span style={{ fontSize: 11, color: 'var(--negative)', maxWidth: 220, textAlign: 'right' }}>
                      {actionError[ad.id]}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <CreateAdModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSuccess={load} />
      {editingAd && (
        <EditAdModal
          ad={editingAd}
          onClose={() => setEditingAd(null)}
          onSuccess={updated => {
            setAds(prev => prev.map(a => a.id === updated.id ? updated : a));
            setEditingAd(null);
          }}
        />
      )}
    </div>
  );
}
