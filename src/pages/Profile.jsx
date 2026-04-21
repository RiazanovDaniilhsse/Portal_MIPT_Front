import { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  fontSize: 13,
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--surface)',
  color: 'var(--text)',
  outline: 'none',
};

export default function Profile() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ login: user?.login || '', email: user?.email || '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user?.id) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const updated = await api.users.update(user.id, { login: form.login, email: form.email });
      login(localStorage.getItem('token'), { ...user, ...updated });
      setSuccess('Профиль обновлён');
    } catch (err) {
      setError(err.message || 'Ошибка обновления');
    } finally {
      setLoading(false);
    }
  }

  const initials = user?.login
    ? user.login.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || '?';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main style={{ flex: 1, padding: 'var(--pad)', maxWidth: 600, width: '100%', margin: '0 auto' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Профиль</h1>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: 24,
        }}>
          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--accent)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{user?.login || 'Пользователь'}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{user?.email}</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {success && (
              <div style={{ background: 'oklch(0.95 0.04 150)', border: '1px solid oklch(0.8 0.1 150)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', fontSize: 13, color: 'var(--positive)' }}>
                {success}
              </div>
            )}
            {error && (
              <div style={{ background: 'oklch(0.95 0.04 25)', border: '1px solid oklch(0.8 0.1 25)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', fontSize: 13, color: 'var(--negative)' }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 5, display: 'block' }}>Логин</label>
              <input
                type="text"
                value={form.login}
                onChange={e => setForm(p => ({ ...p, login: e.target.value }))}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 5, display: 'block' }}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                alignSelf: 'flex-start',
                padding: '9px 24px',
                fontSize: 13,
                fontWeight: 600,
                background: loading ? 'var(--border)' : 'var(--accent)',
                color: loading ? 'var(--muted)' : '#fff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 4,
              }}
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </form>
        </div>

        {/* Info */}
        <div style={{ marginTop: 16, padding: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Сведения
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['ID', user?.id || '—'],
              ['Активирован', user?.activated ? 'Да' : 'Нет'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', gap: 12, fontSize: 13 }}>
                <span style={{ color: 'var(--muted)', width: 120, flexShrink: 0 }}>{label}</span>
                <span style={{ fontFamily: label === 'ID' ? 'var(--mono)' : 'inherit', fontSize: label === 'ID' ? 11 : 13 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
