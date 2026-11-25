import { ICON, TYPE_ICON, TYPE_NAME } from '../api.js';
import { spanOf } from '../gridRules.js';

/**
 * Parking map.
 * mode="book"   -> available bays of the chosen section (activeType) are clickable
 * mode="design" -> every cell is clickable (the parent decides what a click does)
 * Car bays are drawn 2 cells wide (horizontal) or 2 cells tall (vertical); bikes are 1 cell.
 */
export default function SlotGrid({
  rows, cols, cells, selectedId, onSelect, mode = 'book',
  onCellDown, onCellEnter, cellSize = 46, activeType,
}) {
  const byPos = new Map(cells.map((c) => [c.row + '-' + c.col, c]));
  const items = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = byPos.get(r + '-' + c);
      if (!cell) {
        items.push(
          <div key={r + '-' + c} className="cell aisle"
               style={{ gridRow: r + 1, gridColumn: c + 1 }} />
        );
        continue;
      }
      if (cell.kind === 'COVERED') continue;      // second half of a car bay: drawn by its bay
      const { rs, cs } = spanOf(cell);
      const place = { gridRow: `${r + 1} / span ${rs}`, gridColumn: `${c + 1} / span ${cs}` };
      const isSlot = cell.kind === 'SLOT';

      let cls = 'cell ';
      if (cell.kind === 'AISLE') cls += 'aisle' + (mode === 'design' ? ' editable' : '');
      else if (cell.kind === 'BLOCKED') cls += 'blocked';
      else if (mode === 'book') cls += cell.status === 'BOOKED' ? 'booked' : 'available';
      else cls += 'available';
      if (isSlot) {
        cls += ' t-' + cell.type.toLowerCase();
        cls += rs === 2 ? ' car vert' : cs === 2 ? ' car horiz' : ' bike';
      }
      const dim = mode === 'book' && isSlot && activeType && cell.type !== activeType;
      if (dim) cls += ' dim';
      if (selectedId != null && cell.id === selectedId) cls += ' selected';
      const clickable = mode === 'design' || (isSlot && cell.status === 'AVAILABLE' && !dim);
      const tip = isSlot
        ? `${cell.label} - ${TYPE_NAME[cell.type]}${cell.status ? ' - ' + cell.status : ''}`
        : cell.kind;

      items.push(
        <button
          key={r + '-' + c}
          type="button"
          className={cls}
          style={place}
          disabled={!clickable}
          title={tip}
          onClick={() => clickable && onSelect && onSelect(cell)}
          onMouseDown={() => onCellDown && onCellDown(cell)}
          onMouseEnter={() => onCellEnter && onCellEnter(cell)}
        >
          {isSlot && (<>
            <span className="lbl">{cell.label}</span>
            {cell.type !== 'STANDARD' && <span className="ico">{TYPE_ICON[cell.type]}</span>}
          </>)}
          {cell.kind === 'BLOCKED' && <span className="ico">{ICON.blocked}</span>}
        </button>
      );
    }
  }
  return (
    <div className="grid-wrap">
      <div className="entrance"><span>ENTRANCE {ICON.down}</span></div>
      <div className="grid" style={{
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
      }}>
        {items}
      </div>
    </div>
  );
}

export function Legend({ design }) {
  return (
    <div className="legend">
      {!design && <><i className="sw available" />Available</>}
      {!design && <><i className="sw booked" />Booked</>}
      {!design && <><i className="sw selected" />Your pick</>}
      <i className="sw blocked" />Blocked
      <span>{ICON.car} Car (2x1)</span>
      <span>{ICON.car}{ICON.bolt} Electric car (2x1)</span>
      <span>{ICON.bike} Bike</span>
      <span>{ICON.ebike}{ICON.bolt} Electric bike</span>
      <span>{ICON.access} Accessible zone (2x1)</span>
    </div>
  );
}
