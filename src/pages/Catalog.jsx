import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import Header from '../components/Header';
import AdCard from '../components/AdCard';
import CreateAdModal from '../components/CreateAdModal';

const inputStyle = {
  padding: '8px 12px',
  fontSize: 13,
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--surface)',
  color: 'var(--text)',
  outline: 'none',
  width: '100%',
};

function PillBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 10px',
        fontSize: 11.5,
        fontWeight: active ? 600 : 500,
        border: '1px solid',
        borderRadius: 'var(--radius-sm)',
        borderColor: active ? 'var(--accent-border)' : 'var(--border)',
        background: active ? 'var(--accent-soft)' : 'var(--surface)',
        color: active ? 'var(--accent)' : 'var(--muted)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [ads, setAds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [category, setCategory] = useState(searchParams.get('cat') || '');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    api.advertisements.getCategories().then(setCategories).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    let p;
    if (query.trim()) {
      p = api.search.byText(query.trim(), 100, 0).then(data => {
        if (!data) return [];
        let result = data;
        if (type) result = result.filter(a => a.type === type);
        if (category) result = result.filter(a => a.category === category);
        return result;
      });
    } else if (category) {
      p = api.advertisements.getAll({ category }).then(data => {
        const result = (data || []).filter(a => a.status === 'ACTIVE');
        return type ? result.filter(a => a.type === type) : result;
      });
    } else if (type) {
      p = api.advertisements.getAll({ type }).then(data =>
        (data || []).filter(a => a.status === 'ACTIVE')
      );
    } else {
      p = api.advertisements.getAll({ status: 'ACTIVE' });
    }
    p.then(data => setAds(data || []))
      .catch(() => setAds([]))
      .finally(() => setLoading(false));
  }, [query, type, category]);

  useEffect(() => { load(); }, [load]);

  function handleSearch(e) {
    e.preventDefault();
    load();
  }

  const allGroups = categories
    .filter(g => !type || g.categories.some(c => c.type === type))
    .map(g => ({ name: g.groupName, cats: g.categories.filter(c => !type || c.type === type) }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar */}
        <aside style={{
          width: 220,
          flexShrink: 0,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          padding: '16px 0',
          overflowY: 'auto',
        }}>
          <div style={{ padding: '0 14px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--muted)', textTransform: 'uppercase' }}>
            Тип
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px', marginBottom: 16 }}>
            {[['', 'Все'], ['OBJECTS', 'Товары'], ['SERVICES', 'Услуги']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => { setType(val); setCategory(''); }}
                style={{
                  padding: '6px 10px',
                  fontSize: 12.5,
                  fontWeight: type === val ? 600 : 400,
                  background: type === val ? 'var(--accent-soft)' : 'none',
                  color: type === val ? 'var(--accent)' : 'var(--text)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ padding: '0 14px 8px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--muted)', textTransform: 'uppercase' }}>
            Категории
          </div>
          <div style={{ padding: '0 8px' }}>
            <button
              onClick={() => setCategory('')}
              style={{
                padding: '5px 10px',
                fontSize: 12.5,
                fontWeight: !category ? 600 : 400,
                background: !category ? 'var(--accent-soft)' : 'none',
                color: !category ? 'var(--accent)' : 'var(--muted)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'left',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Все
            </button>
            {allGroups.map(g => (
              <div key={g.name}>
                <div style={{ padding: '8px 10px 4px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.03em' }}>
                  {g.name.includes('/') ? g.name.split('/')[1] : g.name}
                </div>
                {g.cats.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setCategory(c.name)}
                    style={{
                      width: '100%',
                      padding: '4px 10px 4px 16px',
                      fontSize: 12,
                      fontWeight: category === c.name ? 600 : 400,
                      background: category === c.name ? 'var(--accent-soft)' : 'none',
                      color: category === c.name ? 'var(--accent)' : 'var(--text)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    {c.displayName.split('/').pop()}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 'var(--pad)' }}>
          {/* Search + actions bar */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Поиск по объявлениям..."
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '8px 18px',
                fontSize: 13,
                fontWeight: 600,
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              Найти
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                background: 'var(--surface)',
                color: 'var(--accent)',
                border: '1px solid var(--accent-border)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              + Разместить
            </button>
          </form>

          {/* Count */}
          <div style={{ marginBottom: 14, fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
            {loading ? 'Загрузка...' : `${ads.length} объявлений`}
            {(query || type || category) && (
              <button
                onClick={() => { setQuery(''); setType(''); setCategory(''); }}
                style={{ marginLeft: 10, fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Сбросить
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ color: 'var(--muted)', fontSize: 13, padding: '60px 0', textAlign: 'center' }}>Загрузка...</div>
          ) : ads.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 13, padding: '60px 0', textAlign: 'center' }}>
              Ничего не найдено
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {ads.map(ad => (
                <AdCard
                  key={ad.id}
                  ad={ad}
                  onFavoriteToggle={updated => setAds(prev => prev.map(a => a.id === updated.id ? updated : a))}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateAdModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSuccess={load} />
    </div>
  );
}
