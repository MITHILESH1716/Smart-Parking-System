import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, money, ICON, TYPE_ICON, TYPE_NAME, TYPE_ORDER } from '../../api.js';
import SlotGrid, { Legend } from '../../components/SlotGrid.jsx';
import { defLabel, fillDefaults, normalize, paintCell, rotateCell } from '../../gridRules.js';

const TOOLS = [
  { id: 'STANDARD', label: 'Car', icon: ICON.car, kind: 'SLOT', type: 'STANDARD' },
  { id: 'EV_CAR', label: 'Electric car', icon: ICON.car + ICON.bolt, kind: 'SLOT', type: 'EV_CAR' },
  { id: 'BIKE', label: 'Bike', icon: ICON.bike, kind: 'SLOT', type: 'BIKE' },
  { id: 'EV_BIKE', label: 'Electric bike', icon: ICON.ebike + ICON.bolt, kind: 'SLOT', type: 'EV_BIKE' },
  { id: 'DISABLED', label: 'Accessible zone', icon: ICON.access, kind: 'SLOT', type: 'DISABLED' },
  { id: 'ELDERLY', label: 'Elderly-friendly', icon: TYPE_ICON.ELDERLY, kind: 'SLOT', type: 'ELDERLY' },
  { id: 'ROTATE', label: 'Rotate car bay', icon: ICON.rotate, kind: 'ROTATE', type: 'STANDARD' },
  { id: 'BLOCKED', label: 'Blocked', icon: ICON.blocked, kind: 'BLOCKED', type: 'STANDARD' },
  { id: 'AISLE', label: 'Road / empty', icon: ICON.road, kind: 'AISLE', type: 'STANDARD' },
];

const toMap = (slots) => {
  const m = {};
  slots.forEach((s) => {
    m[s.row + '-' + s.col] = {
      id: s.id, row: s.row, col: s.col, kind: s.kind, type: s.type,
      label: s.label, orientation: s.orientation || 'HORIZONTAL',
    };
  });
  return m;
};

const asMap = (list) => {
  const m = {};
  list.forEach((c) => { m[c.row + '-' + c.col] = c; });
  return m;
};

