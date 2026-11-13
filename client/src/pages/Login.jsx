import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import logoApp from '../assets/logo.png';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const warning = useLocation().state?.warning;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { user } = await api.login(form);
      setUser(user);
      navigate('/', { replace: true });
    } catch (err) { setError(err.message); }
    setBusy(false);
  };

  return (
    <div className="login-layout">
      <div className="login-panel">
        <div className="login-brand">
          <img src={logoApp} alt="Logo DailyoOoo" className="auth-logo" />
          <h1>DailyoOoo</h1>
        </div>
        <form className="card auth-card" onSubmit={submit}>
          <h2>Masuk</h2>
          {warning && <div className="alert warn">{warning}</div>}
          {error && <div className="alert error">{error}</div>}
          <label>Email<input type="email" value={form.email} onChange={set('email')} required autoFocus /></label>
          <label>Password<input type="password" value={form.password} onChange={set('password')} required /></label>
          <button className="btn" disabled={busy}>{busy ? 'Memproses…' : 'Masuk'}</button>
          <p className="muted center">Belum punya akun? <Link to="/register">letsgOow, Daftar disini!</Link></p>
        </form>
      </div>
    </div>
  );
}
