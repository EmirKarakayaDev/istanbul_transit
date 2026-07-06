export type TrackType = 'surface' | 'elevated' | 'underground';
export type GameMode = 'sandbox' | 'budget' | 'scenario';
export type ActiveTool = 'station' | 'track' | 'upgrade' | 'demolish' | 'select';

export interface Station {
  id: string;
  name: string;
  coordinates: [number, number]; // [lng, lat]
  type: TrackType;
  zoneId: string | null;
}

export interface TrackSegment {
  id: string;
  fromStationId: string;
  toStationId: string;
  type: TrackType;
  geometry: GeoJSON.LineString;
  cost: number;
  distance: number; // km
}

export interface TransitLine {
  id: string;
  name: string;
  color: string;
  segmentIds: string[];
}

export interface Zone {
  id: string;
  geometry: GeoJSON.Polygon;
  center: [number, number];
  population: number;
  jobDensity: number;
  costMultiplier: number;
}

export interface ModeShare {
  transitTrips: number;
  drivingTrips: number;
  walkingTrips: number;
}

export interface ZoneRidership extends ModeShare {
  zoneId: string;
  totalTrips: number;       // all generated trips from this zone
  dailyRiders: number;      // alias for transitTrips (kept for backwards compat)
  coveredByNetwork: boolean;
}

export interface SimulationResult {
  totalDailyRidership: number;
  totalDrivingTrips: number;
  totalWalkingTrips: number;
  transitSharePercent: number; // 0–100
  coveragePercent: number;
  avgCommuteTimeSaved: number; // minutes
  zoneRidership: ZoneRidership[];
  timestamp: number;
}

export interface ScenarioTarget {
  targetRiders: number;
  year: number;
  description: string;
}

export interface GameState {
  mode: GameMode;
  budget: number;        // TL
  spent: number;         // TL
  score: number;
  scenario: ScenarioTarget | null;
}

export interface NetworkState {
  stations: Record<string, Station>;
  segments: Record<string, TrackSegment>;
  lines: Record<string, TransitLine>;
}

export interface SaveData {
  version: number;
  timestamp: number;
  network: NetworkState;
  game: GameState;
  simulationResult: SimulationResult | null;
}

// GeoJSON helpers for Mapbox
export type StationFeature = GeoJSON.Feature<GeoJSON.Point, Station>;
export type SegmentFeature = GeoJSON.Feature<GeoJSON.LineString, TrackSegment & { lineColor: string }>;
