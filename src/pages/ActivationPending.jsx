import { useSearchParams, Link } from 'react-router-dom';

export default function ActivationPending() {
  const [params] = useSearchParams();
  const email = params.get('email') || 'вашу почту';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#fff', margin: '0 auto 24px' }}>
          ✉
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Подтвердите email</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 24 }}>
          Мы отправили письмо с ссылкой активации на адрес{' '}
          <strong style={{ color: 'var(--text)' }}>{email}</strong>.
          Перейдите по ссылке в письме, чтобы активировать аккаунт.
        </p>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 24, fontSize: 13, color: 'var(--muted)', textAlign: 'left' }}>
          <strong style={{ color: 'var(--text)', display: 'block', marginBottom: 6 }}>Не получили письмо?</strong>
          Проверьте папку «Спам». Письмо должно прийти в течение нескольких минут.
          Если email не настроен — найдите ссылку активации в логах сервера уведомлений.
        </div>
        <Link to="/login" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
          Вернуться на страницу входа
        </Link>
      </div>
    </div>
  );
}
