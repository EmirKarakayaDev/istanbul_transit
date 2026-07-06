import type { Zone } from '../data/types';

export interface TripPair {
  homeZoneId: string;
  destZoneId: string;
  trips: number;
}

const EARTH_R = 6371;

function haversineKm(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.sqrt(s));
}

/**
 * Generate zone-to-zone trip demand using the gravity model:
 * Trips(home, dest) ∝ Population_home × JobDensity_dest / Distance²
 *
 * Only returns pairs where trips > threshold to limit matrix size.
 */
export function generateTripDemand(
  zones: Zone[],
  threshold = 0.1
): TripPair[] {
  const pairs: TripPair[] = [];

  for (let i = 0; i < zones.length; i++) {
    for (let j = 0; j < zones.length; j++) {
      if (i === j) continue;
      const home = zones[i];
      const dest = zones[j];
      if (home.population <= 0 || dest.jobDensity <= 0) continue;

      const dist = Math.max(0.5, haversineKm(home.center, dest.center));
      const trips = (home.population * dest.jobDensity) / (dist * dist);

      if (trips >= threshold) {
        pairs.push({ homeZoneId: home.id, destZoneId: dest.id, trips });
      }
    }
  }

  return pairs;
}
