import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Feed from './pages/Feed.jsx';
import Profile from './pages/Profile.jsx';
import UserProfile from './pages/UserProfile.jsx';

// buat pengecekan apakah user sudah login atau belum, kalo belum login -> kembali ke Login dengan peringatan
// Melindungi halaman privat dan menampilkan navigasi setelah autentikasi selesai.
function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace state={{ warning: 'Silakan login terlebih dahulu untuk membuka halaman ini.' }} />;
  return (
    <>
      <Navbar />
      <main className="container">{children}</main>
    </>
  );
}

// Sudah login -> dilarang membuka Login/Register
// Membatasi halaman tamu agar pengguna yang sudah masuk diarahkan ke beranda.
function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

// Mendaftarkan rute aplikasi dengan penjaga akses yang sesuai.
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
      <Route path="/" element={<Protected><Feed /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
      <Route path="/profile/:id" element={<Protected><UserProfile /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
