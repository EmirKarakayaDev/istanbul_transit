// Istanbul map bounds
export const ISTANBUL_BBOX: [number, number, number, number] = [28.6, 40.8, 29.5, 41.3];
export const ISTANBUL_CENTER: [number, number] = [29.0, 41.01];
export const ISTANBUL_ZOOM = 11;

// Grid cell size in meters
export const GRID_CELL_SIZE_M = 500;

// Construction cost base values (TL per km)
export const BASE_COST_PER_KM: Record<string, number> = {
  surface: 50_000_000,       // 50M TL/km
  elevated: 150_000_000,     // 150M TL/km
  underground: 400_000_000,  // 400M TL/km
};

// Terrain / restriction multipliers
export const COST_MULTIPLIERS = {
  historicArea: 2.5,   // Sultanahmet, Beyazıt, Galata etc.
  denseCorridor: 1.4,  // high density urban areas
  bosphorus: {
    ferry: 0.3,
    bridge: 2.0,
    tunnel: 4.0,
  },
  waterBody: 3.0,
} as const;

// Station walking catchment radius (meters)
export const STATION_WALK_RADIUS_M = 500;

// Simulation parameters
export const PEAK_HOUR_FACTOR = 2.5;
export const OFF_PEAK_FACTOR = 1.0;
export const TRANSFER_PENALTY_MINUTES = 5;
export const AVG_TRAIN_SPEED_KMH = 40;

// Game mode budgets (TL)
export const BUDGET_MODE_START = 20_000_000_000; // 20B TL

// Line colors palette
export const LINE_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#a855f7', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
];

// Historic area bounding boxes [minLng, minLat, maxLng, maxLat]
export const HISTORIC_AREAS: Array<{ name: string; bbox: [number, number, number, number] }> = [
  { name: 'Sultanahmet', bbox: [28.96, 41.00, 28.985, 41.015] },
  { name: 'Beyazıt', bbox: [28.955, 41.008, 28.975, 41.022] },
  { name: 'Galata', bbox: [28.969, 41.022, 28.985, 41.035] },
  { name: 'Kapalıçarşı', bbox: [28.957, 41.01, 28.972, 41.02] },
  { name: 'Topkapı Sarayı', bbox: [28.978, 41.009, 28.99, 41.017] },
];

// Bosphorus crossing zone (approximate)
export const BOSPHORUS_BBOX: [number, number, number, number] = [28.98, 40.9, 29.08, 41.2];

// Mapbox style
export const MAPBOX_STYLE = 'mapbox://styles/mapbox/dark-v11';

// Save slot constants
export const SAVE_KEY_PREFIX = 'istanbul_transit_save_';
export const MAX_SAVE_SLOTS = 5;
export const CURRENT_SAVE_VERSION = 1;
