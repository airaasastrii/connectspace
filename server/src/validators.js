import Joi from 'joi';
import { httpError, removeLocal } from './helpers.js';

const messages = {
  'any.required': '{#label} wajib diisi',
  'string.empty': '{#label} wajib diisi',
  'string.base': '{#label} tidak valid',
  'string.min': '{#label} minimal {#limit} karakter',
  'string.max': '{#label} maksimal {#limit} karakter',
  'string.email': 'Format {#label} tidak valid',
  'string.uri': '{#label} tidak valid',
  'string.uriCustomScheme': '{#label} tidak valid',
  'any.only': '{#label} tidak cocok',
};

// Middleware: validasi req.body dengan Joi. Jika gagal, file yang sudah terunggah ikut dihapus.
// `has_file` memberi tahu schema apakah ada file upload (multer) pada request.
export const validate = (schema) => (req, _res, next) => {
  const { error, value } = schema.validate(
    { ...(req.body ?? {}), has_file: !!req.file },
    { abortEarly: true, stripUnknown: true, convert: true, messages }
  );
  if (error) {
    if (req.file) removeLocal('/uploads/' + req.file.filename);
    return next(httpError(400, error.details[0].message));
  }
  req.body = value;
  next();
};

const imageUrl = Joi.string().trim().uri({ scheme: ['http', 'https'] }).max(255).allow('').label('URL gambar');
const emailField = Joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(150).required().label('Email');

export const registerSchema = Joi.object({
  name: Joi.string().trim().max(100).required().label('Nama lengkap'),
  email: emailField,
  password: Joi.string().min(6).max(72).required().label('Password'),
  password_confirmation: Joi.any().valid(Joi.ref('password')).required().label('Konfirmasi password'),
});

export const loginSchema = Joi.object({
  email: emailField,
  password: Joi.string().required().label('Password'),
});

export const profileSchema = Joi.object({
  name: Joi.string().trim().max(100).required().label('Nama'),
  bio: Joi.string().trim().max(500).allow('').label('Bio'),
  avatar_url: imageUrl,
  has_file: Joi.boolean(),
});

export const passwordSchema = Joi.object({
  old_password: Joi.string().required().label('Password lama'),
  new_password: Joi.string().min(6).max(72).required().label('Password baru'),
  new_password_confirmation: Joi.any().valid(Joi.ref('new_password')).required().label('Konfirmasi password baru'),
});

const needTextOrImage = (msg, field) => (v, h) =>
  v[field] || v.image_url || v.has_file ? v : h.message(msg);

export const postSchema = Joi.object({
  content: Joi.string().trim().max(2000).allow('').label('Status'),
  image_url: imageUrl,
  has_file: Joi.boolean(),
}).custom(needTextOrImage('Status tidak boleh kosong: isi teks atau lampirkan gambar.', 'content'));

export const editPostSchema = Joi.object({
  content: Joi.string().trim().max(2000).allow('').label('Status'),
  image_url: imageUrl,
  keep_image: Joi.boolean(),
  has_file: Joi.boolean(),
});

export const commentSchema = Joi.object({
  comment: Joi.string().trim().max(1000).allow('').label('Komentar'),
  image_url: imageUrl,
  has_file: Joi.boolean(),
}).custom(needTextOrImage('Komentar tidak boleh kosong.', 'comment'));

export const editCommentSchema = Joi.object({
  comment: Joi.string().trim().max(1000).allow('').label('Komentar'),
  image_url: imageUrl,
  keep_image: Joi.boolean(),
  has_file: Joi.boolean(),
}).custom((v, h) =>
  v.comment || v.image_url || v.has_file || v.keep_image
    ? v
    : h.message('Komentar tidak boleh kosong.')
);
