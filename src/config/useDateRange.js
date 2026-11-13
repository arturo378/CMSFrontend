import { useHistory, useLocation } from 'react-router-dom';
import { addDays, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';
export const dateString = date => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
export function parseDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const date = new Date(value + 'T00:00:00');
  return !Number.isNaN(date.getTime()) && dateString(date) === value ? date : null;
}
export function presetRange(key, now = new Date()) {
  switch (key) {
    case 'last7': return { from: dateString(addDays(now, -6)), to: dateString(now) };
    case 'thisMonth': return { from: dateString(startOfMonth(now)), to: dateString(now) };
    case 'lastMonth': return { from: dateString(startOfMonth(subMonths(now, 1))), to: dateString(endOfMonth(subMonths(now, 1))) };
    default: return { from: dateString(addDays(now, -29)), to: dateString(now) };
  }
}
export default function useDateRange(defaultPreset = 'last7') {
  const location = useLocation(); const history = useHistory(); const params = new URLSearchParams(location.search);
  const preset = ['last7', 'last30', 'thisMonth', 'lastMonth', 'custom'].includes(params.get('range')) ? params.get('range') : defaultPreset;
  const fallback = presetRange(preset === 'custom' ? defaultPreset : preset);
  const from = params.get('from') ?? fallback.from; const to = params.get('to') ?? fallback.to;
  const start = parseDay(from); const end = parseDay(to);
  const invalid = !start || !end || start > end;
  const update = changes => {
    const next = new URLSearchParams(location.search);
    Object.entries({ from, to, range: preset, ...changes }).forEach(([key, value]) => next.set(key, value));
    next.delete('page'); history.replace({ ...location, search: '?' + next });
  };
  return { from, to, preset, invalid, startDate: start, endDate: end,
    queryRange: invalid ? {} : { startDate: startOfDay(start).toISOString(), endDate: endOfDay(end).toISOString() },
    setPreset: key => update({ range: key, ...(key === 'custom' ? {} : presetRange(key)) }),
    setFrom: value => update({ from: value, range: 'custom' }), setTo: value => update({ to: value, range: 'custom' }),
  };
}
export function filterByDate(rows, from, to) {
  const start = from ? parseDay(from) : null; const end = to ? parseDay(to) : null;
  if ((from && !start) || (to && !end) || (start && end && start > end)) return [];
  return rows.filter(row => { const date = new Date(row.date).getTime(); return (!start || date >= startOfDay(start).getTime()) && (!end || date <= endOfDay(end).getTime()); });
}
