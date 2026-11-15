import { httpError } from './helpers.js';

// Mengizinkan request hanya jika sesi memiliki pengguna terautentikasi.
export const requireAuth = (req, _res, next) =>
  req.session.userId ? next() : next(httpError(401, 'Silakan login terlebih dahulu.'));

// Membatasi endpoint tamu untuk pengguna yang belum memiliki sesi login.
export const requireGuest = (req, _res, next) =>
  req.session.userId ? next(httpError(403, 'Anda sudah login.')) : next();
