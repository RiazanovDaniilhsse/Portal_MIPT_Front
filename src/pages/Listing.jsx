import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import ReviewList from '../components/ReviewList';
import ReviewModal from '../components/ReviewModal';

const placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"%3E%3Crect width="600" height="400" fill="%23f3f3f3"/%3E%3Ctext x="300" y="210" font-family="sans-serif" font-size="18" fill="%23aaa" text-anchor="middle"%3EФото%3C/text%3E%3C/svg%3E';

export default function Listing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ad, setAd] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [chatLoading] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [reserved, setReserved] = useState(false);
  const [buyLoading, setBuyLoading] = useState('');
  const [buyError, setBuyError] = useState('');
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewLoading, setReviewLoading] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewKey, setReviewKey] = useState(0);

  const opTitle = (adObj) => `[${adObj?.id}] ${adObj?.name}`;

  useEffect(() => {
    api.advertisements.getById(id)
      .then(data => {
        setAd(data);
        if (data.authorId) {
          api.users.getById(data.authorId).then(setSeller).catch(() => {});
        }
      })
      .catch(() => navigate('/catalog'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user?.id || !ad) return;
    api.wallets.get(user.id).then(setWallet).catch(() => {});
    api.wallets.getOperations(user.id).then(ops => {
      if (!ops) return;
      const title = opTitle(ad);
      const reserves = ops.filter(o => o.type === 'RESERVE' && o.title === title).length;
      const settled = ops.filter(o => (o.type === 'PAY' || o.type === 'CANCEL') && o.title === title).length;
      setReserved(reserves > settled);
    }).catch(() => {});
  }, [user?.id, ad?.id]);

  function handleContact() {
    if (!user?.id || !ad?.authorId) return;
    if (user.id === ad.authorId) return;
    navigate('/messages', { state: { pendingMemberId: ad.authorId } });
  }

  async function handleReserve() {
    setBuyLoading('reserve'); setBuyError('');
    try {
      await api.wallets.reserve(user.id, ad.authorId, ad.price, opTitle(ad));
      const w = await api.wallets.get(user.id);
      setWallet(w); setReserved(true); setShowBuyModal(false);
    } catch (e) { setBuyError(e.message || 'Ошибка резервирования'); }
    setBuyLoading('');
  }

  async function handlePayOnly() {
    setReviewLoading('skip'); setReviewError('');
    try {
      await api.wallets.pay(user.id, ad.authorId, ad.price, opTitle(ad));
      const w = await api.wallets.get(user.id);
      setWallet(w); setReserved(false); setShowReviewModal(false);
    } catch (e) { setReviewError(e.message || 'Ошибка подтверждения'); }
    setReviewLoading('');
  }

  async function handlePayWithReview(reviewData) {
    setReviewLoading('submit'); setReviewError('');
    try {
      await api.wallets.pay(user.id, ad.authorId, ad.price, opTitle(ad));
      const w = await api.wallets.get(user.id);
      setWallet(w); setReserved(false); setShowReviewModal(false);
    } catch (e) {
      setReviewError(e.message || 'Ошибка подтверждения');
      setReviewLoading('');
      return;
    }
    try {
      await api.reviews.create({
        sellerId: ad.authorId,
        advertisementId: ad.id,
        rating: reviewData.rating,
        comment: reviewData.comment,
        isAnonymous: reviewData.isAnonymous,
      }, user.id);
      setReviewKey(k => k + 1);
    } catch (e) {
      // payment already succeeded — review failure is non-blocking
    }
    setReviewLoading('');
  }

  async function handleCancel() {
    setBuyLoading('cancel'); setBuyError('');
    try {
      await api.wallets.cancel(user.id, ad.authorId, ad.price, opTitle(ad));
      const w = await api.wallets.get(user.id);
      setWallet(w); setReserved(false);
    } catch (e) { setBuyError(e.message || 'Ошибка отмены'); }
    setBuyLoading('');
  }

  async function toggleFav() {
    try {
      const updated = await api.advertisements.toggleFavorite(ad.id);
      setAd(updated);
    } catch {}
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 14 }}>
          Загрузка...
        </div>
      </div>
    );
  }

  if (!ad) return null;

  const photos = ad.photoUrls?.length > 0 ? [...ad.photoUrls] : [placeholder];
  const isOwn = user?.id === ad.authorId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main style={{ flex: 1, padding: 'var(--pad)', maxWidth: 960, width: '100%', margin: '0 auto' }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16, display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={() => navigate('/catalog')} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>Каталог</button>
          <span>›</span>
          <span>{ad.categoryDisplayName || ad.category}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          {/* Left: photo + description */}
          <div>
            {/* Photos */}
            <div style={{
              background: 'var(--bg)',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
              aspectRatio: '4/3',
              marginBottom: 12,
              position: 'relative',
            }}>
              <img
                src={photos[photoIdx]}
                alt={ad.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={e => { e.currentTarget.src = placeholder; }}
              />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setPhotoIdx(i => (i - 1 + photos.length) % photos.length)}
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}
                  >‹</button>
                  <button
                    onClick={() => setPhotoIdx(i => (i + 1) % photos.length)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}
                  >›</button>
                </>
              )}
            </div>
            {photos.length > 1 && (
              <div style={{ display: 'flex', gap: 6 }}>
                {photos.map((p, i) => (
                  <img
                    key={i}
                    src={p}
                    onClick={() => setPhotoIdx(i)}
                    style={{
                      width: 60,
                      height: 60,
                      objectFit: 'cover',
                      borderRadius: 4,
                      border: i === photoIdx ? '2px solid var(--accent)' : '2px solid var(--border)',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            )}

            {/* Description */}
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Описание</div>
              <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                {ad.description || '—'}
              </p>
            </div>

            {/* Reviews */}
            <div style={{ marginTop: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Отзывы</div>
              <ReviewList key={reviewKey} adId={ad.id} />
            </div>
          </div>

          {/* Right: info card */}
          <div>
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: 20,
              position: 'sticky',
              top: 70,
            }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  background: ad.type === 'SERVICES' ? 'oklch(0.95 0.04 150)' : 'var(--accent-soft)',
                  color: ad.type === 'SERVICES' ? 'var(--positive)' : 'var(--accent)',
                  padding: '2px 8px',
                  borderRadius: 4,
                }}>
                  {ad.type === 'SERVICES' ? 'Услуга' : 'Товар'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--bg)', padding: '2px 8px', borderRadius: 4 }}>
                  {ad.categoryDisplayName || ad.category}
                </span>
              </div>

              <h1 style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.3, marginBottom: 14 }}>{ad.name}</h1>

              <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
                {ad.price != null ? `${ad.price.toLocaleString('ru')} t` : 'Бесплатно'}
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {!isOwn && (
                  <button
                    onClick={handleContact}
                    disabled={chatLoading}
                    style={{
                      flex: 1,
                      padding: '10px 0',
                      fontSize: 13,
                      fontWeight: 600,
                      background: 'var(--accent)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: chatLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {chatLoading ? 'Открытие...' : 'Написать'}
                  </button>
                )}
                <button
                  onClick={toggleFav}
                  style={{
                    padding: '10px 14px',
                    fontSize: 16,
                    background: ad.isFavorite ? 'oklch(0.95 0.04 25)' : 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    color: ad.isFavorite ? 'var(--negative)' : 'var(--muted)',
                  }}
                >
                  {ad.isFavorite ? '★' : '☆'}
                </button>
              </div>

              {/* Payment block */}
              {!isOwn && ad.status === 'ACTIVE' && ad.price > 0 && (
                <div style={{ marginBottom: 16 }}>
                  {buyError && (
                    <div style={{ fontSize: 12, color: 'var(--negative)', marginBottom: 8, padding: '6px 10px', background: 'oklch(0.95 0.04 25)', borderRadius: 'var(--radius-sm)' }}>
                      {buyError}
                    </div>
                  )}
                  {!reserved ? (
                    <button
                      onClick={() => { setBuyError(''); setShowBuyModal(true); }}
                      style={{ width: '100%', padding: '10px 0', fontSize: 13, fontWeight: 600, background: 'var(--positive)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                    >
                      Купить за {ad.price?.toLocaleString('ru')} t
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ fontSize: 12, color: 'var(--muted)', padding: '6px 0', textAlign: 'center' }}>
                        Зарезервировано: {ad.price?.toLocaleString('ru')} t
                      </div>
                      <button
                        onClick={() => { setReviewError(''); setShowReviewModal(true); }}
                        disabled={!!buyLoading}
                        style={{ width: '100%', padding: '9px 0', fontSize: 13, fontWeight: 600, background: 'var(--positive)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: buyLoading ? 'not-allowed' : 'pointer' }}
                      >
                        Получил — подтвердить оплату
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={!!buyLoading}
                        style={{ width: '100%', padding: '9px 0', fontSize: 13, fontWeight: 600, background: 'var(--surface)', color: 'var(--negative)', border: '1px solid var(--negative)', borderRadius: 'var(--radius-sm)', cursor: buyLoading ? 'not-allowed' : 'pointer' }}
                      >
                        {buyLoading === 'cancel' ? '...' : 'Отменить резерв'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Продавец</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {(seller?.login || seller?.email || 'U').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{seller?.login || 'Пользователь'}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {new Date(ad.createdAt).toLocaleDateString('ru')}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 12, fontSize: 11, color: 'var(--muted)' }}>
                Статус: <span style={{ fontWeight: 600, color: ad.status === 'ACTIVE' ? 'var(--positive)' : 'var(--muted)' }}>
                  {ad.status === 'ACTIVE' ? 'Активно' : ad.status === 'INACTIVE' ? 'Приостановлено' : 'В архиве'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSkip={handlePayOnly}
        onSubmit={handlePayWithReview}
        adTitle={ad?.name}
        loading={reviewLoading}
        error={reviewError}
      />

      {showBuyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowBuyModal(false)}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', width: '100%', maxWidth: 380, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Подтвердить покупку</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
              Токены будут заморожены на вашем счёте. Переведите продавцу после получения товара.
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
              <span>Стоимость</span>
              <span style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>{ad.price?.toLocaleString('ru')} t</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 13 }}>
              <span>Ваш баланс</span>
              <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: (wallet?.availableTokens ?? 0) >= ad.price ? 'var(--positive)' : 'var(--negative)' }}>
                {(wallet?.availableTokens ?? 0).toLocaleString('ru')} t
              </span>
            </div>
            {(wallet?.availableTokens ?? 0) < ad.price && (
              <div style={{ fontSize: 12, color: 'var(--negative)', marginBottom: 12 }}>Недостаточно токенов. Пополните кошелёк.</div>
            )}
            {buyError && <div style={{ fontSize: 12, color: 'var(--negative)', marginBottom: 12 }}>{buyError}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowBuyModal(false)} style={{ flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 600, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer' }}>
                Отмена
              </button>
              <button
                onClick={handleReserve}
                disabled={!!buyLoading || (wallet?.availableTokens ?? 0) < ad.price}
                style={{ flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 600, border: 'none', borderRadius: 'var(--radius-sm)', background: buyLoading || (wallet?.availableTokens ?? 0) < ad.price ? 'var(--border)' : 'var(--positive)', color: buyLoading || (wallet?.availableTokens ?? 0) < ad.price ? 'var(--muted)' : '#fff', cursor: buyLoading || (wallet?.availableTokens ?? 0) < ad.price ? 'not-allowed' : 'pointer' }}
              >
                {buyLoading === 'reserve' ? '...' : 'Зарезервировать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