export default function GridDesigner() {
  const { id } = useParams();
  const [lot, setLot] = useState(null);           // name / address / rate / rows / cols
  const [cells, setCells] = useState({});
  const [floor, setFloor] = useState(1);         // "r-c" -> cell
  const [tool, setTool] = useState(TOOLS[0]);
  const [orient, setOrient] = useState('HORIZONTAL');
  const [painting, setPainting] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const loadFloor = (f) => api(`/lots/${id}/availability?floor=${f}`).then((d) => { setCells(toMap(d.slots)); setLot({ ...d.lot }); });
  useEffect(() => {
    loadFloor(floor).catch((e) => setErr(e.message));
    const up = () => setPainting(false);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, [id]);

  // Cells for the current dimensions, with the 2x1 geometry applied
  const grid = useMemo(() => {
    if (!lot) return [];
    const full = normalize(fillDefaults(cells, lot.rows, lot.cols), lot.rows, lot.cols);
    return Object.values(full).sort((a, b) => a.row - b.row || a.col - b.col);
  }, [lot, cells]);

  const paint = (cell) => {
    const base = asMap(grid);
    const res = tool.id === 'ROTATE'
      ? rotateCell(base, lot.rows, lot.cols, cell)
      : paintCell(base, lot.rows, lot.cols, cell, tool, orient);
    if (res.error) { setErr(res.error); return; }
    setErr(''); setMsg('');
    setCells(normalize(res.map, lot.rows, lot.cols));
  };

  const autoLabel = () => {
    const next = {};
    grid.forEach((c) => {
      const label = c.kind === 'SLOT' ? defLabel(c.row, c.col) : c.label;
      next[c.row + '-' + c.col] = { ...c, label };
    });
    setCells(next);
  };

  const fillAll = () => {
    if (tool.id === 'ROTATE') return;
    const next = {};
    grid.forEach((c) => {
      next[c.row + '-' + c.col] = {
        ...c, kind: tool.kind, type: tool.type, orientation: orient,
        label: tool.kind === 'SLOT' ? defLabel(c.row, c.col) : '',
      };
    });
    setCells(normalize(next, lot.rows, lot.cols));
  };

  const renameCell = (cell) => {
    if (cell.kind !== 'SLOT') return;
    const v = prompt('Slot label', cell.label);
    if (v && v.trim()) {
      setCells({ ...asMap(grid), [cell.row + '-' + cell.col]: { ...cell, label: v.trim() } });
    }
  };

  const save = async () => {
    setBusy(true); setErr(''); setMsg('');
    try {
      await api('/admin/lots/' + id, { method: 'PUT', body: {
        name: lot.name, address: lot.address, rows: Number(lot.rows), floors: Number(lot.floors || 1),
        cols: Number(lot.cols), hourlyRate: Number(lot.hourlyRate) } });
      const payload = grid.map((c) => ({
        floor, row: c.row, col: c.col, kind: c.kind, type: c.type, label: c.label,
        orientation: c.orientation || 'HORIZONTAL' }));
      await api(`/admin/lots/${id}/layout`, { method: 'PUT', body: { floor, cells: payload } });
      setMsg('Layout saved.');
      const d = await api(`/lots/${id}/availability?floor=${floor}`);      // reload real ids for new cells
      setCells(toMap(d.slots)); setLot({ ...d.lot });
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };

  const summary = useMemo(() => {
    const s = { total: 0, BLOCKED: 0 };
    TYPE_ORDER.forEach((t) => { s[t] = 0; });
    grid.forEach((c) => {
      if (c.kind === 'SLOT') { s.total++; s[c.type]++; }
      if (c.kind === 'BLOCKED') s.BLOCKED++;
    });
    return s;
  }, [grid]);

  if (!lot) return <div className="empty">{err || 'Loading...'}</div>;
  const set = (k) => (e) => setLot({ ...lot, [k]: e.target.value });
  const num = (k) => (e) => {
    const max = k === 'rows' ? 26 : 30;
    setLot({ ...lot, [k]: Math.max(1, Math.min(max, Number(e.target.value) || 1)) });
  };

  return (
    <>
      <div className="page-head">
        <div>
          <Link to="/admin/lots" className="muted">Back to parking lots</Link>
          <h1>Design grid - {lot.name}</h1>
          <p className="muted">
            Pick a brush and a direction, then click or drag over Floor {floor}. Car bays take 2 cells; use "Rotate car bay" to flip one. Edit Floor {floor}.
          </p>
        </div>
        <button className="btn primary" onClick={save} disabled={busy}>
          {busy ? 'Saving...' : ICON.save + ' Save layout'}
        </button>
      </div>
      {err && <div className="alert error">{err}</div>}
      {msg && <div className="alert ok">{msg}</div>}

      <div className="sections floor-tabs">{Array.from({ length: lot.floors || 1 }, (_, i) => i + 1).map((f) => <button key={f} className={'sec-chip' + (floor === f ? ' on' : '')} onClick={async () => { setFloor(f); setErr(''); try { await loadFloor(f); } catch (e) { setErr(e.message); } }}>Floor {f}</button>)}</div>
      <div className="designer">
        <section className="card">
          <div className="brushes">
            {TOOLS.map((t) => (
              <button key={t.id} type="button"
                      className={'brush' + (tool.id === t.id ? ' on' : '')}
                      onClick={() => setTool(t)}>
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>

          <div className="dir-row">
            <span className="muted sm">Car bay direction (car, electric car, accessible):</span>
            <div className="dir-toggle">
              <button type="button" className={orient === 'HORIZONTAL' ? 'on' : ''}
                      onClick={() => setOrient('HORIZONTAL')}>
                {ICON.horiz} Horizontal (2 wide x 1 tall)
              </button>
              <button type="button" className={orient === 'VERTICAL' ? 'on' : ''}
                      onClick={() => setOrient('VERTICAL')}>
                {ICON.vert} Vertical (1 wide x 2 tall)
              </button>
            </div>
          </div>

          <div className="grid-scroll" onMouseLeave={() => setPainting(false)}>
            <SlotGrid
              mode="design" rows={lot.rows} cols={lot.cols} cells={grid}
              onCellDown={(c) => { setPainting(true); paint(c); }}
              onCellEnter={(c) => painting && paint(c)}
              onSelect={() => {}}
            />
          </div>
          <Legend design />
          <p className="muted sm">
            Tip:{' '}
            <button type="button" className="link" onClick={fillAll}>
              fill whole grid with the selected brush
            </button>
            {' | '}
            <button type="button" className="link" onClick={autoLabel}>
              reset all labels (A1, A2...)
            </button>
          </p>
        </section>

        <aside className="card summary">
          <h3>Lot settings</h3>
          <label>Name<input value={lot.name} onChange={set('name')} /></label>
          <label>Address
            <input value={lot.address || ''} onChange={set('address')} />
          </label>
          <div className="row2">
            <label>Rows<input type="number" value={lot.rows} onChange={num('rows')} /></label>
            <label>Columns<input type="number" value={lot.cols} onChange={num('cols')} /></label>
          </div>
          <p className="muted sm">Floors: {lot.floors || 1} (change this in Parking lots → Edit details)</p>
          <label>Base rate (per hour)
            <input type="number" min="0" step="0.5" value={lot.hourlyRate}
                   onChange={set('hourlyRate')} />
          </label>
          <p className="muted sm">
            Price multipliers: car x1, electric car x1.5, bike x0.5, electric bike x0.75,
            accessible x1, elderly x1. Current base: {money(lot.hourlyRate)}
          </p>
          <div className="divider">Summary</div>
          <div className="receipt">
            <div><span>Bookable bays</span><b>{summary.total}</b></div>
            {TYPE_ORDER.map((t) => (
              <div key={t}><span>{TYPE_ICON[t]} {TYPE_NAME[t]}</span><b>{summary[t]}</b></div>
            ))}
            <div><span>{ICON.blocked} Blocked cells</span><b>{summary.BLOCKED}</b></div>
          </div>
          <div className="rename-hint muted sm">Rename a slot:
            <select defaultValue="" onChange={(e) => {
              const c = grid.find((x) => x.row + '-' + x.col === e.target.value);
              if (c) renameCell(c);
              e.target.value = '';
            }}>
              <option value="" disabled>choose slot...</option>
              {grid.filter((c) => c.kind === 'SLOT').map((c) => (
                <option key={c.row + '-' + c.col} value={c.row + '-' + c.col}>{c.label}</option>
              ))}
            </select>
          </div>
        </aside>
      </div>
    </>
  );
}
