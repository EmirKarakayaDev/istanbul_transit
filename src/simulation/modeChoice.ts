import type { ModeShare } from '../data/types';

// Thresholds (km)
const WALKING_THRESHOLD_KM = 0.8;   // trips under 800m → walking
const DRIVING_BASE_TIME_KMH = 25;   // avg driving speed in dense Istanbul (km/h)
const TRANSIT_TIME_ADVANTAGE = 1.3; // transit must be < driving_time × 1.3 to attract riders

export type Mode = 'walking' | 'transit' | 'driving';

export interface ModeChoiceInput {
  distanceKm: number;
  hasTransitRoute: boolean;
  transitTimeMin: number;  // 0 if no route
}

/**
 * Logit-style mode choice:
 * - Walking  : distance < 0.8 km
 * - Transit  : distance ≥ 0.8 km, transit available, transit_time < driving_time × 1.3
 * - Driving  : everything else
 */
export function chooseMode(input: ModeChoiceInput): Mode {
  const { distanceKm, hasTransitRoute, transitTimeMin } = input;

  if (distanceKm < WALKING_THRESHOLD_KM) return 'walking';

  if (hasTransitRoute) {
    const drivingTimeMin = (distanceKm / DRIVING_BASE_TIME_KMH) * 60;
    if (transitTimeMin < drivingTimeMin * TRANSIT_TIME_ADVANTAGE) return 'transit';
  }

  return 'driving';
}

/**
 * Given N trip pairs for a zone, compute the mode share breakdown.
 */
export function computeModeShare(
  trips: Array<{ trips: number; mode: Mode }>
): ModeShare {
  let transitTrips = 0;
  let drivingTrips = 0;
  let walkingTrips = 0;

  for (const { trips: t, mode } of trips) {
    if (mode === 'transit') transitTrips += t;
    else if (mode === 'driving') drivingTrips += t;
    else walkingTrips += t;
  }

  return { transitTrips, drivingTrips, walkingTrips };
}
