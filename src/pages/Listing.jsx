import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import ReviewList from '../components/ReviewList';
import ReviewModal from '../components/ReviewModal';

const placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"%3E%3Crect width="600" height="400" fill="%23f3f3f3"/%3E%3Ctext x="300" y="210" font-family="sans-serif" font-size="18" fill="%23aaa" text-anchor="middle"%3EФото%3C/text%3E%3C/svg%3E';

function formatCountdown(ms) {
  if (ms <= 0) return null;
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const parts = [];
  if (d > 0) parts.push(`${d}д`);
  if (h > 0) parts.push(`${h}ч`);
  if (m > 0 || d > 0) parts.push(`${m}м`);
  parts.push(`${s}с`);
  return parts.join(' ');
}

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

  // Auction state
  const [bids, setBids] = useState([]);
  const [bidInput, setBidInput] = useState('');
  const [bidLoading, setBidLoading] = useState(false);
  const [bidError, setBidError] = useState('');
  const [closeAuctionLoading, setCloseAuctionLoading] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [remainingMs, setRemainingMs] = useState(null);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const timerRef = useRef(null);

  const opTitle = (adObj) => `[${adObj?.id}] ${adObj?.name}`;

  const topBid = bids[0] ?? null;
  const isAuctionWinner = ad?.isAuction && topBid?.bidderId === user?.id;
  const effectivePayAmount = ad?.isAuction
    ? (topBid?.amount ?? ad?.price)
    : ad?.price;

  // Fetch ad
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

  // Fetch wallet & reservation status
  useEffect(() => {
    if (!user?.id || !ad) return;
    api.wallets.get(user.id).then(setWallet).catch(() => {});
    refreshReservationStatus();
  }, [user?.id, ad?.id]);

  // Fetch bids for auctions
  useEffect(() => {
    if (!ad?.isAuction) return;
    api.auctions.getBids(ad.id).then(setBids).catch(() => {});
  }, [ad?.id, ad?.isAuction]);

  // Auction countdown timer
  useEffect(() => {
    if (!ad?.isAuction) return;

    const tick = () => {
      if (ad.auctionClosedAt) {
        setAuctionEnded(true);
        setCountdown('');
        clearInterval(timerRef.current);
        return;
      }
      if (!ad.auctionEndsAt) return;
      const ms = new Date(ad.auctionEndsAt).getTime() - Date.now();
      if (ms <= 0) {
        setAuctionEnded(true);
        setCountdown('');
        setRemainingMs(0);
        clearInterval(timerRef.current);
      } else {
        setAuctionEnded(false);
        setCountdown(formatCountdown(ms));
        setRemainingMs(ms);
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [ad?.isAuction, ad?.auctionEndsAt, ad?.auctionClosedAt]);

  async function refreshReservationStatus() {
    if (!user?.id || !ad) return;
    try {
      const ops = await api.wallets.getOperations(user.id);
      if (!ops) return;
      const title = opTitle(ad);
      const reserves = ops.filter(o => o.type === 'RESERVE' && o.title === title).length;
      const settled = ops.filter(o => (o.type === 'PAY' || o.type === 'CANCEL') && o.title === title).length;
      setReserved(reserves > settled);
    } catch {}
  }

  function handleContact() {
    if (!user?.id || !ad?.authorId) return;
    if (user.id === ad.authorId) return;
    navigate('/messages', { state: { pendingMemberId: ad.authorId } });
  }

  // Regular purchase handlers
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
      await api.wallets.pay(user.id, ad.authorId, effectivePayAmount, opTitle(ad));
      const w = await api.wallets.get(user.id);
      setWallet(w); setReserved(false); setShowReviewModal(false);
    } catch (e) { setReviewError(e.message || 'Ошибка подтверждения'); }
    setReviewLoading('');
  }

  async function handlePayWithReview(reviewData) {
    setReviewLoading('submit'); setReviewError('');
    try {
      await api.wallets.pay(user.id, ad.authorId, effectivePayAmount, opTitle(ad));
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
    } catch {}
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

  // Auction handlers
  async function handleBid() {
    const amount = Number(bidInput);
    if (!amount || amount <= 0) return setBidError('Введите корректную сумму');
    setBidLoading(true); setBidError('');
    try {
      await api.auctions.placeBid(ad.id, user.id, amount);
      const [newBids, w] = await Promise.all([
        api.auctions.getBids(ad.id),
        api.wallets.get(user.id),
      ]);
      setBids(newBids);
      setWallet(w);
      setBidInput('');
      await refreshReservationStatus();
    } catch (e) { setBidError(e.message || 'Ошибка'); }
    setBidLoading(false);
  }

  async function handleCloseAuction() {
    setCloseAuctionLoading(true);
    try {
      await api.auctions.close(ad.id, user.id);
      const updated = await api.advertisements.getById(ad.id);
      setAd(updated);
    } catch (e) { setBidError(e.message || 'Ошибка при завершении аукциона'); }
    setCloseAuctionLoading(false);
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
  const minBid = topBid ? topBid.amount + 1 : (ad.price ?? 1);
  const auctionActive = ad.isAuction && ad.status === 'ACTIVE' && !auctionEnded;

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
          {/* Left: photo + description + bids */}
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

            {/* Auction bids table */}
            {ad.isAuction && (
              <div style={{ marginTop: 28 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>
                  Ставки аукциона {bids.length > 0 && <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 400 }}>({bids.length})</span>}
                </div>
                {bids.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--muted)', padding: '16px 0' }}>
                    Ставок пока нет. Начальная ставка: {ad.price?.toLocaleString('ru')} t
                  </div>
                ) : (
                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', fontSize: 11 }}>#</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', fontSize: 11 }}>Участник</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--muted)', fontSize: 11 }}>Ставка</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--muted)', fontSize: 11 }}>Время</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bids.map((bid, i) => (
                          <tr
                            key={bid.id}
                            style={{
                              borderBottom: i < bids.length - 1 ? '1px solid var(--border)' : 'none',
                              background: bid.bidderId === user?.id ? 'oklch(0.97 0.02 260)' : 'transparent',
                            }}
                          >
                            <td style={{ padding: '10px 12px', color: i === 0 ? 'var(--positive)' : 'var(--muted)', fontWeight: i === 0 ? 700 : 400 }}>
                              {i === 0 ? '★' : `${i + 1}`}
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: bid.bidderId === user?.id ? 600 : 400 }}>
                              {bid.bidderId === user?.id
                                ? 'Вы'
                                : `...${bid.bidderId.toString().slice(-8)}`}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: i === 0 ? 700 : 400, color: i === 0 ? 'var(--positive)' : 'var(--text)' }}>
                              {bid.amount.toLocaleString('ru')} t
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, color: 'var(--muted)' }}>
                              {new Date(bid.createdAt).toLocaleString('ru', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

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
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
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
                {ad.isAuction && (
                  <span style={{ fontSize: 11, fontWeight: 700, background: 'oklch(0.95 0.06 60)', color: 'oklch(0.5 0.15 60)', padding: '2px 8px', borderRadius: 4 }}>
                    Аукцион
                  </span>
                )}
              </div>

              <h1 style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.3, marginBottom: 14 }}>{ad.name}</h1>

              {/* Price / bid display */}
              {ad.isAuction ? (
                <div style={{ marginBottom: 16 }}>
                  {topBid ? (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>Текущая ставка</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: 'var(--positive)' }}>
                        {topBid.amount.toLocaleString('ru')} t
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>Начальная ставка</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
                        {ad.price?.toLocaleString('ru')} t
                      </div>
                    </div>
                  )}

                  {/* Countdown */}
                  {!auctionEnded && ad.auctionEndsAt && (
                    <div style={{ marginTop: 6, fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>До конца:</span>
                      <span style={{ fontFamily: 'var(--mono)', color: remainingMs !== null && remainingMs < 3600000 ? 'var(--negative)' : 'var(--text)', fontWeight: 600 }}>
                        {countdown || '...'}
                      </span>
                    </div>
                  )}
                  {auctionEnded && (
                    <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>
                      Аукцион завершён
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
                  {ad.price != null ? `${ad.price.toLocaleString('ru')} t` : 'Бесплатно'}
                </div>
              )}

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

              {/* Regular purchase block (non-auction) */}
              {!ad.isAuction && !isOwn && ad.status === 'ACTIVE' && ad.price > 0 && (
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

              {/* Auction block */}
              {ad.isAuction && ad.status === 'ACTIVE' && (
                <div style={{ marginBottom: 16 }}>
                  {bidError && (
                    <div style={{ fontSize: 12, color: 'var(--negative)', marginBottom: 8, padding: '6px 10px', background: 'oklch(0.95 0.04 25)', borderRadius: 'var(--radius-sm)' }}>
                      {bidError}
                    </div>
                  )}

                  {/* Bid input for non-owners while active */}
                  {!isOwn && auctionActive && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        Минимальная ставка: <strong>{minBid.toLocaleString('ru')} t</strong>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="number"
                          value={bidInput}
                          onChange={e => { setBidInput(e.target.value); setBidError(''); }}
                          placeholder={`≥ ${minBid}`}
                          min={minBid}
                          style={{
                            flex: 1,
                            padding: '8px 10px',
                            fontSize: 13,
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--surface)',
                            color: 'var(--text)',
                            outline: 'none',
                          }}
                          onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                          onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                          onKeyDown={e => e.key === 'Enter' && handleBid()}
                        />
                        <button
                          onClick={handleBid}
                          disabled={bidLoading}
                          style={{
                            padding: '8px 14px',
                            fontSize: 13,
                            fontWeight: 600,
                            background: bidLoading ? 'var(--border)' : 'var(--positive)',
                            color: bidLoading ? 'var(--muted)' : '#fff',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            cursor: bidLoading ? 'not-allowed' : 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {bidLoading ? '...' : 'Ставка'}
                        </button>
                      </div>
                      {wallet && (
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                          Ваш баланс: {wallet.availableTokens?.toLocaleString('ru')} t
                        </div>
                      )}
                      {topBid?.bidderId === user?.id && (
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--positive)', padding: '6px 10px', background: 'oklch(0.96 0.04 145)', borderRadius: 'var(--radius-sm)' }}>
                          Вы лидируете! Ставка: {topBid.amount.toLocaleString('ru')} t
                        </div>
                      )}
                    </div>
                  )}

                  {/* Close auction button for owner */}
                  {isOwn && auctionActive && (
                    <button
                      onClick={handleCloseAuction}
                      disabled={closeAuctionLoading}
                      style={{
                        width: '100%',
                        padding: '10px 0',
                        fontSize: 13,
                        fontWeight: 600,
                        background: closeAuctionLoading ? 'var(--border)' : 'var(--surface)',
                        color: closeAuctionLoading ? 'var(--muted)' : 'var(--negative)',
                        border: '1px solid var(--negative)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: closeAuctionLoading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {closeAuctionLoading ? '...' : 'Завершить аукцион'}
                    </button>
                  )}

                  {/* Winner confirmation after auction ended */}
                  {auctionEnded && isAuctionWinner && reserved && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--positive)', padding: '8px 10px', background: 'oklch(0.96 0.04 145)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                        Вы победили в аукционе!
                        <div style={{ fontWeight: 400, marginTop: 2 }}>
                          Зарезервировано: {topBid?.amount?.toLocaleString('ru')} t
                        </div>
                      </div>
                      <button
                        onClick={() => { setReviewError(''); setShowReviewModal(true); }}
                        style={{ width: '100%', padding: '9px 0', fontSize: 13, fontWeight: 600, background: 'var(--positive)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                      >
                        Получил товар — подтвердить оплату
                      </button>
                    </div>
                  )}

                  {/* Auction ended but user is not the winner */}
                  {auctionEnded && !isOwn && !isAuctionWinner && bids.length > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--muted)', padding: '8px 0', textAlign: 'center' }}>
                      Победитель определён. Ваша ставка не выиграла.
                    </div>
                  )}

                  {/* Auction ended with no bids */}
                  {auctionEnded && bids.length === 0 && !isOwn && (
                    <div style={{ fontSize: 12, color: 'var(--muted)', padding: '8px 0', textAlign: 'center' }}>
                      Аукцион завершён без ставок.
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
