
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    api.auth.logout();
    navigate('/login');
  };

  return (
      <header className="main-header">
        <div className="header-content">
          <Link title="На главную" to="/" className="logo">
            MIPT<span>.Portal</span>
          </Link>

          <nav className="nav-links">
            <Link to="/">Объявления</Link>
            <Link to="/profile" className="user-profile-link">
              <div className="user-avatar">{user.email?.[0].toUpperCase()}</div>
              <span>Профиль</span>
            </Link>
            <button onClick={handleLogout} className="logout-btn">Выйти</button>
          </nav>
        </div>
      </header>
  );
}