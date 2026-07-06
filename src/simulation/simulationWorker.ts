import type { Zone, Station, TrackSegment, TransitLine, SimulationResult, ZoneRidership } from '../data/types';
import { generateTripDemand } from './tripGeneration';
import { buildZoneToStationMap } from './demandMatrix';
import { buildGraph } from '../engine/graphBuilder';
import { findAllReachable } from './routeFinder';
import { chooseMode } from './modeChoice';

export interface SimulationInput {
  zones: Zone[];
  stations: Record<string, Station>;
  segments: Record<string, TrackSegment>;
  lines: Record<string, TransitLine>;
}

export interface SimulationOutput {
  type: 'result';
  result: SimulationResult;
}

export interface SimulationError {
  type: 'error';
  message: string;
}

const COMMUTE_RATE = 0.4;          // 40% of population makes a daily work trip
const PEAK_FACTOR = 2.5;           // scale gravity model output to daily totals
const COMMUTE_SAVE_MIN = 18;       // avg minutes saved per transit trip vs driving

self.onmessage = (e: MessageEvent<SimulationInput>) => {
  try {
    const { zones, stations, segments } = e.data;

    const stationList = Object.values(stations);
    const hasNetwork = stationList.length > 0 && Object.keys(segments).length > 0;

    // ─── STEP 1: Trip Generation ─────────────────────────────────────────────
    // Trips_i = Population_i × commute_rate
    // Each zone generates trips proportional to its population.
    // The gravity model in generateTripDemand distributes them to destinations.
    const allTripPairs = generateTripDemand(zones, 0.05);

    // ─── STEP 2: Destination Distribution ───────────────────────────────────
    // Already encoded in the gravity model output (tripPairs).
    // Build a zone index for fast lookup.
    const zoneById = new Map(zones.map((z) => [z.id, z]));

    // ─── STEP 3: Mode Choice ─────────────────────────────────────────────────
    // For each OD pair decide: walking / transit / driving.
    // We need the transit graph to check reachability and travel time.

    // Build transit graph
    const graph = hasNetwork ? buildGraph(stations, segments) : null;

    // Cache reachability per home station (Dijkstra from each station)
    const reachableFromStation = new Map<string, Map<string, number>>();

    // Map zone → nearest station
    const zoneToStation = buildZoneToStationMap(zones, stationList);

    // Pre-compute reachable travel times from each unique home station
    if (graph) {
      const uniqueHomeStations = new Set<string>();
      for (const [, staId] of zoneToStation) {
        if (staId) uniqueHomeStations.add(staId);
      }
      for (const staId of uniqueHomeStations) {
        reachableFromStation.set(staId, findAllReachable(graph, staId));
      }
    }

    // Haversine helper (inline for worker isolation)
    const hav = (a: [number, number], b: [number, number]): number => {
      const toR = (d: number) => (d * Math.PI) / 180;
      const dLat = toR(b[1] - a[1]);
      const dLon = toR(b[0] - a[0]);
      const s = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a[1])) * Math.cos(toR(b[1])) * Math.sin(dLon / 2) ** 2;
      return 2 * 6371 * Math.asin(Math.sqrt(s));
    };

    // Accumulate per-zone mode split
    interface ZoneAccum {
      transitTrips: number;
      drivingTrips: number;
      walkingTrips: number;
      totalTrips: number;
    }
    const zoneAccum = new Map<string, ZoneAccum>();
    const initAccum = (): ZoneAccum => ({ transitTrips: 0, drivingTrips: 0, walkingTrips: 0, totalTrips: 0 });

    for (const pair of allTripPairs) {
      const homeZone = zoneById.get(pair.homeZoneId);
      const destZone = zoneById.get(pair.destZoneId);
      if (!homeZone || !destZone) continue;

      const rawTrips = pair.trips * PEAK_FACTOR * COMMUTE_RATE;
      const distKm = hav(homeZone.center, destZone.center);

      // Can this OD pair use transit?
      let hasTransitRoute = false;
      let transitTimeMin = 0;

      if (graph) {
        const homeStaId = zoneToStation.get(pair.homeZoneId);
        const destStaId = zoneToStation.get(pair.destZoneId);
        if (homeStaId && destStaId && homeStaId !== destStaId) {
          const reachable = reachableFromStation.get(homeStaId);
          if (reachable?.has(destStaId)) {
            hasTransitRoute = true;
            transitTimeMin = reachable.get(destStaId)!;
          }
        }
      }

      const mode = chooseMode({ distanceKm: distKm, hasTransitRoute, transitTimeMin });

      const acc = zoneAccum.get(pair.homeZoneId) ?? initAccum();
      acc.totalTrips += rawTrips;
      if (mode === 'transit') acc.transitTrips += rawTrips;
      else if (mode === 'driving') acc.drivingTrips += rawTrips;
      else acc.walkingTrips += rawTrips;
      zoneAccum.set(pair.homeZoneId, acc);
    }

    // ─── STEP 4: Network Assignment ──────────────────────────────────────────
    // Compute per-zone ridership and aggregate totals.
    const coveredZoneIds = new Set<string>();
    for (const [zoneId, staId] of zoneToStation) {
      if (staId) coveredZoneIds.add(zoneId);
    }

    let totalDailyRidership = 0;
    let totalDrivingTrips = 0;
    let totalWalkingTrips = 0;

    const zoneRidership: ZoneRidership[] = zones.map((z) => {
      const acc = zoneAccum.get(z.id) ?? initAccum();
      const transitT = Math.round(acc.transitTrips);
      const drivingT = Math.round(acc.drivingTrips);
      const walkingT = Math.round(acc.walkingTrips);
      totalDailyRidership += transitT;
      totalDrivingTrips += drivingT;
      totalWalkingTrips += walkingT;
      return {
        zoneId: z.id,
        totalTrips: Math.round(acc.totalTrips),
        dailyRiders: transitT,
        transitTrips: transitT,
        drivingTrips: drivingT,
        walkingTrips: walkingT,
        coveredByNetwork: coveredZoneIds.has(z.id),
      };
    });

    const totalTrips = totalDailyRidership + totalDrivingTrips + totalWalkingTrips;
    const transitSharePercent = totalTrips > 0 ? (totalDailyRidership / totalTrips) * 100 : 0;
    const coveragePercent = zones.length > 0 ? (coveredZoneIds.size / zones.length) * 100 : 0;
    const avgCommuteTimeSaved = transitSharePercent > 0 ? COMMUTE_SAVE_MIN * (transitSharePercent / 100) : 0;

    const result: SimulationResult = {
      totalDailyRidership,
      totalDrivingTrips,
      totalWalkingTrips,
      transitSharePercent,
      coveragePercent,
      avgCommuteTimeSaved,
      zoneRidership,
      timestamp: Date.now(),
    };

    self.postMessage({ type: 'result', result } as SimulationOutput);
  } catch (err) {
    self.postMessage({
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
    } as SimulationError);
  }
};
