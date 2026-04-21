import { useState, useEffect } from 'react';
import { api } from '../api/client';

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  fontSize: 13,
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--surface)',
  color: 'var(--text)',
  outline: 'none',
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text)',
  marginBottom: 5,
  display: 'block',
};

export default function EditAdModal({ ad, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: ad?.name || '',
    description: ad?.description || '',
    price: ad?.price != null ? String(ad.price) : '',
  });
  const [photoUrls, setPhotoUrls] = useState(ad?.photoUrls || []);
  const [photoInput, setPhotoInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ad) {
      setForm({ name: ad.name || '', description: ad.description || '', price: ad.price != null ? String(ad.price) : '' });
      setPhotoUrls(ad.photoUrls || []);
    }
  }, [ad?.id]);

  if (!ad) return null;

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  }

  function addPhoto() {
    const url = photoInput.trim();
    if (url && !photoUrls.includes(url)) {
      setPhotoUrls(prev => [...prev, url]);
      setPhotoInput('');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const updated = await api.advertisements.update(ad.id, {
        name: form.name,
        description: form.description,
        price: form.price ? Number(form.price) : null,
        photoUrls: new Set ? [...new Set(photoUrls)] : photoUrls,
      });
      onSuccess?.(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto', padding: 24 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Редактировать объявление</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, color: 'var(--muted)', cursor: 'pointer' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div style={{ background: 'oklch(0.95 0.04 25)', border: '1px solid oklch(0.8 0.1 25)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 13, color: 'var(--negative)' }}>
              {error}
            </div>
          )}

          <div>
            <label style={labelStyle}>Название *</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')} />
          </div>

          <div>
            <label style={labelStyle}>Цена (в токенах)</label>
            <input type="number" name="price" value={form.price} onChange={handleChange} min="0" placeholder="Оставьте пустым для бесплатно" style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')} />
          </div>

          <div>
            <label style={labelStyle}>Описание</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4} style={{ ...inputStyle, resize: 'vertical' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')} />
          </div>

          <div>
            <label style={labelStyle}>Фотографии (URL)</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input type="url" value={photoInput} onChange={e => setPhotoInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPhoto())}
                placeholder="https://..." style={{ ...inputStyle, flex: 1 }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')} />
              <button type="button" onClick={addPhoto} style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                + Добавить
              </button>
            </div>
            {photoUrls.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {photoUrls.map((url, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '6px 10px' }}>
                    <img src={url} alt="" style={{ width: 40, height: 30, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                    <span style={{ flex: 1, fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
                    <button type="button" onClick={() => setPhotoUrls(p => p.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--negative)', cursor: 'pointer', fontSize: 16, lineHeight: 1, flexShrink: 0 }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 600, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer' }}>
              Отмена
            </button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 600, border: 'none', borderRadius: 'var(--radius-sm)', background: loading ? 'var(--border)' : 'var(--accent)', color: loading ? 'var(--muted)' : '#fff', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
