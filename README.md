# ConnectSpace (UJK Junior Web Programmer)

Stack: React (Vite) + Node.js/Express + Prisma (ORM) + Joi (validasi) + MySQL.

## Menjalankan
1. Nyalakan MySQL (mis. XAMPP). Cek `DATABASE_URL` di `server/.env` (format: `mysql://USER:PASSWORD@localhost:3306/connectspace`).
2. Backend:  `cd server && npm install && npm run db:migrate && npm run db:seed && npm start`
   - `db:migrate` membuat database + 4 tabel dari `server/prisma/migrations/` (isi migrasi sama dengan `schema.prisma`)
   - `db:seed` mengisi data contoh: 4 user (budi/siti/andi/dewi `@connectspace.test`, password `password123`), 5 status, like, dan komentar
   - Mengulang dari nol: `npm run db:reset` (hapus semua data lalu migrasi + seed ulang)
   - Deploy/produksi: `npm run db:deploy` (hanya menerapkan migrasi)
3. Frontend: `cd client && npm install && npm run dev`  -> buka http://localhost:5173

## Lokasi pada status dan komentar
- Saat pengguna membuat status, komentar, atau balasan, aplikasi meminta lokasi browser dan memakai Nominatim untuk menampilkan nama wilayah. Lokasi dan koordinat disimpan bersama konten.
- Nominatim dipanggil hanya saat pengguna mengirim konten, dibatasi maksimal 1 permintaan per detik per backend, dan hasil lookup disimpan dalam cache sementara. Nama wilayah menaut ke peta dan mencantumkan atribusi OpenStreetMap.
- Endpoint dapat diganti tanpa perubahan kode melalui `NOMINATIM_BASE_URL` di `server/.env` (default: `https://nominatim.openstreetmap.org/reverse`). Ikuti [kebijakan penggunaan Nominatim](https://operations.osmfoundation.org/policies/nominatim/); untuk trafik tinggi atau layanan komersial, gunakan instance/provider yang sesuai.
- Setelah perubahan lokasi, hentikan backend lalu jalankan `npx prisma generate` dan `npm run db:deploy` dari folder `server`.

## Pemetaan ke rubrik
| Rubrik | Lokasi |
|---|---|
| 1. Struktur & relasi DB | `server/prisma/schema.prisma` (relasi FK onDelete Cascade, `@@unique([userId, postId])` pada likes) |
| 2. Registrasi & auto-login | `server/src/routes/auth.js` (/register), validasi `server/src/validators.js` + `client/src/pages/Register.jsx` |
| 3. Auth & route guard | `server/src/middleware.js`, `client/src/App.jsx` (Protected / GuestOnly), logout |
| 4. Profil & foto, ubah password | `server/src/routes/profile.js`, `client/src/pages/Profile.jsx` |
| 5. CRUD status & gambar | `server/src/routes/posts.js`, `client/src/pages/Feed.jsx` |
| 6. Toggle like & komentar gambar | `posts.js` (/:id/like, /:id/comments), `PostCard.jsx` |
| 7. Keamanan | Prisma (query berparameter), validasi input Joi, bcrypt, whitelist MIME + batas 2 MB, validasi URL |
