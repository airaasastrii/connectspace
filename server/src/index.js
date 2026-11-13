import 'dotenv/config';
import fs from 'node:fs';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import multer from 'multer';
import { uploadDir } from './helpers.js';
import { requireAuth } from './middleware.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import postRoutes from './routes/posts.js';

fs.mkdirSync(uploadDir, { recursive: true });
const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 },
  })
);

app.use('/uploads', express.static(uploadDir, { setHeaders: (r) => r.setHeader('X-Content-Type-Options', 'nosniff') }));
app.use('/api/auth', authRoutes);
app.use('/api/profile', requireAuth, profileRoutes); // Auth Guard
app.use('/api/posts', requireAuth, postRoutes);      // Auth Guard

app.use((_req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan.' }));
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Ukuran gambar maksimal 2 MB.' : 'Upload gagal.';
    return res.status(400).json({ message: msg });
  }
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ message: status === 500 ? 'Terjadi kesalahan pada server.' : err.message });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`API ConnectSpace berjalan di http://localhost:${port}`));
