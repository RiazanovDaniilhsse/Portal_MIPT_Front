import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  fontSize: 14,
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--surface)',
  color: 'var(--text)',
  outline: 'none',
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notActivated, setNotActivated] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setNotActivated(false);

    const normalizedEmail = email.toLowerCase().trim();
    setLoading(true);
    try {
      const data = await api.auth.login(normalizedEmail, password);
      const userInfo = await api.users.getByEmail(normalizedEmail);
      const normalized = { ...userInfo, id: userInfo.userID, email: normalizedEmail };
      login(data.token || 'fake-jwt-token-for-now', normalized);
      navigate('/');
    } catch (err) {
      if (err.message?.includes('не активирован')) {
        setNotActivated(true);
        setError(err.message);
      } else {
        setError(err.message || 'Неверный email или пароль');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 auto 16px' }}>P</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Portal МФТИ</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Войдите в аккаунт</div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 28 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && (
              <div style={{ background: 'oklch(0.95 0.04 25)', border: '1px solid oklch(0.8 0.1 25)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', fontSize: 13, color: 'var(--negative)' }}>
                {error}
                {notActivated && (
                  <div style={{ marginTop: 6 }}>
                    <Link to={`/activation-pending?email=${encodeURIComponent(email)}`} style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 12 }}>
                      Информация об активации →
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 5, display: 'block' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 5, display: 'block' }}>Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '10px 0', fontSize: 14, fontWeight: 600, border: 'none', borderRadius: 'var(--radius-sm)', background: loading ? 'var(--border)' : 'var(--accent)', color: loading ? 'var(--muted)' : '#fff', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--muted)' }}>
          Нет аккаунта?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Зарегистрироваться</Link>
        </div>
      </div>
    </div>
  );
}
