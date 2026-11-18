export function initials(name = '') {
  const parts = name
    .replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?';
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
