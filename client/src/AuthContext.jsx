import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);
// Mengambil konteks autentikasi dari komponen React yang sedang dirender.
export const useAuth = () => useContext(AuthContext);

// Menyediakan informasi pengguna serta aksi autentikasi ke seluruh aplikasi.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Memuat sesi saat awal dan mendengarkan pemberitahuan sesi yang kedaluwarsa.
  useEffect(() => {
    // Memuat pengguna aktif dan menyelesaikan status loading setelah respons.
    api.me().then((r) => setUser(r.user)).catch(() => setUser(null)).finally(() => setLoading(false));
    // Mengosongkan pengguna lokal ketika sesi server tidak lagi berlaku.
    const expired = () => setUser(null);
    window.addEventListener('session-expired', expired);
    // Melepas listener saat provider dibongkar.
    return () => window.removeEventListener('session-expired', expired);
  }, []);

  // Mengakhiri sesi di server lalu mengosongkan pengguna lokal.
  const logout = async () => {
    await api.logout().catch(() => {});
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, setUser, loading, logout }}>{children}</AuthContext.Provider>;
}
