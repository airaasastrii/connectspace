import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import Avatar, { formatTime } from '../components/Avatar.jsx';
import PostCard from '../components/PostCard.jsx';

// Menampilkan informasi publik dan postingan milik pengguna yang dipilih.
export default function UserProfile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Memuat profil dan postingannya setiap kali ID pada URL berubah.
  useEffect(() => {
    // Menandai apakah permintaan masih terkait dengan halaman yang aktif.
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([api.profile(id), api.posts(id)])
      // Menyimpan kedua respons hanya jika halaman belum berganti.
      .then(([profileResult, postsResult]) => {
        if (!active) return;
        setProfile(profileResult.user);
        setPosts(postsResult.posts);
      })
      // Menampilkan pesan permintaan jika profil atau postingan gagal dimuat.
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      // Mengakhiri indikator loading setelah kedua permintaan selesai.
      .finally(() => {
        if (active) setLoading(false);
      });

    // Membatalkan pembaruan state ketika ID berubah atau halaman ditutup.
    return () => { active = false; };
  }, [id]);

  // Memperbarui satu postingan pada profil setelah pengguna berinteraksi dengannya.
  const updatePost = (updatedPost) => {
    setPosts((currentPosts) => currentPosts.map((post) => post.id === updatedPost.id ? updatedPost : post));
  };

  // Menghapus postingan dari tampilan profil setelah server mengonfirmasi penghapusan.
  const deletePost = (postId) => {
    setPosts((currentPosts) => currentPosts.filter((post) => post.id !== postId));
  };

  if (loading) return <p className="muted center">Memuat profil…</p>;
  if (error) return <div className="alert error">{error}</div>;
  if (!profile) return <div className="alert error">Profil tidak ditemukan.</div>;

  return (
    <>
      <section className="card user-profile">
        <Avatar user={profile} size={104} />
        <div className="user-profile-details">
          <h1>{profile.name}</h1>
          {profile.bio && <p>{profile.bio}</p>}
          <span className="muted">Bergabung {formatTime(profile.createdAt)}</span>
        </div>
        {currentUser.id === profile.id && (
          <Link className="btn user-profile-edit" to="/profile">Edit profil</Link>
        )}
      </section>

      <h2 className="user-profile-posts-title">Postingan</h2>
      {posts.length === 0 ? (
        <p className="muted center">Belum ada postingan.</p>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onChange={updatePost}
            onDelete={deletePost}
          />
        ))
      )}
    </>
  );
}
