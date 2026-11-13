import { httpError } from './helpers.js';

export const requireAuth = (req, _res, next) =>
  req.session.userId ? next() : next(httpError(401, 'Silakan login terlebih dahulu.'));

export const requireGuest = (req, _res, next) =>
  req.session.userId ? next(httpError(403, 'Anda sudah login.')) : next();
