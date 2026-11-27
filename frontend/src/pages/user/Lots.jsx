import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../../api.js';

export default function Lots() {
  const [lots, setLots] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api('/lots').then(setLots).catch((e) => setErr(e.message)); }, []);

  return (
    <>
      <div className="page-head">
        <div><h1>Find parking</h1><p className="muted">Pick a lot, choose your exact slot on the map and book ahead.</p></div>
      </div>
      {err && <div className="alert error">{err}</div>}
      {!lots ? <div className="empty">Loading…</div> : lots.length === 0 ? <div className="empty">No parking lots yet.</div> : (
        <div className="cards">
          {lots.map((l) => (
            <div key={l.id} className="card lot-card">
              <div className="lot-ico">🅿️</div>
              <h3>{l.name}</h3>
              <p className="muted">📍 {l.address || 'Address not set'}</p>
              <div className="lot-meta">
                <span><b>{l.totalSlots}</b> slots</span>
                <span><b>{money(l.hourlyRate)}</b> / hour</span>
              </div>
              <Link className="btn primary block" to={`/book?lot=${l.id}`}>Select a spot →</Link>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
