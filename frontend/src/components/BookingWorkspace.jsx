import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  api, dateStr, fmtDT, hourLabel, isoLocal, money, ICON, TYPE_ICON, TYPE_NAME, TYPE_ORDER,
  recognizePlate,
} from '../api.js';
import SlotGrid, { Legend } from './SlotGrid.jsx';
import PaymentModal from './PaymentModal.jsx';

/** Shared booking screen. admin=false: driver flow (book, then pay). admin=true: book for others. */
export default function BookingWorkspace({ admin }) {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const now = new Date();
  const [lots, setLots] = useState([]);
  const [lotId, setLotId] = useState(params.get('lot') || '');
  const [date, setDate] = useState(dateStr(now));
  const [hour, setHour] = useState(Math.min(23, now.getHours() + (admin ? 0 : 1)));
  const [duration, setDuration] = useState(2);
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [vehicle, setVehicle] = useState('');
  const [vehicleImage, setVehicleImage] = useState(null);
  const [plateBusy, setPlateBusy] = useState(false);
  const [plateMessage, setPlateMessage] = useState('');
  const [floor, setFloor] = useState(1);
  const [prefType, setPrefType] = useState('ANY');   // the section being booked
  const [accOk, setAccOk] = useState(false);              // accessible-zone confirmation
  const [cust, setCust] = useState({ email: '', name: '', paid: true });
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [pay, setPay] = useState(null);

  const start = useMemo(() => {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d, hour, 0, 0);
  }, [date, hour]);
  const end = useMemo(() => new Date(start.getTime() + duration * 3600_000), [start, duration]);
  const qs = `start=${encodeURIComponent(isoLocal(start))}&end=${encodeURIComponent(isoLocal(end))}`;

  useEffect(() => {
    api('/lots').then((l) => {
      setLots(l);
      if (!lotId && l.length) setLotId(String(l[0].id));
    }).catch((e) => setErr(e.message));
  }, []); // eslint-disable-line

  const load = () => {
    if (!lotId) return;
    api(`/lots/${lotId}/availability?floor=${floor}&${qs}`).then((d) => {
      setData(d);
      setSelected((s) => (s && d.slots.find((x) => x.id === s.id && x.status === 'AVAILABLE')) || null);
    }).catch((e) => setErr(e.message));
  };
  useEffect(load, [lotId, floor, qs]); // eslint-disable-line

  const current = data?.slots.find((s) => s.id === selected?.id);
  const isToday = date === dateStr(new Date());

  // One entry per section: car, electric car, bike, electric bike, accessible zone
  const sections = useMemo(() => [{ type: 'ANY', total: (data?.slots || []).filter((s) => s.kind === 'SLOT').length, free: (data?.slots || []).filter((s) => s.kind === 'SLOT' && s.status === 'AVAILABLE').length }, ...TYPE_ORDER.map((t) => {
    const list = (data?.slots || []).filter((s) => s.kind === 'SLOT' && s.type === t);
    const free = list.filter((s) => s.status === 'AVAILABLE').length;
    return { type: t, total: list.length, free };
  })].filter((s) => s.type === 'ANY' || s.total > 0), [data]);

  useEffect(() => {
    if (sections.length && !sections.find((s) => s.type === prefType)) {
      setPrefType(sections[0].type);
    }
  }, [sections]); // eslint-disable-line

  useEffect(() => { setAccOk(false); }, [selected?.id]);

  const chooseSection = (t) => { setPrefType(t); setSelected(null); setMsg(''); setErr(''); };

  const suggest = async () => {
    setErr(''); setMsg('');
    try {
      const s = await api(`/lots/${lotId}/suggest?floor=${floor}&${qs}&type=${prefType}`);
      setSelected(data.slots.find((x) => x.id === s.id));
      setMsg(`Best pick: slot ${s.label} - closest to the entrance.`);
    } catch (ex) { setErr(ex.message); }
  };

  const confirm = async (e) => {
    e.preventDefault();
    if (!current) return setErr('Select a slot on the map first');
    if (['DISABLED','ELDERLY'].includes(current.type) && !accOk) {
      return setErr('Please confirm the eligibility declaration for this priority bay.');
    }
    setErr(''); setMsg(''); setBusy(true);
    try {
      const base = { slotId: current.id, start: isoLocal(start), end: isoLocal(end),
                     vehicleNumber: vehicle };
      if (admin) {
        await api('/admin/bookings', { method: 'POST', body: { ...base,
          userEmail: cust.email || null, customerName: cust.name || null, paid: cust.paid } });
        setMsg(`Booked slot ${current.label} successfully.`);
        setVehicle(''); setCust({ email: '', name: '', paid: true }); setSelected(null); load();
      } else {
        const b = await api('/bookings', { method: 'POST', body: base });
        if (Number(b.amount) === 0) { setMsg(`Booked ${current.label}; this visit is covered by your active subscription.`); setSelected(null); load(); }
        else setPay(b);
      }
    } catch (ex) { setErr(ex.message); load(); } finally { setBusy(false); }
  };

  const onPaid = async () => {
    await api(`/bookings/${pay.id}/pay`, { method: 'POST' });
    nav('/my-bookings');
  };

  const readPlate = async () => {
    if (!vehicleImage) return;
    setPlateBusy(true);
    setPlateMessage('Recognizing plate on this computer...');
    setErr('');
    try {
      const result = await recognizePlate(vehicleImage);
      setVehicle(result.plateNumber);
      const confidence = Math.round((result.confidence || 0) * 100);
      setPlateMessage(`Read ${result.plateNumber}${confidence ? ` (${confidence}% confidence)` : ''}. Please verify it before booking.`);
    } catch (ex) {
      setPlateMessage('');
      setErr(ex.message);
    } finally {
      setPlateBusy(false);
    }
  };

  const sizeText = !current ? '-'
    : (current.type === 'BIKE' || current.type === 'EV_BIKE') ? '1 x 1'
    : current.orientation === 'VERTICAL' ? '1 x 2 (vertical)' : '2 x 1 (horizontal)';

  return (
    <div className="book-layout">
      <section className="card">
        <div className="toolbar">
          <label>Parking lot
            <select value={lotId} onChange={(e) => { setLotId(e.target.value); setFloor(1); setSelected(null); }}>
              {lots.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </label>
          <label>Date
            <input type="date" value={date} min={dateStr(new Date())}
                   onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>Arrive at
            <select value={hour} onChange={(e) => setHour(Number(e.target.value))}>
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h} disabled={isToday && h < new Date().getHours()}>
                  {hourLabel(h)}
                </option>
              ))}
            </select>
          </label>
          <label>Duration
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6, 8, 10, 12, 24].map((h) => (
                <option key={h} value={h}>{h} hour{h > 1 ? 's' : ''}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="sections">
          {Array.from({ length: data?.lot.floors || 1 }, (_, i) => i + 1).map((f) => <button key={'floor'+f} type="button" className={'sec-chip' + (floor === f ? ' on' : '')} onClick={() => { setFloor(f); setSelected(null); }}>Floor {f}</button>)}
          {sections.map((s) => (
            <button key={s.type} type="button"
                    className={'sec-chip' + (prefType === s.type ? ' on' : '')
                      + (s.type === 'DISABLED' ? ' acc' : '')}
                    onClick={() => chooseSection(s.type)}>
              <span>{TYPE_ICON[s.type]}</span> {s.type === 'ANY' ? 'Any type' : TYPE_NAME[s.type]} <b>{s.free}/{s.total}</b>
            </button>
          ))}
        </div>

        <div className="suggest-bar">
          <span>Showing <b>{prefType === 'ANY' ? 'all bay types' : TYPE_NAME[prefType]}</b> bays on Floor {floor} for {fmtDT(start)} to {fmtDT(end)}</span>
          <span className="grow" />
          <button className="btn ghost sm" onClick={suggest} type="button">
            {ICON.spark} Suggest best spot
          </button>
        </div>

        {prefType === 'ELDERLY' && <div className="alert info">Elderly-friendly bays are priority bays for older drivers or passengers.</div>}
        {prefType === 'DISABLED' && (
          <div className="alert info">
            Accessible zone: these bays are reserved for drivers or passengers with a
            disability. A permit may be checked at the entrance.
          </div>
        )}

        {data ? (
          <div className="grid-scroll">
            <SlotGrid rows={data.lot.rows} cols={data.lot.cols} cells={data.slots}
                      activeType={prefType} selectedId={selected?.id}
                      onSelect={(c) => { setSelected(c); setMsg(''); }} />
          </div>
        ) : <div className="empty">Loading map...</div>}
        <Legend />
      </section>

      <aside className="card summary">
        <h3>Booking summary</h3>
        {data && <div className="muted">{data.lot.name}<br />{data.lot.address}</div>}
        <div className="receipt">
          <div><span>Floor / slot</span><b>{current ? `Floor ${floor} · ${current.label} ${TYPE_ICON[current.type]}` : '-'}</b></div>
          <div><span>Type</span><b>{current ? TYPE_NAME[current.type] : '-'}</b></div>
          <div><span>Bay dimensions (W × L)</span><b>{current ? `${current.bayWidthMeters} m × ${current.bayLengthMeters} m` : '-'}</b></div>
          <div><span>Bay area</span><b>{current ? `${current.bayAreaSqMeters} m²` : '-'}</b></div>
          <div><span>Time</span><b>{duration} hr{duration > 1 ? 's' : ''}</b></div>
          <div className="total"><span>Total</span><b>{current ? money(current.price) : '-'}</b></div>
        </div>
        {current && <p className="muted sm">{current.dimensionsNote}. Dimensions describe the marked bay footprint; aisles and maneuvering space are extra.</p>}
        <p className="muted sm">
          Billed hourly. Base rate {data ? money(data.lot.hourlyRate) : '-'}/hr: car x1,
          electric car x1.5, bike x0.5, electric bike x0.75, accessible x1, elderly x1.
        </p>

        <form onSubmit={confirm}>
          <label>Vehicle number
            <input required value={vehicle} placeholder="KA01AB1234"
                   onChange={(e) => setVehicle(e.target.value)} />
          </label>
          <div className="plate-recognition">
            <label>Or upload a clear photo of the vehicle
              <input type="file" accept="image/jpeg,image/png,image/webp"
                     onChange={(e) => { setVehicleImage(e.target.files?.[0] || null); setPlateMessage(''); }} />
            </label>
            <button className="btn ghost sm" type="button" disabled={!vehicleImage || plateBusy} onClick={readPlate}>
              {plateBusy ? 'Reading plate...' : 'Read number plate'}
            </button>
            <p className="muted sm">The local recognition service processes the image on this computer. Check the number before booking.</p>
            {plateMessage && <p className="muted sm" role="status">{plateMessage}</p>}
          </div>
          {['DISABLED','ELDERLY'].includes(current?.type) && (
            <label className="check">
              <input type="checkbox" checked={accOk} onChange={(e) => setAccOk(e.target.checked)} />
              I confirm this priority bay is appropriate for the driver or passenger.
            </label>
          )}
          {admin && (<>
            <div className="divider">Customer</div>
            <label>Registered user's email (optional)
              <input type="email" value={cust.email} placeholder="user@example.com"
                     onChange={(e) => setCust({ ...cust, email: e.target.value })} />
            </label>
            {!cust.email && (
              <label>Walk-in customer name
                <input value={cust.name} placeholder="Customer name"
                       onChange={(e) => setCust({ ...cust, name: e.target.value })} />
              </label>
            )}
            <label className="check">
              <input type="checkbox" checked={cust.paid}
                     onChange={(e) => setCust({ ...cust, paid: e.target.checked })} />
              Payment collected at counter
            </label>
          </>)}
          {err && <div className="alert error">{err}</div>}
          {msg && <div className="alert ok">{msg}</div>}
          <button className="btn primary block" disabled={busy || !current}>
            {busy ? 'Booking...' : admin ? 'Create booking' : 'Proceed to pay'}
          </button>
        </form>
      </aside>

      {pay && <PaymentModal booking={pay} onPay={onPaid} onClose={() => nav('/my-bookings')} />}
    </div>
  );
}
