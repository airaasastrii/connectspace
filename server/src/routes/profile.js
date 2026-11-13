import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { upload, pickImage, removeLocal, httpError } from '../helpers.js';
import { validate, profileSchema, passwordSchema } from '../validators.js';
import { getUser, publicSelect } from './auth.js';

const router = Router();

// Ubah nama, bio, dan foto profil (upload file ATAU URL)
router.put('/', upload.single('avatar'), validate(profileSchema), async (req, res) => {
  const uid = req.session.userId;
  const { name, bio } = req.body;
  const newAvatar = pickImage(req, 'avatar_url');
  const current = await getUser(uid);

  const user = await prisma.user.update({
    where: { id: uid },
    data: { name, bio: bio || null, avatar: newAvatar ?? current.avatar }, // kosong = pertahankan foto lama
    select: publicSelect,
  });
  if (newAvatar && newAvatar !== current.avatar) removeLocal(current.avatar);
  res.json({ user });
});

// Ubah password: wajib verifikasi password lama
router.put('/password', validate(passwordSchema), async (req, res) => {
  const { old_password, new_password } = req.body;
  const me = await prisma.user.findUnique({ where: { id: req.session.userId }, select: { password: true } });
  if (!(await bcrypt.compare(old_password, me.password))) throw httpError(400, 'Password lama salah.');

  await prisma.user.update({ where: { id: req.session.userId }, data: { password: await bcrypt.hash(new_password, 10) } });
  res.json({ message: 'Password berhasil diubah.' });
});

export default router;
