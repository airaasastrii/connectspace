// Mengimpor hook untuk efek samping dan penyimpanan state komponen.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// Mengimpor fungsi API serta pembentuk FormData untuk permintaan server.
import { api, toForm } from '../api.js';
// Mengimpor avatar pengguna dan pemformat waktu.
import Avatar, { formatTime } from './Avatar.jsx';
// Mengimpor input gambar dan nilai gambar kosong.
import ImageInput, { emptyImage } from './ImageInput.jsx';
import LocationLink from './LocationLink.jsx';
import { getCurrentLocation } from '../location.js';
import MeatballsMenu from './MeatballsMenu.jsx';
// Memuat ikon Bootstrap yang digunakan pada tampilan komentar.
import "bootstrap-icons/font/bootstrap-icons.css";

// Mendefinisikan kartu postingan beserta handler perubahan dan penghapusannya.
export default function PostCard({ post, onChange, onDelete }) {
  // Menandai proses postingan seperti menyimpan edit atau mengirim komentar.
  const [busy, setBusy] = useState(false);
  // Menyimpan pesan kesalahan yang akan ditampilkan kepada pengguna.
  const [error, setError] = useState('');
  // Menyimpan teks komentar baru yang sedang diketik.
  const [text, setText] = useState('');
  // Menyimpan gambar yang dipilih untuk komentar baru.
  const [img, setImg] = useState(emptyImage);
  // Mengontrol tampilan pilihan lampiran gambar komentar baru.
  const [showAttach, setShowAttach] = useState(false);
  // Menandai apakah postingan sedang dalam mode edit.
  const [editing, setEditing] = useState(false);
  // Menyimpan teks postingan yang sedang diedit.
  const [editContent, setEditContent] = useState('');
  // Menandai apakah gambar postingan akan dihapus saat edit.
  const [removeImage, setRemoveImage] = useState(false);
  // Menyimpan data foto yang sedang dibuka di penampil gambar.
  const [viewingImage, setViewingImage] = useState(null);
  // Menyimpan tingkat pembesaran foto di penampil gambar.
  const [imageZoom, setImageZoom] = useState(1);
  // Menyimpan ID komentar yang saat ini sedang diedit.
  const [editingCommentId, setEditingCommentId] = useState(null);
  // Menyimpan teks komentar yang sedang diedit.
  const [editCommentContent, setEditCommentContent] = useState('');
  // Menyimpan gambar baru untuk komentar yang sedang diedit.
  const [editCommentImg, setEditCommentImg] = useState(emptyImage);
  // Menandai apakah gambar komentar akan dihapus saat edit.
  const [removeCommentImage, setRemoveCommentImage] = useState(false);
  // Menandai proses simpan atau hapus komentar.
  const [commentBusy, setCommentBusy] = useState(false);
  // Menandai komentar yang like-nya sedang diperbarui.
  const [likingCommentIds, setLikingCommentIds] = useState([]);
  // Menyimpan ID komentar yang sedang dibalas dan isi balasannya.
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Mengatur listener keyboard hanya selama penampil gambar terbuka.
  useEffect(() => {
    // Tidak memasang listener jika tidak ada gambar yang sedang ditampilkan.
    if (!viewingImage) return undefined;

    // Menutup penampil gambar ketika tombol Escape ditekan.
    // Menangani tombol keyboard untuk menutup viewer dengan Escape.
    const handleKeyDown = (event) => {
      // Memeriksa tombol yang ditekan pengguna.
      if (event.key === 'Escape') setViewingImage(null);
    };

    // Mendaftarkan listener tombol pada jendela browser.
    window.addEventListener('keydown', handleKeyDown);
    // Membersihkan listener saat penampil ditutup atau komponen dilepas.
    // Melepas listener keyboard saat efek dibersihkan.
    return () => window.removeEventListener('keydown', handleKeyDown);
    // Memasang ulang efek hanya jika gambar yang dibuka berubah.
  }, [viewingImage]);

  // Membuka foto dan selalu memulai tampilannya pada skala normal.
  const openImage = (src, alt) => {
    // Mengatur ulang tingkat zoom untuk foto yang baru dibuka.
    setImageZoom(1);
    // Menyimpan sumber gambar dan teks alternatif untuk penampil.
    setViewingImage({ src, alt });
  };

  // Mengirim permintaan untuk menyukai atau batal menyukai postingan.
  const like = async () => {
    // Mengosongkan pesan kesalahan dari tindakan sebelumnya.
    setError('');
    // Menjalankan permintaan like dan memperbarui data postingan lokal.
    try {
      // Meminta server mengubah status like pengguna.
      const r = await api.toggleLike(post.id);
      // Memperbarui status like dan jumlah like pada komponen induk.
      onChange({ ...post, liked: r.liked, like_count: r.like_count });
    // Menampilkan pesan jika permintaan like gagal.
    } catch (e) { setError(e.message); }
  };

  // Menghapus postingan setelah pengguna mengonfirmasi tindakan.
  const remove = async () => {
    // Membatalkan proses jika pengguna tidak menyetujui konfirmasi.
    if (!window.confirm('Hapus postingan ini?')) return;
    // Mengirim permintaan hapus dan memberi tahu komponen induk.
    try {
      // Meminta server menghapus postingan berdasarkan ID-nya.
      await api.deletePost(post.id);
      // Menghapus postingan dari tampilan induk.
      onDelete(post.id);
    // Menampilkan pesan jika penghapusan postingan gagal.
    } catch (e) { setError(e.message); }
  };

  // Menyiapkan nilai awal ketika pengguna mulai mengedit postingan.
  const startEditing = () => {
    // Mengisi editor dengan teks postingan saat ini.
    setEditContent(post.content || '');
    // Mengosongkan pilihan gambar baru.
    setImg(emptyImage);
    // Menjaga gambar saat ini kecuali pengguna memilih menghapusnya.
    setRemoveImage(false);
    // Menghapus pesan kesalahan yang lama.
    setError('');
    // Mengaktifkan tampilan formulir edit postingan.
    setEditing(true);
  };

  // Membatalkan edit dan mengembalikan state form ke kondisi awal.
  const cancelEditing = () => {
    // Menutup mode edit postingan.
    setEditing(false);
    // Mengosongkan gambar yang dipilih pada form edit.
    setImg(emptyImage);
    // Membatalkan pilihan untuk menghapus gambar postingan.
    setRemoveImage(false);
    // Menghapus pesan kesalahan pada form.
    setError('');
  };

  // Menyimpan perubahan teks dan gambar postingan ke server.
  const saveEdit = async (e) => {
    // Mencegah form memuat ulang halaman browser.
    e.preventDefault();
    // Menandai proses penyimpanan agar tombol dapat dinonaktifkan.
    setBusy(true);
    // Menghapus pesan kesalahan sebelum permintaan dijalankan.
    setError('');
    // Memperbarui postingan dan menyegarkan data di komponen induk.
    try {
      // Mengirim teks dan informasi gambar dalam bentuk FormData.
      const { post: updatedPost } = await api.updatePost(post.id, toForm({
        // Menyertakan teks postingan hasil edit.
        content: editContent,
        // Menyertakan file gambar baru jika dipilih.
        image: img.file,
        // Menyertakan URL gambar baru jika digunakan.
        image_url: img.url,
        // Memberi tahu server apakah gambar lama dipertahankan.
        keep_image: post.image && !removeImage,
      }));
      // Memperbarui postingan di daftar yang dikelola komponen induk.
      onChange(updatedPost);
      // Menutup form edit setelah penyimpanan berhasil.
      setEditing(false);
      // Membersihkan pilihan gambar setelah penyimpanan.
      setImg(emptyImage);
      // Mengatur ulang penanda penghapusan gambar.
      setRemoveImage(false);
    // Menampilkan pesan jika server gagal menyimpan perubahan.
    } catch (e2) { setError(e2.message); }
    // Mengakhiri status sibuk setelah permintaan selesai.
    setBusy(false);
  };

  // Mengirim komentar baru beserta teks dan lampiran opsional.
  const send = async (e) => {
    // Mencegah form komentar memuat ulang halaman.
    e.preventDefault();
    // Menandai permintaan komentar sebagai sedang berlangsung.
    setBusy(true);
    // Menghapus pesan kesalahan sebelumnya.
    setError('');
    // Menambahkan komentar dan memperbarui daftar komentar lokal.
    try {
      const location = await getCurrentLocation();
      // Mengirim teks serta lampiran komentar ke server.
      const r = await api.addComment(post.id, toForm({ comment: text, image: img.file, image_url: img.url, ...location }));
      // Menambahkan komentar baru ke data postingan di komponen induk.
      onChange({ ...post, comments: [...post.comments, r.comment] });
      // Mengosongkan kolom teks komentar setelah berhasil dikirim.
      setText('');
      // Mengosongkan pilihan lampiran setelah berhasil dikirim.
      setImg(emptyImage);
      // Menutup pilihan lampiran gambar.
      setShowAttach(false);
    // Menampilkan pesan jika komentar gagal dikirim.
    } catch (e2) { setError(e2.message); }
    // Mengakhiri status sibuk setelah permintaan selesai.
    finally { setBusy(false); }
  };

  // Mengirim balasan dan menambahkannya ke daftar balasan komentar induk.
  const sendReply = async (e, parentComment) => {
    e.preventDefault();
    setCommentBusy(true);
    setError('');
    try {
      const location = await getCurrentLocation();
      const { comment: reply } = await api.addComment(
        post.id,
        toForm({ comment: replyText, parent_id: parentComment.id, ...location })
      );
      onChange({
        ...post,
        comments: post.comments.map((item) => item.id === parentComment.id
          ? { ...item, replies: [reply, ...(item.replies || [])] }
          : item),
      });
      setReplyText('');
      setReplyingToId(null);
    } catch (e) {
      setError(e.message);
    } finally { setCommentBusy(false); }
  };

  // Toggle like komentar atau balasan lalu memperbarui datanya di state postingan.
  const toggleCommentLike = async (comment) => {
    if (likingCommentIds.includes(comment.id)) return;
    setLikingCommentIds((current) => [...current, comment.id]);
    setError('');
    try {
      const result = await api.toggleCommentLike(post.id, comment.id);
      onChange({
        ...post,
        comments: post.comments.map((item) => item.id === comment.id
          ? { ...item, liked: result.liked, like_count: result.like_count }
          : {
            ...item,
            replies: item.replies?.map((reply) => reply.id === comment.id
              ? { ...reply, liked: result.liked, like_count: result.like_count }
              : reply),
          }),
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLikingCommentIds((current) => current.filter((id) => id !== comment.id));
    }
  };

  // Mengisi form dengan data komentar yang dipilih untuk diedit.
  const startEditingComment = (comment) => {
    // Menyimpan ID komentar yang sedang diedit.
    setEditingCommentId(comment.id);
    // Menyalin teks komentar lama ke kolom edit.
    setEditCommentContent(comment.comment || '');
    // Memulai tanpa gambar pengganti yang dipilih.
    setEditCommentImg(emptyImage);
    // Mempertahankan gambar lama secara default.
    setRemoveCommentImage(false);
    // Mengosongkan pesan kesalahan yang lama.
    setError('');
  };

  // Membatalkan edit komentar dan membersihkan state form-nya.
  const cancelEditingComment = () => {
    // Menutup editor komentar.
    setEditingCommentId(null);
    // Menghapus teks yang tersimpan pada form edit.
    setEditCommentContent('');
    // Menghapus file atau URL gambar baru dari form.
    setEditCommentImg(emptyImage);
    // Mengatur ulang pilihan penghapusan gambar komentar.
    setRemoveCommentImage(false);
    // Membersihkan pesan kesalahan.
    setError('');
  };

  // Mengirim perubahan komentar ke server dan memperbarui tampilan.
  const saveCommentEdit = async (e, comment) => {
    // Mencegah submit form memuat ulang halaman.
    e.preventDefault();
    // Menandai bahwa perubahan komentar sedang disimpan.
    setCommentBusy(true);
    // Menghapus pesan kesalahan yang tersisa.
    setError('');
    // Menyimpan komentar dan mengganti datanya pada daftar lokal.
    try {
      // Meminta server memperbarui komentar beserta lampirannya.
      const { comment: updatedComment } = await api.updateComment(
        // Mengirim ID postingan tempat komentar berada.
        post.id,
        // Mengirim ID komentar yang sedang diubah.
        comment.id,
        // Menyusun isi komentar dan pengaturan gambarnya.
        toForm({
          // Menyertakan teks komentar yang diedit.
          comment: editCommentContent,
          // Menyertakan file gambar pengganti jika dipilih.
          image: editCommentImg.file,
          // Menyertakan URL gambar pengganti jika digunakan.
          image_url: editCommentImg.url,
          // Menentukan apakah gambar lama tetap dipertahankan.
          keep_image: comment.image && !removeCommentImage,
        })
      );
      // Mengganti komentar lama dengan data terbaru dari server.
      onChange({
        // Mempertahankan properti lain pada postingan.
        ...post,
        // Menyalin daftar komentar sambil mengganti komentar yang disunting.
        comments: post.comments.map((item) => item.id === comment.id
          ? updatedComment
          : {
            ...item,
            replies: item.replies?.map((reply) => reply.id === comment.id ? updatedComment : reply),
          }),
      });
      // Menutup editor dan membersihkan state setelah berhasil.
      cancelEditingComment();
    // Menampilkan pesan jika pembaruan komentar gagal.
    } catch (e) { setError(e.message); }
    // Mengakhiri status sibuk setelah permintaan selesai.
    setCommentBusy(false);
  };

  // Menghapus komentar setelah pengguna menyetujui konfirmasi.
  const deleteComment = async (comment) => {
    // Menghentikan proses jika pengguna membatalkan konfirmasi.
    if (!window.confirm('Hapus komentar ini?')) return;
    // Menandai bahwa komentar sedang dihapus.
    setCommentBusy(true);
    // Membersihkan pesan kesalahan sebelumnya.
    setError('');
    // Menghapus komentar dari server dan memperbarui tampilan lokal.
    try {
      // Mengirim permintaan hapus dengan ID postingan dan komentar.
      await api.deleteComment(post.id, comment.id);
      // Menyisakan komentar yang tidak dihapus pada daftar lokal.
      onChange({
        ...post,
        comments: post.comments
          .filter((item) => item.id !== comment.id)
          .map((item) => ({
            ...item,
            replies: item.replies?.filter((reply) => reply.id !== comment.id),
          })),
      });
      // Menutup editor apabila komentar yang dihapus sedang diedit.
      if (editingCommentId === comment.id) cancelEditingComment();
    // Menampilkan pesan jika penghapusan komentar gagal.
    } catch (e) { setError(e.message); }
    // Mengakhiri status sibuk setelah permintaan selesai.
    setCommentBusy(false);
  };

  // Merender seluruh bagian kartu postingan dan interaksinya.
  return (
    <article className="card post">
      {/* Menampilkan identitas penulis dan tindakan untuk postingan milik pengguna. */}
      <header className="post-head">
        <Link to={`/profile/${post.author.id}`} aria-label={`Buka profil ${post.author.name}`}>
          <Avatar user={post.author} size={44} />
        </Link>
        <div className="post-meta">
          <Link className="profile-name-link" to={`/profile/${post.author.id}`}>
            <strong>{post.author.name}</strong>
          </Link>
          {/* created_at buat tanggl nyaa */}
          <time>{formatTime(post.created_at)}</time>
          <LocationLink latitude={post.latitude} longitude={post.longitude} locationName={post.location_name} />
        </div>
        {/* is_owner itu menunjukkan apakah pengguna adalah pemilik postingan bisa delete dan edit */}
        {post.is_owner && !editing && (
          <MeatballsMenu label="postingan" onEdit={startEditing} onDelete={remove} />
        )}
      </header>

      {editing ? (
        <form className="post-edit-form" onSubmit={saveEdit}>
          <textarea
            value={editContent}
            /* Memperbarui state teks setiap kali isi editor berubah. */
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Tulis status…"
            rows={3}
            maxLength={2000}
          />
          <ImageInput
            value={img}
            /* Menyimpan pilihan gambar dan membatalkan penanda hapus. */
            onChange={(value) => { setImg(value); setRemoveImage(false); }}
            label="Ganti gambar (opsional)"
            current={removeImage ? null : post.image}
          />
          {post.image && !removeImage && (
            /* Callback ini menandai gambar lama untuk dihapus. */
            <button type="button" className="btn btn-ghost danger btn-icon" onClick={() => { setRemoveImage(true); setImg(emptyImage); }}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 14H6L5 6" /><path d="M10 11v5M14 11v5" /></svg>
              Hapus gambar
            </button>
          )}
          {removeImage && (
            /* Callback ini membatalkan penghapusan gambar postingan. */
            <button type="button" className="btn btn-ghost" onClick={() => setRemoveImage(false)}>Pertahankan gambar</button>
          )}
          <div className="row">
            <button className="btn" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
            <button type="button" className="btn btn-ghost" onClick={cancelEditing} disabled={busy}>Batal</button>
          </div>
        </form>
      ) : (
        <>
          {post.content && <p className="post-text">{post.content}</p>}
          {post.image && (
            <button
              type="button"
              className="post-image-trigger"
              /* Callback ini membuka gambar postingan pada viewer. */
              onClick={() => openImage(post.image, 'Lampiran status')}
              aria-label="Perbesar foto postingan"
            >
              <img className="post-image" src={post.image} alt="Lampiran status" />
            </button>
          )}
        </>
      )}

      <div className="post-actions">
  <button className={`like ${post.liked ? 'liked' : ''}`} onClick={like} aria-pressed={post.liked}>
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.3C1 8.4 2.9 5 6.2 5c2 0 3.2 1 3.8 2 .6-1 1.8-2 3.8-2 3.3 0 5.2 3.400 3.800 6.700C19.500 16.400 12 21 12 21z" fill={post.liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
    {post.like_count} suka
  </button>

  {/* Mengganti teks komentar menjadi ikon dengan angka jumlah komentarnya */}
  <span className="comment-count-badge" title={`${post.comments.reduce((count, item) => count + 1 + (item.replies?.length || 0), 0)} komentar`}>
    <i className="bi bi-chat"></i> {post.comments.reduce((count, item) => count + 1 + (item.replies?.length || 0), 0)}
  </span>
</div>

      <ul className="comments">
        {/* Callback map merender satu elemen daftar untuk setiap komentar. */}
        {post.comments.map((c) => (
          <li key={c.id} className="comment">
            <Link to={`/profile/${c.author.id}`} aria-label={`Buka profil ${c.author.name}`}>
              <Avatar user={c.author} size={32} />
            </Link>
            <div className="bubble">
              <div className="comment-head">
                <Link className="profile-name-link" to={`/profile/${c.author.id}`}>
                  <strong>{c.author.name}</strong>
                </Link>
                <time>{formatTime(c.created_at)}</time>
                {c.is_owner && editingCommentId !== c.id && (
                  <div className="comment-actions">
                    {/* Menu tiga titik untuk mengelola komentar delete dan edit */}
                    <MeatballsMenu
                      label="komentar"
                      onEdit={() => startEditingComment(c)}
                      onDelete={() => deleteComment(c)}
                      disabled={commentBusy}
                    />
                  </div>
                )}
              </div>
              <div className="comment-location-line">
                <LocationLink latitude={c.latitude} longitude={c.longitude} locationName={c.location_name} />
              </div>
              <div className="comment-content-row">
                <div className="comment-body">
                  {editingCommentId === c.id ? (
                    <form
                      className="comment-edit-form"
                      /* Meneruskan submit form beserta komentar yang sedang diedit. */
                      onSubmit={(e) => saveCommentEdit(e, c)}
                    >
                      <textarea
                        value={editCommentContent}
                        /* Memperbarui teks komentar yang sedang diedit. */
                        onChange={(e) => setEditCommentContent(e.target.value)}
                        placeholder="Tulis komentar…"
                        rows={2}
                        maxLength={1000}
                      />
                      <ImageInput
                        value={editCommentImg}
                        /* Menyimpan pilihan gambar pengganti komentar. */
                        onChange={(value) => { setEditCommentImg(value); setRemoveCommentImage(false); }}
                        label="Ganti gambar (opsional)"
                        current={removeCommentImage ? null : c.image}
                      />
                      {c.image && !removeCommentImage && (
                        <button
                          type="button"
                          className="btn btn-ghost danger"
                          /* Menandai gambar komentar lama untuk dihapus. */
                          onClick={() => { setRemoveCommentImage(true); setEditCommentImg(emptyImage); }}
                        >
                          Hapus gambar
                        </button>
                      )}
                      {removeCommentImage && (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          /* Membatalkan penghapusan gambar komentar. */
                          onClick={() => setRemoveCommentImage(false)}
                        >
                          Pertahankan gambar
                        </button>
                      )}
                      <div className="row">
                        <button className="btn" disabled={commentBusy}>{commentBusy ? 'Menyimpan…' : 'Simpan'}</button>
                        <button type="button" className="btn btn-ghost" onClick={cancelEditingComment} disabled={commentBusy}>Batal</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {c.comment && <p>{c.comment}</p>}
                      {c.image && (
                        <button
                          type="button"
                          className="comment-image-trigger"
                          /* Membuka lampiran komentar di viewer gambar. */
                          onClick={() => openImage(c.image, 'Lampiran komentar')}
                          aria-label="Perbesar foto komentar"
                        >
                          <img className="comment-image" src={c.image} alt="Lampiran komentar" />
                        </button>
                      )}
                      {editingCommentId !== c.id && (
                        <button
                          type="button"
                          className="btn btn-ghost comment-reply-button"
                          onClick={() => {
                            setReplyingToId((current) => current === c.id ? null : c.id);
                            setReplyText('');
                          }}
                        >
                          Balas
                        </button>
                      )}
                    </>
                  )}
                </div>
                <button
                  type="button"
                  className={`like comment-like ${c.liked ? 'liked' : ''}`}
                  onClick={() => toggleCommentLike(c)}
                  disabled={likingCommentIds.includes(c.id)}
                  aria-pressed={c.liked}
                  aria-label={c.liked ? 'Batal suka komentar' : 'Suka komentar'}
                >
                  <i className={c.liked ? 'bi bi-heart-fill' : 'bi bi-heart'} aria-hidden="true"></i>
                  {c.like_count || 0} suka
                </button>
              </div>
            </div>
            {c.replies?.length > 0 && (
              <ul className="comment-replies">
                {c.replies.map((reply) => (
                  <li key={reply.id} className="comment comment-reply">
                    <Link to={`/profile/${reply.author.id}`} aria-label={`Buka profil ${reply.author.name}`}>
                      <Avatar user={reply.author} size={28} />
                    </Link>
                    <div className="bubble">
                      <div className="comment-head">
                        <Link className="profile-name-link" to={`/profile/${reply.author.id}`}>
                          <strong>{reply.author.name}</strong>
                        </Link>
                        <time>{formatTime(reply.created_at)}</time>
                        {reply.is_owner && editingCommentId !== reply.id && (
                          <div className="comment-actions">
                            <MeatballsMenu
                              label="balasan"
                              onEdit={() => startEditingComment(reply)}
                              onDelete={() => deleteComment(reply)}
                              disabled={commentBusy}
                            />
                          </div>
                        )}
                      </div>
                      <div className="comment-location-line">
                        <LocationLink latitude={reply.latitude} longitude={reply.longitude} locationName={reply.location_name} />
                      </div>
                      <div className="comment-content-row">
                        <div className="comment-body">
                          {editingCommentId === reply.id ? (
                            <form className="comment-edit-form" onSubmit={(e) => saveCommentEdit(e, reply)}>
                              <textarea value={editCommentContent} onChange={(e) => setEditCommentContent(e.target.value)} placeholder="Tulis balasan…" rows={2} maxLength={1000} />
                              <ImageInput
                                value={editCommentImg}
                                onChange={(value) => { setEditCommentImg(value); setRemoveCommentImage(false); }}
                                label="Ganti gambar (opsional)"
                                current={removeCommentImage ? null : reply.image}
                              />
                              {reply.image && !removeCommentImage && (
                                <button type="button" className="btn btn-ghost danger" onClick={() => { setRemoveCommentImage(true); setEditCommentImg(emptyImage); }}>
                                  Hapus gambar
                                </button>
                              )}
                              {removeCommentImage && (
                                <button type="button" className="btn btn-ghost" onClick={() => setRemoveCommentImage(false)}>
                                  Pertahankan gambar
                                </button>
                              )}
                              <div className="row">
                                <button className="btn" disabled={commentBusy}>{commentBusy ? 'Menyimpan…' : 'Simpan'}</button>
                                <button type="button" className="btn btn-ghost" onClick={cancelEditingComment} disabled={commentBusy}>Batal</button>
                              </div>
                            </form>
                          ) : (
                            <>
                              {reply.comment && <p>{reply.comment}</p>}
                              {reply.image && (
                                <button type="button" className="comment-image-trigger" onClick={() => openImage(reply.image, 'Lampiran balasan')} aria-label="Perbesar foto balasan">
                                  <img className="comment-image" src={reply.image} alt="Lampiran balasan" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                        <button
                          type="button"
                          className={`like comment-like ${reply.liked ? 'liked' : ''}`}
                          onClick={() => toggleCommentLike(reply)}
                          disabled={likingCommentIds.includes(reply.id)}
                          aria-pressed={reply.liked}
                          aria-label={reply.liked ? 'Batal suka balasan' : 'Suka balasan'}
                        >
                          <i className={reply.liked ? 'bi bi-heart-fill' : 'bi bi-heart'} aria-hidden="true"></i>
                          {reply.like_count || 0} suka
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {replyingToId === c.id && (
              <form className="comment-reply-form" onSubmit={(e) => sendReply(e, c)}>
                <p className="location-note"><i className="bi bi-geo-alt" aria-hidden="true"></i> Lokasi terkini akan disertakan.</p>
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Balas ${c.author.name}…`}
                  maxLength={1000}
                  aria-label={`Balas komentar ${c.author.name}`}
                />
                <div className="row">
                  <button className="btn" disabled={commentBusy || !replyText.trim()}>{commentBusy ? 'Mengirim…' : 'Kirim balasan'}</button>
                  <button type="button" className="btn btn-ghost" onClick={() => { setReplyingToId(null); setReplyText(''); }} disabled={commentBusy}>Batal</button>
                </div>
              </form>
            )}
          </li>
        ))}
      </ul>

      <form className="comment-form" onSubmit={send}>
        <p className="location-note"><i className="bi bi-geo-alt" aria-hidden="true"></i> Lokasi terkini akan disertakan.</p>
        <div className="row">
          <input
            value={text}
            /* Memperbarui teks komentar baru ketika pengguna mengetik. */
            onChange={(e) => setText(e.target.value)}
            placeholder="Tulis komentar…"
            maxLength={1000}
          />
          {/* Tombol untuk menambahkan lampiran gambar */}
          <button
            type="button"
            className="btn btn-ghost btn-icon comment-attachment-button"
            /* Menampilkan atau menyembunyikan input lampiran gambar. */
            onClick={() => setShowAttach((v) => !v)}
            aria-label={showAttach ? 'Tutup lampiran gambar' : 'Tambah gambar'}
            title={showAttach ? 'Tutup lampiran gambar' : 'Tambah gambar'}
            aria-expanded={showAttach}
          >
            {/* Tombol untuk menambahkan lampiran gambar */}
            <i className="bi bi-image" aria-hidden="true"></i>
            <i className="bi bi-plus-lg comment-attachment-plus" aria-hidden="true"></i>
          </button>

          
          {/* Tombol untuk mengirim komentar */}
          <button
            className="btn btn-icon comment-send-button"
            disabled={busy || (!text.trim() && !img.file && !img.url.trim())}
            aria-label="Kirim komentar"
            title="Kirim komentar"
          >
            {/* Tombol untuk mengirim komentar */}
            <i className="bi bi-send" aria-hidden="true"></i>
          </button>
        </div>
        {showAttach && (
          /* Meneruskan perubahan gambar lampiran komentar ke state. */
          <ImageInput value={img} onChange={setImg} label="Lampiran komentar" />
        )}
      </form>
      {error && <p className="field-error">{error}</p>}

      {viewingImage && (
        <div
          className="post-image-viewer"
          role="dialog"
          aria-modal="true"
          aria-label="Tampilan foto"
          /* Menutup viewer ketika area latar belakang diklik. */
          onClick={() => setViewingImage(null)}
        >
          <div
            className="post-image-viewer-controls"
            /* Mencegah klik kontrol diteruskan ke latar viewer. */
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              /* Mengurangi zoom tanpa mengecilkan gambar di bawah ukuran normal. */
              onClick={() => setImageZoom((zoom) => Math.max(1, zoom - 0.25))}
              disabled={imageZoom <= 1}
              aria-label="Perkecil foto"
              title="Perkecil"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
            </button>
            <span>{Math.round(imageZoom * 100)}%</span>
            <button
              type="button"
              /* Menambah zoom hingga batas maksimal viewer. */
              onClick={() => setImageZoom((zoom) => Math.min(3, zoom + 0.25))}
              disabled={imageZoom >= 3}
              aria-label="Perbesar foto"
              title="Perbesar"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
            </button>
            <button
              type="button"
              /* Mengembalikan zoom ke ukuran normal. */
              onClick={() => setImageZoom(1)}
              disabled={imageZoom === 1}
              aria-label="Atur ulang zoom"
              title="Atur ulang"
            >
              1:1
            </button>
            <button
              type="button"
              /* Menutup viewer melalui tombol kontrol. */
              onClick={() => setViewingImage(null)}
              aria-label="Tutup foto"
              title="Tutup"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
            </button>
          </div>
          <div
            className="post-image-viewer-content"
            /* Mencegah klik gambar diteruskan ke latar viewer. */
            onClick={(event) => event.stopPropagation()}
          >
            <img
              className="post-image-viewer-image"
              src={viewingImage.src}
              alt={viewingImage.alt}
              style={{ transform: `scale(${imageZoom})` }}
            />
          </div>
        </div>
      )}
    </article>
  );
}
