// Mengirim permintaan ke API dan menangani respons maupun error sesi.
async function request(url, options = {}) {
  const res = await fetch(url, { credentials: 'same-origin', ...options });
  // Mengubah respons JSON; respons kosong atau tak valid diperlakukan sebagai objek kosong.
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Sesi habis saat memakai fitur terproteksi -> beri tahu AuthContext
    if (res.status === 401 && !url.startsWith('/api/auth/')) window.dispatchEvent(new Event('session-expired'));
    throw Object.assign(new Error(data.message || 'Terjadi kesalahan.'), { status: res.status });
  }
  return data;
}

// Membuat opsi fetch untuk permintaan JSON.
const json = (method, body) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

// Membentuk FormData dari objek sambil melewati nilai yang kosong.
export const toForm = (obj) => {
  const fd = new FormData();
  // Menambahkan nilai yang tersedia sebagai field multipart.
  Object.entries(obj).forEach(([k, v]) => v != null && v !== '' && fd.append(k, v));
  return fd;
};

// Menyediakan fungsi permintaan API yang digunakan aplikasi.
export const api = {
  // Mengambil profil pengguna yang sedang masuk.
  me: () => request('/api/auth/me'),
  // Membuat akun baru.
  register: (b) => request('/api/auth/register', json('POST', b)),
  // Membuka sesi pengguna.
  login: (b) => request('/api/auth/login', json('POST', b)),
  // Menutup sesi pengguna.
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  // Memperbarui profil dan avatarnya.
  updateProfile: (fd) => request('/api/profile', { method: 'PUT', body: fd }),
  // Mengambil informasi profil publik berdasarkan ID pengguna.
  profile: (id) => request(`/api/profile/${id}`),
  // Mengubah kata sandi pengguna.
  changePassword: (b) => request('/api/profile/password', json('PUT', b)),
  // Mengambil daftar postingan.
  posts: (userId) => request(`/api/posts${userId ? `?user_id=${userId}` : ''}`),
  // Membuat postingan baru.
  createPost: (fd) => request('/api/posts', { method: 'POST', body: fd }),
  // Memperbarui postingan yang dipilih.
  updatePost: (id, fd) => request(`/api/posts/${id}`, { method: 'PUT', body: fd }),
  // Menghapus postingan yang dipilih.
  deletePost: (id) => request(`/api/posts/${id}`, { method: 'DELETE' }),
  // Mengubah status like pada postingan.
  toggleLike: (id) => request(`/api/posts/${id}/like`, { method: 'POST' }),
  // Menambahkan komentar pada postingan.
  addComment: (id, fd) => request(`/api/posts/${id}/comments`, { method: 'POST', body: fd }),
  // Mengubah status like komentar.
  toggleCommentLike: (postId, commentId) => request(`/api/posts/${postId}/comments/${commentId}/like`, { method: 'POST' }),
  // Memperbarui komentar tertentu beserta lampirannya.
  updateComment: (postId, commentId, fd) => request(`/api/posts/${postId}/comments/${commentId}`, { method: 'PUT', body: fd }),
  // Menghapus komentar tertentu dari postingan.
  deleteComment: (postId, commentId) => request(`/api/posts/${postId}/comments/${commentId}`, { method: 'DELETE' }),
};
