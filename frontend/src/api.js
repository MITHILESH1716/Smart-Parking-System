// Tiny fetch wrapper: adds the JWT, parses JSON, throws readable errors.
export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (auth && token) headers.Authorization = 'Bearer ' + token;

  const res = await fetch('/api' + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth) {
    const wasAdmin = localStorage.getItem('role') === 'ADMIN';
    localStorage.clear();
    window.location.href = wasAdmin ? '/admin/login' : '/login';
    throw new Error('Session expired. Please sign in again.');
  }

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* non-JSON */ }
  if (!res.ok) throw new Error((data && data.message) || `Request failed (${res.status})`);
  return data;
}

// ---------- helpers ----------
export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pad = (n) => String(n).padStart(2, '0');
export const dateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const isoLocal = (d) => `${dateStr(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
export const fmtDT = (s) => new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
export const hourLabel = (h) => `${pad(h)}:00`;
// Icons are written as \u escapes so the file stays plain ASCII.
export const ICON = {
  car: '\u{1F697}', bolt: '\u26A1', bike: '\u{1F3CD}\uFE0F', ebike: '\u{1F6F5}', access: '\u267F',
  blocked: '\u26D4', road: '\u2B1C', rotate: '\u{1F504}', down: '\u2B07', save: '\u{1F4BE}', spark: '\u2728',
  horiz: '\u2194', vert: '\u2195',
};
export const TYPE_ICON = {
  STANDARD: ICON.car, EV_CAR: ICON.car + ICON.bolt, BIKE: ICON.bike, EV_BIKE: ICON.ebike + ICON.bolt, DISABLED: ICON.access,
};
export const TYPE_NAME = {
  STANDARD: 'Car', EV_CAR: 'Electric car', BIKE: 'Bike', EV_BIKE: 'Electric bike', DISABLED: 'Accessible (disabled) parking',
};
export const TYPE_ORDER = ['STANDARD', 'EV_CAR', 'BIKE', 'EV_BIKE', 'DISABLED'];
