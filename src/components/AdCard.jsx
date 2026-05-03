import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"%3E%3Crect width="300" height="200" fill="%23f3f3f3"/%3E%3Ctext x="150" y="105" font-family="sans-serif" font-size="14" fill="%23aaa" text-anchor="middle"%3EФото%3C/text%3E%3C/svg%3E';

export default function AdCard({ ad, onFavoriteToggle }) {
  const navigate = useNavigate();
  const photo = ad.photoUrls?.length > 0 ? ad.photoUrls[0] : placeholder;

  async function toggleFav(e) {
    e.stopPropagation();
    try {
      const updated = await api.advertisements.toggleFavorite(ad.id);
      onFavoriteToggle?.(updated);
    } catch {}
  }

  return (
    <div
      onClick={() => navigate(`/listing/${ad.id}`)}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      <div style={{ position: 'relative', aspectRatio: '3/2', overflow: 'hidden', background: 'var(--bg)' }}>
        <img
          src={photo}
          alt={ad.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.currentTarget.src = placeholder; }}
        />
        <button
          onClick={toggleFav}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'rgba(255,255,255,0.9)',
            border: 'none',
            borderRadius: '50%',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          {ad.isFavorite ? '★' : '☆'}
        </button>
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>
            {ad.categoryDisplayName || ad.category}
          </span>
          <span style={{
            fontSize: 10.5,
            fontWeight: 600,
            color: ad.type === 'SERVICES' ? 'var(--positive)' : 'var(--accent)',
            background: ad.type === 'SERVICES' ? 'oklch(0.95 0.04 150)' : 'var(--accent-soft)',
            padding: '1px 6px',
            borderRadius: 3,
            whiteSpace: 'nowrap',
          }}>
            {ad.type === 'SERVICES' ? 'Услуга' : 'Товар'}
          </span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>
          {ad.name}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {ad.isAuction && (
              <span style={{ fontSize: 10, fontWeight: 700, color: 'oklch(0.5 0.15 60)', background: 'oklch(0.95 0.06 60)', padding: '1px 5px', borderRadius: 3, whiteSpace: 'nowrap' }}>
                Аукцион
              </span>
            )}
            <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
              {ad.isAuction
                ? (ad.price != null ? `от ${ad.price.toLocaleString('ru')} t` : 'Аукцион')
                : (ad.price != null ? `${ad.price.toLocaleString('ru')} t` : 'Бесплатно')}
            </span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>
            {new Date(ad.createdAt).toLocaleDateString('ru')}
          </span>
        </div>
      </div>
    </div>
  );
}
