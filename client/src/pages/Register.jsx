import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Format email tidak valid.');
    if (form.password.length < 6) return setError('Password minimal 6 karakter.');
    if (form.password !== form.password_confirmation) return setError('Konfirmasi password tidak cocok.');

    setBusy(true);
    try {
      // Server membuat sesi langsung (auto-login) -> langsung ke Beranda, tanpa halaman login
      const { user } = await api.register(form);
      setUser(user);
      navigate('/', { replace: true });
    } catch (err) { setError(err.message); }
    setBusy(false);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-side">
        <h1>ConnectSpace</h1>
        <p>Buat akun dan Anda langsung masuk ke beranda.</p>
      </div>
      <form className="card auth-card" onSubmit={submit}>
        <h2>Daftar</h2>
        {error && <div className="alert error">{error}</div>}
        <label>Nama lengkap<input value={form.name} onChange={set('name')} maxLength={100} required autoFocus /></label>
        <label>Email<input type="email" value={form.email} onChange={set('email')} required /></label>
        <label>Password<input type="password" value={form.password} onChange={set('password')} minLength={6} required /></label>
        <label>Konfirmasi password<input type="password" value={form.password_confirmation} onChange={set('password_confirmation')} required /></label>
        <button className="btn" disabled={busy}>{busy ? 'Memproses…' : 'Buat akun'}</button>
        <p className="muted center">Sudah punya akun? <Link to="/login">Masuk</Link></p>
      </form>
    </div>
  );
}
