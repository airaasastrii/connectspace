import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { httpError } from '../helpers.js';
import { requireGuest } from '../middleware.js';
import { validate, registerSchema, loginSchema } from '../validators.js';

const router = Router();

export const publicSelect = { id: true, name: true, email: true, avatar: true, bio: true };
// Mengambil data publik pengguna tanpa mengembalikan informasi sensitif.
export const getUser = (id) => prisma.user.findUnique({ where: { id }, select: publicSelect });

// Membuat sesi baru dan menyimpannya sebelum autentikasi dianggap berhasil.
const startSession = (req, id) =>
  new Promise((ok, fail) =>
    // Mengganti ID sesi untuk mencegah penggunaan ulang sesi sebelum login.
    req.session.regenerate((e) => {
      if (e) return fail(e);
      req.session.userId = id;
      // Menyimpan sesi baru ke session store.
      req.session.save((e2) => (e2 ? fail(e2) : ok()));
    })
  );

// 1. Registrasi + AUTO-LOGIN (sesi langsung dibuat, client diarahkan ke Beranda)
// Membuat akun baru, menangani duplikasi email, lalu langsung memulai sesi.
router.post('/register', requireGuest, validate(registerSchema), async (req, res) => {
  const { name, email, password } = req.body;
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) throw httpError(409, 'Email sudah terdaftar.');

  let user;
  try {
    user = await prisma.user.create({
      data: { name, email, password: await bcrypt.hash(password, 10) },
      select: publicSelect,
    });
  } catch (e) {
    if (e.code === 'P2002') throw httpError(409, 'Email sudah terdaftar.'); // unique violation
    throw e;
  }
  await startSession(req, user.id);
  res.status(201).json({ user });
});

// 2. Login (verifikasi hash bcrypt)
// Memverifikasi kredensial pengguna dan memulai sesi jika cocok.
router.post('/login', requireGuest, validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const found = await prisma.user.findUnique({ where: { email }, select: { id: true, password: true } });
  if (!found || !(await bcrypt.compare(password, found.password))) throw httpError(401, 'Email atau password salah.');

  await startSession(req, found.id);
  res.json({ user: await getUser(found.id) });
});

// Menghapus sesi aktif dan membersihkan cookie autentikasi.
router.post('/logout', (req, res) => {
  // Membersihkan cookie lalu mengirim konfirmasi setelah sesi dihancurkan.
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Berhasil logout.' });
  });
});

// Mengembalikan pengguna yang sedang login atau error jika sesi tidak valid.
router.get('/me', async (req, res) => {
  const user = req.session.userId ? await getUser(req.session.userId) : null;
  if (!user) throw httpError(401, 'Belum login.');
  res.json({ user });
});

export default router;
