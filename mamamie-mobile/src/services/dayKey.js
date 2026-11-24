// Date-only values are stored as local calendar-day keys ("yyyy-MM-dd"), never UTC ISO
// strings, so a record never moves to another day across time zones or DST changes.

const pad = (n) => String(n).padStart(2, '0');

export function toDayKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDayKey(key) {
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key, days) {
  const d = fromDayKey(key);
  if (!d) return null;
  d.setDate(d.getDate() + days);
  return toDayKey(d);
}

// Whole calendar days from a to b (b - a), using local midnight so DST never shifts the count.
export function daysBetween(aKey, bKey) {
  const a = fromDayKey(aKey);
  const b = fromDayKey(bKey);
  if (!a || !b) return null;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86400000);
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

export function formatDayKey(key, { short = false } = {}) {
  const d = fromDayKey(key);
  if (!d) return '';
  const month = short ? MONTHS_SHORT[d.getMonth()] : MONTHS[d.getMonth()];
  return `${d.getDate()} ${month} ${d.getFullYear()}`;
}

export { MONTHS, MONTHS_SHORT };
