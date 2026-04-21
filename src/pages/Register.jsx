import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';

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

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ login: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.login.length < 3) return setError('Логин должен быть не менее 3 символов');
    const email = form.email.toLowerCase().trim();
    if (form.password.length < 6) return setError('Пароль должен быть не менее 6 символов');
    if (form.password !== form.confirm) return setError('Пароли не совпадают');

    setLoading(true);
    try {
      await api.users.register({ login: form.login, email, password: form.password });
      navigate(`/activation-pending?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err.message || 'Ошибка регистрации. Проверьте данные.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48,
            height: 48,
            background: 'var(--accent)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            fontWeight: 700,
            color: '#fff',
            margin: '0 auto 16px',
          }}>P</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Portal МФТИ</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Создайте аккаунт</div>
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: 28,
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && (
              <div style={{
                background: 'oklch(0.95 0.04 25)',
                border: '1px solid oklch(0.8 0.1 25)',
                borderRadius: 'var(--radius-sm)',
                padding: '9px 12px',
                fontSize: 13,
                color: 'var(--negative)',
              }}>
                {error}
              </div>
            )}

            {[
              { name: 'login', label: 'Логин', type: 'text', placeholder: 'Минимум 3 символа' },
              { name: 'email', label: 'Email', type: 'email', placeholder: 'user@example.com' },
              { name: 'password', label: 'Пароль', type: 'password', placeholder: 'Минимум 6 символов' },
              { name: 'confirm', label: 'Повторите пароль', type: 'password', placeholder: '••••••••' },
            ].map(field => (
              <div key={field.name}>
                <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 5, display: 'block' }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  required
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 0',
                fontSize: 14,
                fontWeight: 600,
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: loading ? 'var(--border)' : 'var(--accent)',
                color: loading ? 'var(--muted)' : '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 4,
              }}
            >
              {loading ? 'Регистрация...' : 'Создать аккаунт'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--muted)' }}>
          Уже есть аккаунт?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Войти</Link>
        </div>
      </div>
    </div>
  );
}
