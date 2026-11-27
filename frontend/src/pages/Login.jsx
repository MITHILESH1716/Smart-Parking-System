import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import GoogleLoginButton from "../components/GoogleLoginButton";

export default function Login({ admin }) {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const d = await api(admin ? '/auth/admin/login' : '/auth/login', { method: 'POST', body: { email, password }, auth: false });
      login(d);
      nav(admin ? '/admin' : '/');
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };

  return (
    <div className={'auth-page' + (admin ? ' admin-theme' : '')}>
      <div className="auth-hero">
        <div className="brand big"><span className="logo">P</span> SmartPark</div>
        <h1>{admin ? 'Run your parking lots with confidence.' : 'Pick your spot. Park without the hunt.'}</h1>
        <p>{admin
          ? 'Design parking grids, manage bookings, book for walk-in customers and track revenue in real time.'
          : 'Choose the exact bay you want on a live map, book ahead for the hours you need and pay only for what you use.'}</p>
        <div className="mini-grid" aria-hidden>
          {Array.from({ length: 40 }).map((_, i) => (
            <span key={i} className={['a', 'a', 'b', 'a', 'a', 'x', 'a', 'b'][(i * 7 + (i % 5)) % 8]} />
          ))}
        </div>
      </div>

      <form className="auth-card" onSubmit={submit}>
        <div className="role-badge">{admin ? '🛡️ Admin portal' : '🚗 Driver login'}</div>
        <h2>{admin ? 'Admin sign in' : 'Welcome back'}</h2>
        <p className="muted">{admin ? 'Authorised staff only.' : 'Sign in to book your parking spot.'}</p>

        {err && <div className="alert error">{err}</div>}

        <label>Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoFocus />
        </label>
        <label>Password
          <div className="pw">
            <input type={show ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            <button type="button" className="link" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button>
          </div>
        </label>
          {!admin && (
            <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
              <GoogleLoginButton />
            </div>
          )}
        <button className="btn primary block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>

        <div className="auth-links">
          {admin ? <Link to="/login">← Driver login</Link> : (<>
            <span>New here? <Link to="/register">Create an account</Link></span>
            <Link to="/admin/login">Admin login →</Link>
          </>)}
        </div>
        <p className="demo-hint">
          Demo: {admin ? 'admin@smartpark.com / Admin@123' : 'user@smartpark.com / User@123'}
        </p>
      </form>
    </div>
  );
}
