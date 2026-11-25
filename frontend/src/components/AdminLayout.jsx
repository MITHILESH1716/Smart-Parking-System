import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../auth.jsx';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const links = [
    ['/admin', '📊', 'Dashboard', true],
    ['/admin/lots', '🅿️', 'Parking lots', false],
    ['/admin/book', '➕', 'Book for a customer', false],
    ['/admin/bookings', '📋', 'All bookings', false],
  ];
  return (
    <div className="shell-side admin-theme">
      <aside className={'sidebar' + (open ? ' open' : '')}>
        <div className="brand"><span className="logo">P</span> SmartPark <small>Admin</small></div>
        <nav onClick={() => setOpen(false)}>
          {links.map(([to, ic, label, end]) => (
            <NavLink key={to} to={to} end={end}><span>{ic}</span>{label}</NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <div className="who-name">{user.name}</div>
          <div className="muted sm">{user.email}</div>
          <button className="btn ghost sm" onClick={() => { logout(); nav('/admin/login'); }}>Logout</button>
        </div>
      </aside>
      <div className="side-main">
        <header className="mobile-bar">
          <button className="btn ghost sm" onClick={() => setOpen(!open)}>☰</button>
          <div className="brand"><span className="logo">P</span> SmartPark Admin</div>
        </header>
        <main className="container"><Outlet /></main>
      </div>
    </div>
  );
}
