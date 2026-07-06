const EARTH_RADIUS_KM = 6371;

/**
 * Haversine distance between two [lng, lat] points in kilometers.
 */
export function haversineKm(a: [number, number], b: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const aVal =
    sinDLat * sinDLat +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * sinDLon * sinDLon;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(aVal));
}

/**
 * Convert km distance to approximate meters.
 */
export function kmToMeters(km: number): number {
  return km * 1000;
}

/**
 * Check if a point [lng, lat] is inside a bounding box [minLng, minLat, maxLng, maxLat].
 */
export function pointInBbox(
  point: [number, number],
  bbox: [number, number, number, number]
): boolean {
  return (
    point[0] >= bbox[0] &&
    point[0] <= bbox[2] &&
    point[1] >= bbox[1] &&
    point[1] <= bbox[3]
  );
}

/**
 * Build a GeoJSON LineString from two [lng, lat] points.
 */
export function makeLineString(
  from: [number, number],
  to: [number, number]
): GeoJSON.LineString {
  return {
    type: 'LineString',
    coordinates: [from, to],
  };
}

/**
 * Format a large TL amount to readable string (e.g. 1.5B TL, 250M TL).
 */
export function formatTL(amount: number): string {
  if (!isFinite(amount)) return '∞';
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B TL`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)}M TL`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K TL`;
  return `${amount.toFixed(0)} TL`;
}

/**
 * Format a number with locale separators.
 */
export function formatNumber(n: number): string {
  if (!isFinite(n)) return '∞';
  return n.toLocaleString('tr-TR');
}
