import type { Station, Zone } from '../data/types';
import { haversineKm } from '../utils/geo';
import { STATION_WALK_RADIUS_M } from '../data/constants';

const WALK_RADIUS_KM = STATION_WALK_RADIUS_M / 1000;

/**
 * For each zone, determine whether it is covered by at least one station.
 */
export function computeCoverage(
  stations: Station[],
  zones: Zone[]
): Map<string, boolean> {
  const coverage = new Map<string, boolean>();
  for (const zone of zones) {
    const covered = stations.some(
      (sta) => haversineKm(sta.coordinates, zone.center) <= WALK_RADIUS_KM
    );
    coverage.set(zone.id, covered);
  }
  return coverage;
}

/**
 * Get all zone IDs within walking distance of a given station.
 */
export function getStationCatchment(
  station: Station,
  zones: Zone[]
): string[] {
  return zones
    .filter((z) => haversineKm(station.coordinates, z.center) <= WALK_RADIUS_KM)
    .map((z) => z.id);
}

/**
 * Overall coverage percentage (0–100).
 */
export function coveragePercent(coverage: Map<string, boolean>): number {
  if (coverage.size === 0) return 0;
  const covered = [...coverage.values()].filter(Boolean).length;
  return (covered / coverage.size) * 100;
}
