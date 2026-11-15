import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, toForm } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import ImageInput, { emptyImage } from '../components/ImageInput.jsx';
import PostCard from '../components/PostCard.jsx';
import { getCurrentLocation } from '../location.js';

// Menampilkan feed, memuat postingan, dan menyediakan formulir postingan baru.
export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [img, setImg] = useState(emptyImage);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Mengambil daftar postingan saat halaman feed pertama kali dimuat.
  useEffect(() => {
    // Menyimpan hasil permintaan, menampilkan error, dan mengakhiri loading.
    api.posts().then((r) => setPosts(r.posts)).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  // Memvalidasi dan mengirim status baru beserta gambar opsional.
  const submit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !img.file && !img.url.trim()) return setError('Tulis status atau lampirkan gambar.');
    setBusy(true);
    setError('');
    try {
      const location = await getCurrentLocation();
      const { post } = await api.createPost(toForm({ content, image: img.file, image_url: img.url, ...location }));
      setPosts([post, ...posts]); // terbaru di paling atas
      setContent('');
      setImg(emptyImage);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <>
      <form className="card composer" onSubmit={submit}>
        <div className="row top">
          <Link to={`/profile/${user.id}`} aria-label={`Buka profil ${user.name}`}>
            <Avatar user={user} size={44} />
          </Link>
          {/* Callback input ini memperbarui teks status yang sedang disusun. */}
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={`Apa kabar, ${user.name.split(' ')[0]}?`} rows={3} maxLength={2000} />
        </div>
        <ImageInput value={img} onChange={setImg} label="Lampirkan gambar" />
        <p className="location-note"><i className="bi bi-geo-alt" aria-hidden="true"></i> Lokasi terkini akan disertakan saat posting.</p>
        {error && <div className="alert error">{error}</div>}
        {/* SUPAYAAA ADA BATASAN BAHWA LEBIH DARI 500 ITU GABISAA */}
        {content.length > 500 && <div className="alert error">Status terlalu panjang. Maksimal 500 karakter.</div>}
        <button className="btn btn-icon" disabled={busy || content.length > 500}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
          {busy ? 'Memposting…' : 'Posting'}
        </button>
      </form>

      {loading && <p className="muted center">Memuat…</p>}
      {!loading && posts.length === 0 && <p className="muted center">Belum ada status. Jadilah yang pertama memposting.</p>}
      {/* Callback pada kartu menyegarkan atau menghapus postingan dari daftar feed. */}
      {posts.map((p) => (
        <PostCard
          key={p.id}
          post={p}
          onChange={(np) => setPosts(posts.map((x) => (x.id === np.id ? np : x)))}
          onDelete={(id) => setPosts(posts.filter((x) => x.id !== id))}
        />
      ))}
    </>
  );
}
