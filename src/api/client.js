const getAuthToken = () => localStorage.getItem('token');

async function fetchJson(url, options = {}) {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    const hadToken = !!localStorage.getItem('token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (hadToken) {
      window.location.href = '/login';
    }
    throw new Error('Неверный email или пароль');
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') return null;

  const text = await response.text();
  if (!text) return null;

  const data = JSON.parse(text);
  if (!response.ok) {
    throw new Error(data?.message || `Ошибка ${response.status}`);
  }
  return data;
}

export const api = {
  auth: {
    login: (email, password) =>
      fetchJson('/api/users/authenticate/email', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
  },

  users: {
    getAll: () => fetchJson('/api/users'),
    getById: (id) => fetchJson(`/api/users/${id}`),
    getByEmail: (email) => fetchJson(`/api/users/by-email?email=${encodeURIComponent(email)}`),
    register: (data) =>
      fetchJson('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          login: data.login,
          email: data.email?.toLowerCase()?.trim(),
          password: data.password,
        }),
      }),
    activate: (token) => fetchJson(`/api/users/activate?token=${encodeURIComponent(token)}`),
    update: (id, data) =>
      fetchJson(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetchJson(`/api/users/${id}`, { method: 'DELETE' }),
  },

  advertisements: {
    getAll: (params = {}) => {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => v !== undefined && v !== null && q.set(k, v));
      const qs = q.toString();
      return fetchJson(`/api/v1/advertisements${qs ? '?' + qs : ''}`);
    },
    getById: (id) => fetchJson(`/api/v1/advertisements/${id}`),
    create: (adData) =>
      fetchJson('/api/v1/advertisements', { method: 'POST', body: JSON.stringify(adData) }),
    update: (id, data) =>
      fetchJson(`/api/v1/advertisements/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    publish: (id) => fetchJson(`/api/v1/advertisements/${id}/publish`, { method: 'PATCH' }),
    pause: (id) => fetchJson(`/api/v1/advertisements/${id}/pause`, { method: 'PATCH' }),
    toggleFavorite: (id) => fetchJson(`/api/v1/advertisements/${id}/favorite/toggle`, { method: 'POST' }),
    delete: (id) => fetchJson(`/api/v1/advertisements/${id}`, { method: 'DELETE' }),
    getCategories: (type) =>
      fetchJson(`/api/v1/advertisements/categories${type ? '?type=' + type : ''}`),
  },

  search: {
    byText: (value, limit = 50, offset = 0) =>
      fetchJson(`/api/search/text?value=${encodeURIComponent(value)}&limit=${limit}&offset=${offset}`),
    byCategory: (value, limit = 50, offset = 0) =>
      fetchJson(`/api/search/category?value=${encodeURIComponent(value)}&limit=${limit}&offset=${offset}`),
    byType: (value, limit = 50, offset = 0) =>
      fetchJson(`/api/search/type?value=${encodeURIComponent(value)}&limit=${limit}&offset=${offset}`),
  },

  reviews: {
    getBySeller: (sellerId, page = 0, size = 20) =>
      fetchJson(`/api/v1/reviews/sellers/${sellerId}?page=${page}&size=${size}`),
    getByAd: (adId, page = 0, size = 20) =>
      fetchJson(`/api/v1/reviews/advertisements/${adId}?page=${page}&size=${size}`),
    getSellerRating: (sellerId) => fetchJson(`/api/v1/reviews/sellers/${sellerId}/rating`),
    create: (data, userId) =>
      fetchJson('/api/v1/reviews', {
        method: 'POST',
        headers: { 'X-User-Id': userId },
        body: JSON.stringify(data),
      }),
  },

  wallets: {
    get: (userId) => fetchJson(`/api/wallets/${userId}`),
    topUp: (userId, amount) =>
      fetchJson(`/api/wallets/${userId}/topup?amount=${amount}`, { method: 'POST' }),
    getOperations: (userId) => fetchJson(`/api/wallets/${userId}/operations`),
    reserve: (clientId, performerId, amount, title) =>
      fetchJson('/api/wallets/operations/reserve', { method: 'POST', body: JSON.stringify({ clientId, performerId, amount, title }) }),
    pay: (clientId, performerId, amount, title) =>
      fetchJson('/api/wallets/operations/pay', { method: 'POST', body: JSON.stringify({ clientId, performerId, amount, title }) }),
    cancel: (clientId, performerId, amount, title) =>
      fetchJson('/api/wallets/operations/cancel', { method: 'POST', body: JSON.stringify({ clientId, performerId, amount, title }) }),
    refund: (clientId, performerId, amount, title) =>
      fetchJson('/api/wallets/operations/refund', { method: 'POST', body: JSON.stringify({ clientId, performerId, amount, title }) }),
  },

  chats: {
    getAll: (userId) => fetchJson(`/api/chats?userId=${userId}`),
    create: (ownerId, memberId) =>
      fetchJson('/api/chats', {
        method: 'POST',
        body: JSON.stringify({ ownerId, memberId }),
      }),
    getMessages: (chatId) => fetchJson(`/api/chats/${chatId}/messages`),
    sendMessage: (chatId, senderId, text) =>
      fetchJson(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ senderId, text }),
      }),
  },
};
