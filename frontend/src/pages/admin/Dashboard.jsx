import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtDT, money } from '../../api.js';

export default function Dashboard() {
  const [s, setS] = useState(null);
  const [recent, setRecent] = useState([]);
  const [err, setErr] = useState('');
  useEffect(() => {
    api('/admin/stats').then(setS).catch((e) => setErr(e.message));
    api('/admin/bookings').then((b) => setRecent(b.slice(0, 8))).catch(() => {});
  }, []);

  const stats = s && [
    ['🅿️', 'Parking lots', s.lots],
    ['🚗', 'Bookable slots', s.slots],
    ['⏱️', 'Occupied right now', s.activeNow],
    ['📅', "Today's bookings", s.bookingsToday],
    ['👥', 'Registered drivers', s.users],
    ['💰', 'Revenue collected', money(s.revenue)],
  ];

  return (
    <>
      <div className="page-head">
        <div><h1>Dashboard</h1><p className="muted">Live overview of your parking operation.</p></div>
        <div className="row-gap">
          <Link className="btn ghost" to="/admin/book">Book for a customer</Link>
          <Link className="btn primary" to="/admin/lots">Manage lots</Link>
        </div>
      </div>
      {err && <div className="alert error">{err}</div>}
      <div className="stats">
        {(stats || []).map(([i, l, v]) => (
          <div key={l} className="card stat"><span className="stat-ico">{i}</span><div><div className="stat-val">{v}</div><div className="muted">{l}</div></div></div>
        ))}
      </div>
      <h2 className="sec">Recent bookings</h2>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Customer</th><th>Lot / Slot</th><th>Time</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            {recent.map((b) => (
              <tr key={b.id}>
                <td>{b.customerName}{b.createdByAdmin && <span className="chip tiny">admin</span>}<div className="muted sm">{b.vehicleNumber}</div></td>
                <td>{b.lotName} · <b>{b.slotLabel}</b></td>
                <td>{fmtDT(b.start)} → {fmtDT(b.end)}</td>
                <td>{money(b.amount)}</td>
                <td><span className={'chip ' + b.status.toLowerCase()}>{b.status}</span></td>
              </tr>
            ))}
            {recent.length === 0 && <tr><td colSpan="5" className="center muted">No bookings yet</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
