export function parseGps(value) {
  if (typeof value !== 'string') return null;
  const parts = value.split(',').map(part => part.trim());
  if (parts.length !== 2 || parts.some(part => part === '')) return null;
  const [lat, lng] = parts.map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}
