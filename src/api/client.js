const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:8080';
const getAuthToken = () => localStorage.getItem('token');

async function fetchJson(url, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {...options, headers});

  if (response.status === 401) {
    auth.logout();
    window.location.href = '/login';
    throw new Error('Сессия истекла');
  }

  return response.json();
}

export const api = {
  auth: {
    login: (email, password) =>
        fetchJson('/api/users/authenticate/email', {
          method: 'POST',
          body: JSON.stringify({email, password})
        }),
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  users: {
    getAll: () => fetchJson('/api/users'),
    getById: (id) => fetchJson(`/api/users/${id}`),
    getByEmail: (email) =>
        fetchJson(`/api/users/by-email?email=${encodeURIComponent(email)}`),

    register: (data) =>
        fetchJson('/api/users', {
          method: 'POST',
          body: JSON.stringify({
            login: data.login,
            email: data.email?.toLowerCase()?.trim(),
            password: data.password
          })
        }),

    update: (id, data) =>
        fetchJson(`/api/users/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        }),

    delete: (id) =>
        fetchJson(`/api/users/${id}`, {method: 'DELETE'})
  },

  wallets: {
    getByUserId: (userId) => fetchJson(`/api/wallets/${userId}`),
  },
  advertisements: {
    getAll: () => fetchJson('/api/v1/advertisements'),
    getById: (id) => fetchJson(`/api/v1/advertisements/${id}`),
    create: (adData) =>
        fetchJson('/api/v1/advertisements', {
          method: 'POST',
          body: JSON.stringify(adData)
        }),
    getCategories: () => fetchJson('/api/v1/advertisements/categories'),
  },
};

export const auth = {
  getToken: () => localStorage.getItem('token'),
  isAuthenticated: () => !!auth.getToken(),
  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  isLoggedIn: () => !!localStorage.getItem('token'),
  getUser: () => JSON.parse(localStorage.getItem('user') || '{}'),
};
