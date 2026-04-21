import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';

export default function Activate() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    api.users.activate(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  const content = {
    loading: { icon: '⏳', title: 'Активация...', text: 'Подождите, активируем ваш аккаунт.', color: 'var(--muted)' },
    success: { icon: '✓', title: 'Аккаунт активирован!', text: 'Теперь вы можете войти в свой аккаунт.', color: 'var(--positive)' },
    error:   { icon: '✕', title: 'Ссылка недействительна', text: 'Токен уже использован или не существует. Попробуйте зарегистрироваться снова.', color: 'var(--negative)' },
    invalid: { icon: '✕', title: 'Неверная ссылка', text: 'Ссылка активации некорректна.', color: 'var(--negative)' },
  }[status];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, background: content.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#fff', margin: '0 auto 24px', fontWeight: 700 }}>
          {content.icon}
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{content.title}</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 24 }}>{content.text}</p>
        {status === 'success' && (
          <Link to="/login" style={{ display: 'inline-block', padding: '10px 24px', background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
            Войти
          </Link>
        )}
        {(status === 'error' || status === 'invalid') && (
          <Link to="/register" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
            Зарегистрироваться заново
          </Link>
        )}
      </div>
    </div>
  );
}
