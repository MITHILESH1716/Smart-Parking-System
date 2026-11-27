import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function UserLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <div className="shell-top">
      <header className="topbar">
        <div className="brand"><span className="logo">P</span> SmartPark</div>
        <nav>
          <NavLink to="/" end>Find parking</NavLink>
          <NavLink to="/my-bookings">My bookings</NavLink>
          <NavLink to="/plans">Plans</NavLink>
        </nav>
        <div className="who">
          <span className="avatar">{user.name?.[0]?.toUpperCase()}</span>
          <span className="who-name">{user.name}</span>
          <button className="btn ghost sm" onClick={() => { logout(); nav('/login'); }}>Logout</button>
        </div>
      </header>
      <main className="container"><Outlet /></main>
    </div>
  );
}
