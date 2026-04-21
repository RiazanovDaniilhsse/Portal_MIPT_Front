import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

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

export default function CreateAdModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(false);
  const [photoUrls, setPhotoUrls] = useState([]);
  const [photoInput, setPhotoInput] = useState('');

  const [form, setForm] = useState({
    type: 'OBJECTS',
    group: '',
    category: '',
    name: '',
    description: '',
    price: '',
  });

  useEffect(() => {
    if (isOpen) {
      setCreated(false);
      setError('');
      setPhotoUrls([]);
      setPhotoInput('');
      api.advertisements.getCategories()
        .then(data => setAllCategories(data))
        .catch(() => {});
    }
  }, [isOpen]);

  function addPhoto() {
    const url = photoInput.trim();
    if (url && !photoUrls.includes(url)) {
      setPhotoUrls(prev => [...prev, url]);
      setPhotoInput('');
    }
  }

  const filteredGroups = allCategories.filter(g =>
    g.categories.some(cat => cat.type === form.type)
  );
  const availableGroups = filteredGroups.map(g => g.groupName);
  const currentGroupData = filteredGroups.find(g => g.groupName === form.group);
  const availableCategories = currentGroupData
    ? currentGroupData.categories.filter(cat => cat.type === form.type)
    : [];

  useEffect(() => {
    setForm(prev => ({ ...prev, group: '', category: '' }));
  }, [form.type]);

  useEffect(() => {
    setForm(prev => ({ ...prev, category: '' }));
  }, [form.group]);

  if (!isOpen) return null;

  if (created) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', width: '100%', maxWidth: 400, padding: 32, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Объявление создано!</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>
            Оно сохранено как черновик. Перейдите в «Мои сделки», чтобы опубликовать его.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 600, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer' }}>
              Закрыть
            </button>
            <button onClick={() => { onClose(); navigate('/deals'); }} style={{ flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 600, border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}>
              Мои сделки →
            </button>
          </div>
        </div>
      </div>
    );
  }

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.category) return setError('Выберите категорию');
    setLoading(true);
    try {
      await api.advertisements.create({
        name: form.name,
        description: form.description,
        price: form.price ? Number(form.price) : null,
        type: form.type,
        category: form.category,
        authorId: user?.id,
        photoUrls,
      });
      setForm({ type: 'OBJECTS', group: '', category: '', name: '', description: '', price: '' });
      onSuccess?.();
      setCreated(true);
    } catch (err) {
      setError(err.message || 'Ошибка при создании. Проверьте данные.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.35)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          overflow: 'auto',
          padding: 24,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Новое объявление</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 18, color: 'var(--muted)', cursor: 'pointer' }}
          >×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div style={{ background: 'oklch(0.95 0.04 25)', border: '1px solid oklch(0.8 0.1 25)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 13, color: 'var(--negative)' }}>
              {error}
            </div>
          )}

          <div>
            <label style={labelStyle}>Тип</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['OBJECTS', 'Товары'], ['SERVICES', 'Услуги']].map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, type: val }))}
                  style={{
                    flex: 1,
                    padding: '7px 12px',
                    fontSize: 12.5,
                    fontWeight: 600,
                    border: '1px solid',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: form.type === val ? 'var(--accent-soft)' : 'var(--surface)',
                    borderColor: form.type === val ? 'var(--accent-border)' : 'var(--border)',
                    color: form.type === val ? 'var(--accent)' : 'var(--muted)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Группа категорий</label>
            <select name="group" value={form.group} onChange={handleChange} required style={inputStyle}>
              <option value="">— Выберите группу —</option>
              {availableGroups.map(g => (
                <option key={g} value={g}>{g.includes('/') ? g.split('/')[1] : g}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Категория</label>
            <select name="category" value={form.category} onChange={handleChange} required disabled={!form.group} style={inputStyle}>
              <option value="">— Выберите категорию —</option>
              {availableCategories.map(cat => (
                <option key={cat.name} value={cat.name}>{cat.displayName.split('/').pop()}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Название *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Например: MacBook Pro или Репетитор по физике"
              required
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          <div>
            <label style={labelStyle}>Цена (в токенах)</label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder="Оставьте пустым для бесплатно"
              min="0"
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          <div>
            <label style={labelStyle}>Описание *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Подробно опишите ваш товар или услугу..."
              rows={4}
              required
              style={{ ...inputStyle, resize: 'vertical' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          <div>
            <label style={labelStyle}>Фотографии (URL)</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="url"
                value={photoInput}
                onChange={e => setPhotoInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPhoto())}
                placeholder="https://..."
                style={{ ...inputStyle, flex: 1 }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
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
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '9px 0',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)',
                color: 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading || !form.category}
              style={{
                flex: 1,
                padding: '9px 0',
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: loading || !form.category ? 'var(--border)' : 'var(--accent)',
                color: loading || !form.category ? 'var(--muted)' : '#fff',
                cursor: loading || !form.category ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Создание...' : 'Опубликовать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
