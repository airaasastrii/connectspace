import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { httpError } from '../helpers.js';
import { requireGuest } from '../middleware.js';
import { validate, registerSchema, loginSchema } from '../validators.js';

const router = Router();

export const publicSelect = { id: true, name: true, email: true, avatar: true, bio: true };
export const getUser = (id) => prisma.user.findUnique({ where: { id }, select: publicSelect });

const startSession = (req, id) =>
  new Promise((ok, fail) =>
    req.session.regenerate((e) => {
      if (e) return fail(e);
      req.session.userId = id;
      req.session.save((e2) => (e2 ? fail(e2) : ok()));
    })
  );

// 1. Registrasi + AUTO-LOGIN (sesi langsung dibuat, client diarahkan ke Beranda)
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
router.post('/login', requireGuest, validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const found = await prisma.user.findUnique({ where: { email }, select: { id: true, password: true } });
  if (!found || !(await bcrypt.compare(password, found.password))) throw httpError(401, 'Email atau password salah.');

  await startSession(req, found.id);
  res.json({ user: await getUser(found.id) });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Berhasil logout.' });
  });
});

router.get('/me', async (req, res) => {
  const user = req.session.userId ? await getUser(req.session.userId) : null;
  if (!user) throw httpError(401, 'Belum login.');
  res.json({ user });
});

export default router;
