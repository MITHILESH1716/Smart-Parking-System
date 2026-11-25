import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../../api.js';

const empty = { name: '', address: '', rows: 6, cols: 10, hourlyRate: 40 };

export default function AdminLots() {
  const [lots, setLots] = useState([]);
  const [form, setForm] = useState(null); // null = closed, else lot form (with id when editing)
  const [err, setErr] = useState('');
  const load = () => api('/lots').then(setLots).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault(); setErr('');
    const body = { name: form.name, address: form.address, rows: Number(form.rows), cols: Number(form.cols), hourlyRate: Number(form.hourlyRate) };
    try {
      await api(form.id ? `/admin/lots/${form.id}` : '/admin/lots', { method: form.id ? 'PUT' : 'POST', body });
      setForm(null); load();
    } catch (ex) { setErr(ex.message); }
  };
  const del = async (l) => {
    if (!confirm(`Delete "${l.name}"? This cannot be undone.`)) return;
    try { await api('/admin/lots/' + l.id, { method: 'DELETE' }); load(); } catch (ex) { setErr(ex.message); }
  };

  return (
    <>
      <div className="page-head">
        <div><h1>Parking lots</h1><p className="muted">Create lots, then design the slot grid for each one.</p></div>
        <button className="btn primary" onClick={() => setForm({ ...empty })}>+ New lot</button>
      </div>
      {err && <div className="alert error">{err}</div>}
      <div className="cards">
        {lots.map((l) => (
          <div key={l.id} className="card lot-card">
            <h3>{l.name}</h3>
            <p className="muted">📍 {l.address || 'No address'}</p>
            <div className="lot-meta"><span><b>{l.rows}×{l.cols}</b> grid</span><span><b>{l.totalSlots}</b> slots</span><span><b>{money(l.hourlyRate)}</b>/hr</span></div>
            <Link className="btn primary block" to={`/admin/lots/${l.id}/design`}>🎨 Design grid</Link>
            <div className="row-gap">
              <button className="btn ghost sm grow" onClick={() => setForm({ ...l })}>Edit details</button>
              <button className="btn ghost sm danger" onClick={() => del(l)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {form && (
        <div className="modal-back" onClick={() => setForm(null)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <h3>{form.id ? 'Edit lot' : 'New parking lot'}</h3>
            <label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label>Address<input value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
            <div className="row2">
              <label>Rows (max 26)<input type="number" min="1" max="26" required value={form.rows} onChange={(e) => setForm({ ...form, rows: e.target.value })} /></label>
              <label>Columns (max 30)<input type="number" min="1" max="30" required value={form.cols} onChange={(e) => setForm({ ...form, cols: e.target.value })} /></label>
            </div>
            <label>Base hourly rate (₹)<input type="number" min="0" step="0.5" required value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} /></label>
            {err && <div className="alert error">{err}</div>}
            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn primary">Save</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
