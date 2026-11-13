import { useState } from 'react';
import { api, toForm } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import ImageInput, { emptyImage } from '../components/ImageInput.jsx';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [img, setImg] = useState(emptyImage);
  const [pMsg, setPMsg] = useState(null);

  const [pw, setPw] = useState({ old_password: '', new_password: '', new_password_confirmation: '' });
  const [wMsg, setWMsg] = useState(null);

  const saveProfile = async (e) => {
    e.preventDefault();
    setPMsg(null);
    try {
      const r = await api.updateProfile(toForm({ name, bio, avatar: img.file, avatar_url: img.url }));
      setUser(r.user);
      setImg(emptyImage);
      setPMsg({ ok: true, text: 'Profil berhasil diperbarui.' });
    } catch (err) { setPMsg({ ok: false, text: err.message }); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setWMsg(null);
    try {
      const r = await api.changePassword(pw);
      setPw({ old_password: '', new_password: '', new_password_confirmation: '' });
      setWMsg({ ok: true, text: r.message });
    } catch (err) { setWMsg({ ok: false, text: err.message }); }
  };
  const setP = (k) => (e) => setPw({ ...pw, [k]: e.target.value });

  return (
    <>
      <form className="card form" onSubmit={saveProfile}>
        <h2>Edit profil</h2>
        {pMsg && <div className={`alert ${pMsg.ok ? 'ok' : 'error'}`}>{pMsg.text}</div>}
        <label>Nama<input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required /></label>
        <label>Bio<textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={500} /></label>
        <ImageInput value={img} onChange={setImg} label="Foto profil" current={user.avatar} />
        <button className="btn">Simpan profil</button>
      </form>

      <form className="card form" onSubmit={savePassword}>
        <h2>Ubah password</h2>
        {wMsg && <div className={`alert ${wMsg.ok ? 'ok' : 'error'}`}>{wMsg.text}</div>}
        <label>Password lama<input type="password" value={pw.old_password} onChange={setP('old_password')} required /></label>
        <label>Password baru<input type="password" value={pw.new_password} onChange={setP('new_password')} minLength={6} required /></label>
        <label>Konfirmasi password baru<input type="password" value={pw.new_password_confirmation} onChange={setP('new_password_confirmation')} required /></label>
        <button className="btn">Simpan password</button>
      </form>
    </>
  );
}
