import { useEffect, useState } from 'react';
import { api, toForm } from '../api.js';
import Avatar, { formatTime } from './Avatar.jsx';
import ImageInput, { emptyImage } from './ImageInput.jsx';

export default function PostCard({ post, onChange, onDelete }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [img, setImg] = useState(emptyImage);
  const [showAttach, setShowAttach] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [removeImage, setRemoveImage] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [editCommentImg, setEditCommentImg] = useState(emptyImage);
  const [removeCommentImage, setRemoveCommentImage] = useState(false);
  const [commentBusy, setCommentBusy] = useState(false);

  useEffect(() => {
    if (!viewingImage) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setViewingImage(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingImage]);

  const openImage = (src, alt) => {
    setImageZoom(1);
    setViewingImage({ src, alt });
  };

  const like = async () => {
    setError('');
    try {
      const r = await api.toggleLike(post.id);
      onChange({ ...post, liked: r.liked, like_count: r.like_count });
    } catch (e) { setError(e.message); }
  };

  const remove = async () => {
    if (!window.confirm('Hapus postingan ini?')) return;
    try {
      await api.deletePost(post.id);
      onDelete(post.id);
    } catch (e) { setError(e.message); }
  };

  const startEditing = () => {
    setEditContent(post.content || '');
    setImg(emptyImage);
    setRemoveImage(false);
    setError('');
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setImg(emptyImage);
    setRemoveImage(false);
    setError('');
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { post: updatedPost } = await api.updatePost(post.id, toForm({
        content: editContent,
        image: img.file,
        image_url: img.url,
        keep_image: post.image && !removeImage,
      }));
      onChange(updatedPost);
      setEditing(false);
      setImg(emptyImage);
      setRemoveImage(false);
    } catch (e2) { setError(e2.message); }
    setBusy(false);
  };

  const send = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await api.addComment(post.id, toForm({ comment: text, image: img.file, image_url: img.url }));
      onChange({ ...post, comments: [...post.comments, r.comment] });
      setText('');
      setImg(emptyImage);
      setShowAttach(false);
    } catch (e2) { setError(e2.message); }
    setBusy(false);
  };

  const startEditingComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditCommentContent(comment.comment || '');
    setEditCommentImg(emptyImage);
    setRemoveCommentImage(false);
    setError('');
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditCommentContent('');
    setEditCommentImg(emptyImage);
    setRemoveCommentImage(false);
    setError('');
  };

  const saveCommentEdit = async (e, comment) => {
    e.preventDefault();
    setCommentBusy(true);
    setError('');
    try {
      const { comment: updatedComment } = await api.updateComment(
        post.id,
        comment.id,
        toForm({
          comment: editCommentContent,
          image: editCommentImg.file,
          image_url: editCommentImg.url,
          keep_image: comment.image && !removeCommentImage,
        })
      );
      onChange({
        ...post,
        comments: post.comments.map((item) => item.id === comment.id ? updatedComment : item),
      });
      cancelEditingComment();
    } catch (e) { setError(e.message); }
    setCommentBusy(false);
  };

  const deleteComment = async (comment) => {
    if (!window.confirm('Hapus komentar ini?')) return;
    setCommentBusy(true);
    setError('');
    try {
      await api.deleteComment(post.id, comment.id);
      onChange({ ...post, comments: post.comments.filter((item) => item.id !== comment.id) });
      if (editingCommentId === comment.id) cancelEditingComment();
    } catch (e) { setError(e.message); }
    setCommentBusy(false);
  };

  return (
    <article className="card post">
      <header className="post-head">
        <Avatar user={post.author} size={44} />
        <div className="post-meta">
          <strong>{post.author.name}</strong>
          <time>{formatTime(post.created_at)}</time>
        </div>
        {post.is_owner && !editing && (
          <div className="row">
            <button type="button" className="btn btn-ghost btn-icon" onClick={startEditing}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></svg>
            </button>
            <button type="button" className="btn btn-ghost danger btn-icon" onClick={remove}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 14H6L5 6" /><path d="M10 11v5M14 11v5" /></svg>
            </button>
          </div>
        )}
      </header>

      {editing ? (
        <form className="post-edit-form" onSubmit={saveEdit}>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Tulis status…"
            rows={3}
            maxLength={2000}
          />
          <ImageInput
            value={img}
            onChange={(value) => { setImg(value); setRemoveImage(false); }}
            label="Ganti gambar (opsional)"
            current={removeImage ? null : post.image}
          />
          {post.image && !removeImage && (
            <button type="button" className="btn btn-ghost danger btn-icon" onClick={() => { setRemoveImage(true); setImg(emptyImage); }}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 14H6L5 6" /><path d="M10 11v5M14 11v5" /></svg>
              Hapus gambar
            </button>
          )}
          {removeImage && <button type="button" className="btn btn-ghost" onClick={() => setRemoveImage(false)}>Pertahankan gambar</button>}
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
        <span className="muted">{post.comments.length} komentar</span>
      </div>

      <ul className="comments">
        {post.comments.map((c) => (
          <li key={c.id} className="comment">
            <Avatar user={c.author} size={32} />
            <div className="bubble">
              <div className="comment-head">
                <strong>{c.author.name}</strong>
                <time>{formatTime(c.created_at)}</time>
                {c.is_owner && editingCommentId !== c.id && (
                  <div className="comment-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon"
                      onClick={() => startEditingComment(c)}
                      aria-label="Edit komentar"
                      title="Edit komentar"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></svg>
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost danger btn-icon"
                      onClick={() => deleteComment(c)}
                      disabled={commentBusy}
                      aria-label="Hapus komentar"
                      title="Hapus komentar"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 14H6L5 6" /><path d="M10 11v5M14 11v5" /></svg>
                    </button>
                  </div>
                )}
              </div>
              {editingCommentId === c.id ? (
                <form className="comment-edit-form" onSubmit={(e) => saveCommentEdit(e, c)}>
                  <textarea
                    value={editCommentContent}
                    onChange={(e) => setEditCommentContent(e.target.value)}
                    placeholder="Tulis komentar…"
                    rows={2}
                    maxLength={1000}
                  />
                  <ImageInput
                    value={editCommentImg}
                    onChange={(value) => { setEditCommentImg(value); setRemoveCommentImage(false); }}
                    label="Ganti gambar (opsional)"
                    current={removeCommentImage ? null : c.image}
                  />
                  {c.image && !removeCommentImage && (
                    <button
                      type="button"
                      className="btn btn-ghost danger"
                      onClick={() => { setRemoveCommentImage(true); setEditCommentImg(emptyImage); }}
                    >
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
                  {c.comment && <p>{c.comment}</p>}
                  {c.image && (
                    <button
                      type="button"
                      className="comment-image-trigger"
                      onClick={() => openImage(c.image, 'Lampiran komentar')}
                      aria-label="Perbesar foto komentar"
                    >
                      <img className="comment-image" src={c.image} alt="Lampiran komentar" />
                    </button>
                  )}
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      <form className="comment-form" onSubmit={send}>
        <div className="row">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Tulis komentar…" maxLength={1000} />
          <button type="button" className="btn btn-ghost" onClick={() => setShowAttach((v) => !v)}>Gambar</button>
          <button className="btn" disabled={busy || (!text.trim() && !img.file && !img.url.trim())}>Kirim</button>
        </div>
        {showAttach && <ImageInput value={img} onChange={setImg} label="Lampiran komentar" />}
      </form>
      {error && <p className="field-error">{error}</p>}

      {viewingImage && (
        <div
          className="post-image-viewer"
          role="dialog"
          aria-modal="true"
          aria-label="Tampilan foto"
          onClick={() => setViewingImage(null)}
        >
          <div className="post-image-viewer-controls" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
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
              onClick={() => setImageZoom((zoom) => Math.min(3, zoom + 0.25))}
              disabled={imageZoom >= 3}
              aria-label="Perbesar foto"
              title="Perbesar"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
            </button>
            <button
              type="button"
              onClick={() => setImageZoom(1)}
              disabled={imageZoom === 1}
              aria-label="Atur ulang zoom"
              title="Atur ulang"
            >
              1:1
            </button>
            <button
              type="button"
              onClick={() => setViewingImage(null)}
              aria-label="Tutup foto"
              title="Tutup"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
            </button>
          </div>
          <div className="post-image-viewer-content" onClick={(event) => event.stopPropagation()}>
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
