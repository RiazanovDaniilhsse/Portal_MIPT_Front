import { useState, useEffect } from 'react';
import { api } from '../api/client';

function Stars({ rating }) {
  return (
    <span style={{ color: '#f5a623', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: 1 }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

export default function ReviewList({ sellerId, adId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const p = adId
      ? api.reviews.getByAd(adId)
      : api.reviews.getBySeller(sellerId);
    p.then(data => setReviews(data?.content || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sellerId, adId]);

  if (loading) return <div style={{ color: 'var(--muted)', fontSize: 13, padding: '12px 0' }}>Загрузка отзывов...</div>;
  if (!reviews.length) return <div style={{ color: 'var(--muted)', fontSize: 13, padding: '12px 0' }}>Отзывов пока нет.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {reviews.map(r => (
        <div key={r.id} style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Stars rating={r.rating} />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>
              {r.isAnonymous ? 'Анонимно' : r.buyerName || 'Пользователь'}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>
              {new Date(r.createdAt).toLocaleDateString('ru')}
            </span>
          </div>
          {r.comment && <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{r.comment}</p>}
        </div>
      ))}
    </div>
  );
}
