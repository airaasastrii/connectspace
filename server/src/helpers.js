import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import Joi from 'joi';

export const uploadDir = path.resolve('uploads');
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp' };

export const httpError = (status, message) => Object.assign(new Error(message), { status });

// Upload aman: whitelist MIME, ekstensi ditentukan server, nama acak, maks 2 MB.
export const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => cb(null, crypto.randomUUID() + EXT[file.mimetype]),
  }),
  fileFilter: (_req, file, cb) =>
    EXT[file.mimetype] ? cb(null, true) : cb(httpError(400, 'Format gambar harus JPG, PNG, GIF, atau WEBP.')),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
});

export const removeLocal = (p) => {
  if (p && p.startsWith('/uploads/')) fs.unlink(path.join(uploadDir, path.basename(p))).catch(() => {});
};

// Gambar dari file upload ATAU URL (URL sudah divalidasi Joi). Kosong => null.
export const pickImage = (req, urlField = 'image_url') =>
  req.file ? '/uploads/' + req.file.filename : req.body?.[urlField] || null;

export const toId = (v) => {
  const { error, value } = Joi.number().integer().min(1).validate(v);
  if (error) throw httpError(400, 'ID tidak valid.');
  return value;
};
