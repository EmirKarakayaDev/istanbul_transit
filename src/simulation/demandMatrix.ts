import type { Zone, Station } from '../data/types';
import type { TripPair } from './tripGeneration';
import { STATION_WALK_RADIUS_M } from '../data/constants';

const WALK_RADIUS_KM = STATION_WALK_RADIUS_M / 1000;

function haversineKm(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(s));
}

/**
 * Maps each zone to the nearest station ID within walking distance.
 */
export function buildZoneToStationMap(
  zones: Zone[],
  stations: Station[]
): Map<string, string | null> {
  const map = new Map<string, string | null>();

  for (const zone of zones) {
    let nearest: Station | null = null;
    let nearestDist = Infinity;

    for (const sta of stations) {
      const d = haversineKm(zone.center, sta.coordinates);
      if (d <= WALK_RADIUS_KM && d < nearestDist) {
        nearest = sta;
        nearestDist = d;
      }
    }

    map.set(zone.id, nearest ? nearest.id : null);
  }

  return map;
}

/**
 * Filter trip pairs to only those where both ends have a reachable station.
 */
export function filterReachableTrips(
  trips: TripPair[],
  zoneToStation: Map<string, string | null>
): TripPair[] {
  return trips.filter(
    (t) => zoneToStation.get(t.homeZoneId) && zoneToStation.get(t.destZoneId)
  );
}

/**
 * Compute daily ridership per zone from reachable trip pairs.
 */
export function computeZoneRidership(
  reachableTrips: TripPair[],
  coveredZoneIds: Set<string>
): Map<string, number> {
  const ridershipMap = new Map<string, number>();

  for (const trip of reachableTrips) {
    if (!coveredZoneIds.has(trip.homeZoneId)) continue;
    const current = ridershipMap.get(trip.homeZoneId) ?? 0;
    ridershipMap.set(trip.homeZoneId, current + trip.trips);
  }

  return ridershipMap;
}
