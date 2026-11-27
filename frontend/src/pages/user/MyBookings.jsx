import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtDT, money, TYPE_ICON } from '../../api.js';
import PaymentModal from '../../components/PaymentModal.jsx';

export default function MyBookings() {
  const [list, setList] = useState(null);
  const [tab, setTab] = useState('upcoming');
  const [err, setErr] = useState('');
  const [pay, setPay] = useState(null);

  const load = () => api('/bookings/my').then(setList).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  const cancel = async (b) => {
    if (!confirm(`Cancel booking for slot ${b.slotLabel}?`)) return;
    try { await api('/bookings/' + b.id, { method: 'DELETE' }); load(); } catch (e) { setErr(e.message); }
  };

  const now = Date.now();
  const filtered = (list || []).filter((b) => {
    if (tab === 'cancelled') return b.status === 'CANCELLED';
    if (tab === 'past') return b.status === 'COMPLETED' || (b.status === 'CONFIRMED' && new Date(b.end) <= now);
    return b.status === 'CONFIRMED' && new Date(b.end) > now;
  });

  return (
    <>
      <div className="page-head">
        <div><h1>My bookings</h1><p className="muted">Your upcoming and past parking reservations.</p></div>
        <Link className="btn primary" to="/">+ New booking</Link>
      </div>
      <div className="tabs">
        {['upcoming', 'past', 'cancelled'].map((t) => (
          <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>
        ))}
      </div>
      {err && <div className="alert error">{err}</div>}
      {!list ? <div className="empty">Loading…</div> : filtered.length === 0 ? <div className="empty">Nothing here yet.</div> : (
        <div className="list">
          {filtered.map((b) => (
            <div key={b.id} className="card booking-row">
              <div className="slot-badge">{b.slotLabel}<small>{TYPE_ICON[b.slotType]}</small></div>
              <div className="grow">
                <h3>{b.lotName}</h3>
                <p className="muted">Floor {b.floor} · {b.bayWidthMeters} m × {b.bayLengthMeters} m bay · {fmtDT(b.start)} → {fmtDT(b.end)} · 🚘 {b.vehicleNumber}</p>
                <div className="chips">
                  <span className={'chip ' + b.status.toLowerCase()}>{b.status}</span>
                  <span className={'chip ' + (b.paymentStatus === 'PAID' ? 'paid' : 'pending')}>{b.paymentStatus === 'PAID' ? 'Paid' : 'Payment pending'}</span>
                </div>
              </div>
              <div className="right">
                <div className="price">{money(b.amount)}</div>
                {b.status === 'CONFIRMED' && b.paymentStatus === 'PENDING' && <button className="btn primary sm" onClick={() => setPay(b)}>Pay now</button>}
                {b.status === 'CONFIRMED' && new Date(b.start) > now && <button className="btn ghost sm danger" onClick={() => cancel(b)}>Cancel</button>}
              </div>
            </div>
          ))}
        </div>
      )}
      {pay && <PaymentModal booking={pay} onClose={() => setPay(null)}
        onPay={async () => { await api(`/bookings/${pay.id}/pay`, { method: 'POST' }); setPay(null); load(); }} />}
    </>
  );
}
