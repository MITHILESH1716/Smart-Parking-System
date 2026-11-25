import { useEffect, useMemo, useState } from 'react';
import { api, fmtDT, money } from '../../api.js';

export default function AdminBookings() {
  const [list, setList] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('ALL');
  const [err, setErr] = useState('');
  const load = () => api('/admin/bookings').then(setList).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  const act = async (fn) => { try { await fn(); load(); } catch (e) { setErr(e.message); } };
  const cancel = (b) => confirm(`Cancel booking #${b.id}?`) && act(() => api('/bookings/' + b.id, { method: 'DELETE' }));
  const checkout = (b) => act(() => api(`/admin/bookings/${b.id}/complete`, { method: 'POST' }));
  const markPaid = (b) => act(() => api(`/bookings/${b.id}/pay`, { method: 'POST' }));

  const rows = useMemo(() => (list || []).filter((b) => {
    if (status !== 'ALL' && b.status !== status) return false;
    const t = (b.customerName + ' ' + (b.customerEmail || '') + ' ' + b.vehicleNumber + ' ' + b.slotLabel + ' ' + b.lotName).toLowerCase();
    return t.includes(q.toLowerCase());
  }), [list, q, status]);

  return (
    <>
      <div className="page-head"><div><h1>All bookings</h1><p className="muted">Search, check out, collect payment or cancel.</p></div></div>
      {err && <div className="alert error">{err}</div>}
      <div className="toolbar card">
        <label className="grow">Search<input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email, vehicle, slot…" /></label>
        <label>Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>#</th><th>Customer</th><th>Lot / Slot</th><th>Time</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td>{b.id}</td>
                <td>{b.customerName}{b.createdByAdmin && <span className="chip tiny">admin</span>}<div className="muted sm">{b.customerEmail || 'Walk-in'} · {b.vehicleNumber}</div></td>
                <td>{b.lotName} · <b>{b.slotLabel}</b></td>
                <td>{fmtDT(b.start)}<div className="muted sm">to {fmtDT(b.end)}</div></td>
                <td>{money(b.amount)}<div><span className={'chip ' + (b.paymentStatus === 'PAID' ? 'paid' : 'pending')}>{b.paymentStatus}</span></div></td>
                <td><span className={'chip ' + b.status.toLowerCase()}>{b.status}</span></td>
                <td className="actions">
                  {b.status === 'CONFIRMED' && <>
                    {b.paymentStatus === 'PENDING' && <button className="btn ghost sm" onClick={() => markPaid(b)}>Mark paid</button>}
                    <button className="btn ghost sm" onClick={() => checkout(b)}>Check-out</button>
                    <button className="btn ghost sm danger" onClick={() => cancel(b)}>Cancel</button>
                  </>}
                </td>
              </tr>
            ))}
            {list && rows.length === 0 && <tr><td colSpan="7" className="center muted">No bookings found</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
