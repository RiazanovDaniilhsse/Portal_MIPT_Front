import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import AdCard from '../components/AdCard';
import CreateAdModal from '../components/CreateAdModal';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    api.advertisements.getAll({ status: 'ACTIVE' })
      .then(data => setAds((data || []).slice(0, 12)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main style={{ flex: 1, padding: 'var(--pad)', maxWidth: 1100, width: '100%', margin: '0 auto' }}>

        {/* Welcome banner */}
        <div style={{
          background: 'var(--accent)',
          borderRadius: 'var(--radius)',
          padding: '28px 32px',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
        }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
              Добро пожаловать, {user?.login || 'студент'}!
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
              Marketplace для студентов и сотрудников МФТИ
            </div>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: 600,
              background: '#fff',
              color: 'var(--accent)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            + Разместить
          </button>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
          {[
            { label: 'Все объявления', action: () => navigate('/catalog') },
            { label: 'Товары', action: () => navigate('/catalog?type=OBJECTS') },
            { label: 'Услуги', action: () => navigate('/catalog?type=SERVICES') },
            { label: 'Мои сделки', action: () => navigate('/deals') },
          ].map(({ label, action }) => (
            <button
              key={label}
              onClick={action}
              style={{
                padding: '6px 14px',
                fontSize: 12.5,
                fontWeight: 500,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                color: 'var(--text)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Recent ads */}
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Свежие объявления</span>
          <button
            onClick={() => navigate('/catalog')}
            style={{ fontSize: 12.5, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
          >
            Все →
          </button>
        </div>

        {loading ? (
          <div style={{ color: 'var(--muted)', fontSize: 13, padding: '40px 0', textAlign: 'center' }}>
            Загрузка...
          </div>
        ) : ads.length === 0 ? (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '48px 0',
            textAlign: 'center',
            color: 'var(--muted)',
            fontSize: 13,
          }}>
            Объявлений пока нет.{' '}
            <button onClick={() => setModalOpen(true)} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Разместите первое!
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}>
            {ads.map(ad => (
              <AdCard key={ad.id} ad={ad} onFavoriteToggle={updated => setAds(prev => prev.map(a => a.id === updated.id ? updated : a))} />
            ))}
          </div>
        )}
      </main>

      <CreateAdModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSuccess={() => {
        api.advertisements.getAll({ status: 'ACTIVE' }).then(data => setAds((data || []).slice(0, 12))).catch(() => {});
      }} />
    </div>
  );
}
