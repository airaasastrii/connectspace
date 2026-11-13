async function request(url, options = {}) {
  const res = await fetch(url, { credentials: 'same-origin', ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Sesi habis saat memakai fitur terproteksi -> beri tahu AuthContext
    if (res.status === 401 && !url.startsWith('/api/auth/')) window.dispatchEvent(new Event('session-expired'));
    throw Object.assign(new Error(data.message || 'Terjadi kesalahan.'), { status: res.status });
  }
  return data;
}

const json = (method, body) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

// Bentuk FormData dari objek (lewati nilai kosong)
export const toForm = (obj) => {
  const fd = new FormData();
  Object.entries(obj).forEach(([k, v]) => v != null && v !== '' && fd.append(k, v));
  return fd;
};

export const api = {
  me: () => request('/api/auth/me'),
  register: (b) => request('/api/auth/register', json('POST', b)),
  login: (b) => request('/api/auth/login', json('POST', b)),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  updateProfile: (fd) => request('/api/profile', { method: 'PUT', body: fd }),
  changePassword: (b) => request('/api/profile/password', json('PUT', b)),
  posts: () => request('/api/posts'),
  createPost: (fd) => request('/api/posts', { method: 'POST', body: fd }),
  updatePost: (id, fd) => request(`/api/posts/${id}`, { method: 'PUT', body: fd }),
  deletePost: (id) => request(`/api/posts/${id}`, { method: 'DELETE' }),
  toggleLike: (id) => request(`/api/posts/${id}/like`, { method: 'POST' }),
  addComment: (id, fd) => request(`/api/posts/${id}/comments`, { method: 'POST', body: fd }),
  updateComment: (postId, commentId, fd) => request(`/api/posts/${postId}/comments/${commentId}`, { method: 'PUT', body: fd }),
  deleteComment: (postId, commentId) => request(`/api/posts/${postId}/comments/${commentId}`, { method: 'DELETE' }),
};
