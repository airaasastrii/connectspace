import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PASSWORD = 'password123';
const img = (seed, w = 800, h = 500) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const ago = (hours) => new Date(Date.now() - hours * 3600 * 1000);

const USERS = [
  { name: 'Budi budi dam dam', email: 'budi@gmail.com', bio: 'Backend developer. Suka kopi dan kereta api.', avatar: img('budi', 200, 200) },
  { name: 'Siti siti dam dam', email: 'siti@gmail.com', bio: 'UI/UX designer di ConnectSpace.', avatar: img('siti', 200, 200) },
  { name: 'broOklyn', email: 'broklyn@gmail.com', bio: null, avatar: null }, // contoh tanpa avatar
  { name: 'lAnaDell', email: 'lana@gmail.com', bio: 'Product manager. Pecinta kucing.', avatar: img('dewi', 200, 200) },
];

// by = indeks USERS
const POSTS = [
  { by: 0, hours: 30, content: 'Halo semua! Ini status pertama saya di ConnectSpace.' },
  { by: 1, hours: 22, content: 'Moodboard untuk redesign dashboard minggu ini.', image: img('moodboard') },
  { by: 3, hours: 12, content: 'Ada yang mau ikut sarapan bareng besok pagi?' },
  { by: 2, hours: 5, image: img('sunrise') }, // hanya gambar
  { by: 0, hours: 2, content: 'Sprint review selesai, terima kasih tim!' },
];

const LIKES = [[1, 0], [2, 0], [3, 0], [0, 1], [2, 1], [0, 2], [1, 2], [3, 3], [1, 4]]; // [userIdx, postIdx]

const COMMENTS = [
  { post: 0, by: 1, hours: 29, text: 'Selamat datang, Budi!' },
  { post: 0, by: 3, hours: 28, text: 'Semoga betah di sini.' },
  { post: 1, by: 0, hours: 21, text: 'Warnanya bagus, suka sekali.' },
  { post: 1, by: 3, hours: 20, text: 'Ini referensi layout yang saya maksud:', image: img('layout', 600, 400) },
  { post: 2, by: 2, hours: 11, text: 'Saya ikut!' },
];

async function main() {
  // Hapus data seed lama saja (data pengguna asli tidak disentuh); like/post/komentar ikut terhapus via CASCADE
  await prisma.user.deleteMany({ where: { email: { in: USERS.map((u) => u.email) } } });

  const hash = await bcrypt.hash(PASSWORD, 10);
  const users = [];
  for (const u of USERS) users.push(await prisma.user.create({ data: { ...u, password: hash } }));

  const posts = [];
  for (const p of POSTS) {
    posts.push(
      await prisma.post.create({
        data: { userId: users[p.by].id, content: p.content ?? null, image: p.image ?? null, createdAt: ago(p.hours) },
      })
    );
  }

  await prisma.like.createMany({
    data: LIKES.map(([u, p]) => ({ userId: users[u].id, postId: posts[p].id })),
    skipDuplicates: true,
  });

  await prisma.comment.createMany({
    data: COMMENTS.map((c) => ({
      postId: posts[c.post].id, userId: users[c.by].id, comment: c.text, image: c.image ?? null, createdAt: ago(c.hours),
    })),
  });

  console.log(`Seed selesai: ${users.length} user, ${posts.length} post, ${LIKES.length} like, ${COMMENTS.length} komentar.`);
  console.log(`Login dengan salah satu email di bawah, password: ${PASSWORD}`);
  USERS.forEach((u) => console.log(`  - ${u.email}`));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
