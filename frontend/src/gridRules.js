// Parking-grid geometry shared by the designer and the booking map.
//   Car bays  (STANDARD, EV_CAR, DISABLED): 2 cells
//        HORIZONTAL = 2 wide x 1 tall, VERTICAL = 1 wide x 2 tall
//   Bike bays (BIKE, EV_BIKE): 1 cell (1 x 1)
// The backend (LotService.normalise) applies the same rules, so what you design is what is saved.

export const CAR_TYPES = new Set(['STANDARD', 'EV_CAR', 'DISABLED', 'ELDERLY']);
export const isCar = (type) => CAR_TYPES.has(type);
export const isElectric = (type) => type === 'EV_CAR' || type === 'EV_BIKE';
export const defLabel = (r, c) => String.fromCharCode(65 + r) + (c + 1);

/** How many rows / columns a cell covers. */
export function spanOf(cell) {
  if (cell.kind === 'SLOT' && isCar(cell.type)) {
    return cell.orientation === 'VERTICAL' ? { rs: 2, cs: 1 } : { rs: 1, cs: 2 };
  }
  return { rs: 1, cs: 1 };
}

/** Makes sure every position in rows x cols has a cell (new ones: horizontal car bay). */
export function fillDefaults(cells, rows, cols) {
  const out = {};
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const k = r + '-' + c;
      out[k] = cells[k] || {
        id: -(r * 100 + c) - 1, row: r, col: c, kind: 'SLOT', type: 'STANDARD',
        orientation: 'HORIZONTAL', label: defLabel(r, c),
      };
    }
  }
  return out;
}

/**
 * Re-applies the geometry, scanning row by row, left to right (same rules as the backend):
 *  - a car bay claims one neighbour (right if horizontal, below if vertical) -> COVERED
 *  - a car bay that does not fit (edge, or neighbour already taken) -> road (AISLE)
 *  - a COVERED cell that no bay claimed -> road (AISLE)
 */
export function normalize(map, rows, cols) {
  const out = {};
  Object.keys(map).forEach((k) => { out[k] = { ...map[k] }; });
  const covered = new Set();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const k = r + '-' + c;
      const cell = out[k];
      if (!cell || covered.has(k)) continue;
      const carBay = cell.kind === 'SLOT' && isCar(cell.type);
      if (carBay) {
        const vertical = cell.orientation === 'VERTICAL';
        const r2 = vertical ? r + 1 : r;
        const c2 = vertical ? c : c + 1;
        const k2 = r2 + '-' + c2;
        if (r2 < rows && c2 < cols && out[k2] && !covered.has(k2)) {
          out[k2] = { ...out[k2], kind: 'COVERED', type: 'STANDARD', label: '' };
          covered.add(k2);
          continue;
        }
        out[k] = { ...cell, kind: 'AISLE', type: 'STANDARD', label: '' };
      } else if (cell.kind === 'COVERED') {
        out[k] = { ...cell, kind: 'AISLE', label: '' };
      }
    }
  }
  return out;
}

// If the cell is the covered half of a bay, remove that bay (its owner is on the left or above).
function freeOwner(m, r, c) {
  const t = m[r + '-' + c];
  if (!t || t.kind !== 'COVERED') return;
  const left = m[r + '-' + (c - 1)];
  const above = m[(r - 1) + '-' + c];
  if (left && left.kind === 'SLOT' && isCar(left.type) && left.orientation !== 'VERTICAL') {
    m[r + '-' + (c - 1)] = { ...left, kind: 'AISLE', type: 'STANDARD' };
  } else if (above && above.kind === 'SLOT' && isCar(above.type)
      && above.orientation === 'VERTICAL') {
    m[(r - 1) + '-' + c] = { ...above, kind: 'AISLE', type: 'STANDARD' };
  }
}

/** Paints one cell with a brush ({kind, type}) and a direction. Returns { map } or { map, error }. */
export function paintCell(map, rows, cols, cell, tool, orientation) {
  const r = cell.row;
  const c = cell.col;
  const car = tool.kind === 'SLOT' && isCar(tool.type);
  const vertical = orientation === 'VERTICAL';
  if (car && (vertical ? r + 1 >= rows : c + 1 >= cols)) {
    return { map, error: 'No room for a 2x1 car bay here. Pick another cell or direction.' };
  }
  const out = { ...map };
  if (car) freeOwner(out, vertical ? r + 1 : r, vertical ? c : c + 1);
  out[r + '-' + c] = {
    ...cell, kind: tool.kind, type: tool.type, orientation,
    label: tool.kind === 'SLOT' ? (cell.label || defLabel(r, c)) : '',
  };
  return { map: out };
}

/** Flips a car bay between horizontal and vertical. */
export function rotateCell(map, rows, cols, cell) {
  const cur = map[cell.row + '-' + cell.col];
  if (!cur || cur.kind !== 'SLOT' || !isCar(cur.type)) {
    return { map, error: 'Click a car bay to rotate it.' };
  }
  const next = cur.orientation === 'VERTICAL' ? 'HORIZONTAL' : 'VERTICAL';
  return paintCell(map, rows, cols, cur, { kind: 'SLOT', type: cur.type }, next);
}
