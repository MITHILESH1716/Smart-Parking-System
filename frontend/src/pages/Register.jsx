import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

export default function Register() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (f.password !== f.confirm) return setErr('Passwords do not match');
    setErr(''); setBusy(true);
    try {
      const d = await api('/auth/register', { method: 'POST', auth: false, body: { name: f.name, email: f.email, password: f.password } });
      login(d); nav('/');
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="brand big"><span className="logo">P</span> SmartPark</div>
        <h1>Create your driver account</h1>
        <p>Book a spot in seconds, see live availability and keep all your parking receipts in one place.</p>
      </div>
      <form className="auth-card" onSubmit={submit}>
        <div className="role-badge">🚗 New driver</div>
        <h2>Sign up</h2>
        {err && <div className="alert error">{err}</div>}
        <label>Full name<input required value={f.name} onChange={set('name')} /></label>
        <label>Email<input type="email" required value={f.email} onChange={set('email')} /></label>
        <label>Password<input type="password" required minLength={6} value={f.password} onChange={set('password')} /></label>
        <label>Confirm password<input type="password" required value={f.confirm} onChange={set('confirm')} /></label>
        <button className="btn primary block" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        <div className="auth-links"><span>Already registered? <Link to="/login">Sign in</Link></span></div>
      </form>
    </div>
  );
}
