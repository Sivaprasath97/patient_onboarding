export function formatDate(value) {
  if (!value) return '—';
  // Plain YYYY-MM-DD dates must not shift with the timezone.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function timeAgo(value) {
  if (!value) return '';
  const s = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return formatDate(value);
}

export function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function fileSize(bytes) {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const humanize = (s = '') => s.replace(/[_.]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** Remove empty strings so optional fields are sent as null/omitted. */
export function clean(obj) {
  const out = {};
  Object.entries(obj).forEach(([k, v]) => {
    out[k] = v === '' ? null : v;
  });
  return out;
}
