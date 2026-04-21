import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const s = {
  header: {
    height: 52,
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    gap: 20,
    position: 'sticky',
    top: 0,
    zIndex: 100,
    flexShrink: 0,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
    cursor: 'pointer',
  },
  logoIcon: {
    width: 26,
    height: 26,
    background: 'var(--accent)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    flexShrink: 0,
  },
  logoText: {
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: '-0.01em',
    color: 'var(--text)',
  },
  logoBadge: {
    fontFamily: 'var(--mono)',
    fontSize: 10.5,
    border: '1px solid var(--border)',
    padding: '1px 5px',
    borderRadius: 3,
    color: 'var(--muted)',
  },
  nav: {
    display: 'flex',
    alignItems: 'stretch',
    height: 52,
  },
  spacer: { flex: 1 },
  divider: {
    width: 1,
    height: 20,
    background: 'var(--border)',
    margin: '0 6px',
    flexShrink: 0,
  },
  balanceWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 1,
    flexShrink: 0,
  },
  balanceLabel: {
    fontFamily: 'var(--mono)',
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--muted)',
    lineHeight: 1,
  },
  balanceValue: {
    fontFamily: 'var(--mono)',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--accent)',
    lineHeight: 1,
  },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'var(--accent)',
    color: '#fff',
    fontWeight: 600,
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    border: 'none',
  },
  dropdown: {
    position: 'absolute',
    top: 36,
    right: 0,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    minWidth: 160,
    zIndex: 200,
    overflow: 'hidden',
  },
  dropdownItem: {
    display: 'block',
    width: '100%',
    padding: '9px 14px',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text)',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
  },
};

const NAV_ITEMS = [
  { label: 'Главная', path: '/' },
  { label: 'Каталог', path: '/catalog' },
  { label: 'Мои сделки', path: '/deals' },
  { label: 'Сообщения', path: '/messages' },
];

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [balance, setBalance] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user?.id) {
      api.wallets.get(user.id).then((w) => setBalance(w?.availableTokens ?? 0)).catch(() => {});
    }
  }, [user?.id]);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const initials = user?.login
    ? user.login.slice(0, 2).toUpperCase()
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '?';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const navItemStyle = (path) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '0 14px',
    fontSize: 12.5,
    fontWeight: isActive(path) ? 600 : 500,
    color: isActive(path) ? 'var(--accent)' : 'var(--muted)',
    borderBottom: isActive(path) ? '2px solid var(--accent)' : '2px solid transparent',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    cursor: 'pointer',
    background: 'none',
    whiteSpace: 'nowrap',
    marginBottom: -1,
  });

  return (
    <header style={s.header}>
      <div style={s.logo} onClick={() => navigate('/')}>
        <div style={s.logoIcon}>P</div>
        <span style={s.logoText}>Portal</span>
        <span style={s.logoBadge}>МФТИ</span>
      </div>

      <nav style={s.nav}>
        {NAV_ITEMS.map((item) => (
          <button key={item.path} style={navItemStyle(item.path)} onClick={() => navigate(item.path)}>
            {item.label}
          </button>
        ))}
      </nav>

      <div style={s.spacer} />

      {balance !== null && (
        <>
          <div style={s.balanceWrap}>
            <span style={s.balanceLabel}>Баланс</span>
            <span style={s.balanceValue}>{balance.toLocaleString('ru')} t</span>
          </div>
          <div style={s.divider} />
        </>
      )}

      <div style={s.avatarWrap} ref={dropdownRef}>
        <button style={s.avatar} onClick={() => setDropdownOpen((v) => !v)}>
          {initials}
        </button>
        {dropdownOpen && (
          <div style={s.dropdown}>
            {[
              { label: 'Профиль', path: '/profile' },
              { label: 'Кошелёк', path: '/wallet' },
            ].map(({ label, path }) => (
              <button
                key={path}
                style={s.dropdownItem}
                onClick={() => { navigate(path); setDropdownOpen(false); }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {label}
              </button>
            ))}
            <div style={{ height: 1, background: 'var(--border)', margin: '2px 0' }} />
            <button
              style={{ ...s.dropdownItem, color: 'var(--negative)' }}
              onClick={handleLogout}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              Выйти
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
