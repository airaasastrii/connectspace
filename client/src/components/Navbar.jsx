import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import Avatar from './Avatar.jsx';
import logoApp from '../assets/logo.png';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

return (
<header className="navbar">
  <div className="navbar-inner">
    {/* Kelompok Kiri: Brand + Menu Navigasi (Beranda & Profil) */}
    <div className="navbar-left-group">
      <NavLink to="/" className="brand">
      <img src={logoApp} alt="DailyoOoo" className="brand-logo" /> DailyoOoo
      </NavLink>
      
      <nav className="nav-links">
        {/* 1. ini cuma menampilkan kata BERANDA */}
        <NavLink to="/" end>Beranda</NavLink>
        <NavLink to="/profile">Profil</NavLink>
      
        {/* 2. ini cuma icon beranda dan profil nya*/}
        {/* <NavLink to="/" end >
        <i class="bi bi-house-fill"></i> 
        </NavLink>
        <NavLink to="/profile">
        <i class="bi bi-person-fill"></i>
        </NavLink> */}
      </nav>
    </div>
    
    {/* Kelompok Kanan: Profil User & Tombol Keluar (Icon SVG) */}
    <div className="nav-user">
      <Avatar user={user} size={34} />
      <span className="nav-name">{user.name}</span>
      <button className="logout-btn" onClick={onLogout} title="Keluar">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      </button>
    </div>
  </div>
</header>
  );
}
