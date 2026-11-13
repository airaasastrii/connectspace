import { Router } from 'express';
import { prisma } from '../prisma.js';
import { upload, pickImage, removeLocal, httpError, toId } from '../helpers.js';
import { validate, postSchema, editPostSchema, commentSchema, editCommentSchema } from '../validators.js';

const router = Router();
const authorSelect = { id: true, name: true, avatar: true };

const shapeComment = (c, me) => ({
  id: c.id, comment: c.comment, image: c.image, created_at: c.createdAt,
  author: c.user, is_owner: c.userId === me,
});

// Ambil post (semua / satu) + jumlah like, status like saya, dan komentarnya
async function fetchPosts(me, postId) {
  const posts = await prisma.post.findMany({
    where: postId ? { id: postId } : undefined,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], // terbaru di atas
    take: 100,
    include: {
      user: { select: authorSelect },
      _count: { select: { likes: true } },
      likes: { where: { userId: me }, select: { id: true } },
      comments: {
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        include: { user: { select: authorSelect } },
      },
    },
  });
  return posts.map((p) => ({
    id: p.id, content: p.content, image: p.image, created_at: p.createdAt,
    like_count: p._count.likes,
    liked: p.likes.length > 0,
    is_owner: p.userId === me, // hanya pemilik yang melihat tombol hapus
    author: p.user,
    comments: p.comments.map((comment) => shapeComment(comment, me)),
  }));
}

router.get('/', async (req, res) => {
  res.json({ posts: await fetchPosts(req.session.userId) });
});

// Buat status: teks dan/atau gambar (aturan "tidak boleh kosong" ada di postSchema)
router.post('/', upload.single('image'), validate(postSchema), async (req, res) => {
  const created = await prisma.post.create({
    data: { userId: req.session.userId, content: req.body.content || null, image: pickImage(req) },
  });
  const [post] = await fetchPosts(req.session.userId, created.id);
  res.status(201).json({ post });
});

// Ubah status dan/atau gambar: hanya pemilik yang dapat mengedit.
router.put('/:id', upload.single('image'), validate(editPostSchema), async (req, res) => {
  let saved = false;
  try {
    const id = toId(req.params.id);
    const userId = req.session.userId;
    const current = await prisma.post.findUnique({
      where: { id },
      select: { userId: true, image: true },
    });
    if (!current) throw httpError(404, 'Postingan tidak ditemukan.');
    if (current.userId !== userId) throw httpError(403, 'Anda tidak berhak mengedit postingan ini.');

    const image = pickImage(req) || (req.body.keep_image ? current.image : null);
    const content = req.body.content || null;
    if (!content && !image) throw httpError(400, 'Status tidak boleh kosong: isi teks atau lampirkan gambar.');

    const result = await prisma.post.updateMany({
      where: { id, userId },
      data: { content, image },
    });
    if (!result.count) throw httpError(404, 'Postingan tidak ditemukan.');

    saved = true;
    if (image !== current.image) removeLocal(current.image);
    const [post] = await fetchPosts(userId, id);
    res.json({ post });
  } catch (e) {
    if (!saved && req.file) removeLocal('/uploads/' + req.file.filename);
    throw e;
  }
});

// Hapus: hanya pemilik (dicek di server, bukan hanya disembunyikan di UI)
router.delete('/:id', async (req, res) => {
  const id = toId(req.params.id);
  const post = await prisma.post.findUnique({
    where: { id },
    select: { userId: true, image: true, comments: { select: { image: true } } },
  });
  if (!post) throw httpError(404, 'Postingan tidak ditemukan.');
  if (post.userId !== req.session.userId) throw httpError(403, 'Anda tidak berhak menghapus postingan ini.');

  await prisma.post.deleteMany({ where: { id, userId: req.session.userId } }); // cascade likes & comments
  removeLocal(post.image);
  post.comments.forEach((c) => removeLocal(c.image));
  res.json({ message: 'Postingan dihapus.' });
});

// Toggle like: 1 user = 1 like per post (didukung @@unique([userId, postId]))
router.post('/:id/like', async (req, res) => {
  const postId = toId(req.params.id);
  const userId = req.session.userId;
  if (!(await prisma.post.findUnique({ where: { id: postId }, select: { id: true } })))
    throw httpError(404, 'Postingan tidak ditemukan.');

  const { count } = await prisma.like.deleteMany({ where: { userId, postId } });
  const liked = count === 0; // tidak ada yang dihapus => sebelumnya belum like
  if (liked) await prisma.like.createMany({ data: [{ userId, postId }], skipDuplicates: true });

  res.json({ liked, like_count: await prisma.like.count({ where: { postId } }) });
});

// Komentar: teks dan/atau gambar
router.post('/:id/comments', upload.single('image'), validate(commentSchema), async (req, res) => {
  const image = pickImage(req);
  try {
    const postId = toId(req.params.id);
    if (!(await prisma.post.findUnique({ where: { id: postId }, select: { id: true } })))
      throw httpError(404, 'Postingan tidak ditemukan.');

    const c = await prisma.comment.create({
      data: { postId, userId: req.session.userId, comment: req.body.comment || null, image },
      include: { user: { select: authorSelect } },
    });
    res.status(201).json({ comment: shapeComment(c, req.session.userId) });
  } catch (e) {
    removeLocal(image);
    throw e;
  }
});

router.put('/:id/comments/:commentId', upload.single('image'), validate(editCommentSchema), async (req, res) => {
  let saved = false;
  try {
    const postId = toId(req.params.id);
    const id = toId(req.params.commentId);
    const userId = req.session.userId;
    const current = await prisma.comment.findUnique({
      where: { id },
      select: { postId: true, userId: true, image: true },
    });
    if (!current || current.postId !== postId) throw httpError(404, 'Komentar tidak ditemukan.');
    if (current.userId !== userId) throw httpError(403, 'Anda tidak berhak mengedit komentar ini.');

    const image = pickImage(req) || (req.body.keep_image ? current.image : null);
    const result = await prisma.comment.updateMany({
      where: { id, postId, userId },
      data: { comment: req.body.comment || null, image },
    });
    if (!result.count) throw httpError(404, 'Komentar tidak ditemukan.');

    saved = true;
    if (image !== current.image) removeLocal(current.image);
    const updatedComment = await prisma.comment.findUnique({
      where: { id },
      include: { user: { select: authorSelect } },
    });
    res.json({ comment: shapeComment(updatedComment, userId) });
  } catch (e) {
    if (!saved && req.file) removeLocal('/uploads/' + req.file.filename);
    throw e;
  }
});

router.delete('/:id/comments/:commentId', async (req, res) => {
  const postId = toId(req.params.id);
  const id = toId(req.params.commentId);
  const userId = req.session.userId;
  const current = await prisma.comment.findUnique({
    where: { id },
    select: { postId: true, userId: true, image: true },
  });
  if (!current || current.postId !== postId) throw httpError(404, 'Komentar tidak ditemukan.');
  if (current.userId !== userId) throw httpError(403, 'Anda tidak berhak menghapus komentar ini.');

  const result = await prisma.comment.deleteMany({ where: { id, postId, userId } });
  if (!result.count) throw httpError(404, 'Komentar tidak ditemukan.');
  removeLocal(current.image);
  res.json({ message: 'Komentar dihapus.' });
});

export default router;
