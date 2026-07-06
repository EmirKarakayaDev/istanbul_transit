/**
 * buildCostSurface.ts
 *
 * Assigns cost multipliers to each grid zone based on:
 *   - Historic area (×2.5)
 *   - Dense urban corridor (×1.4)
 *   - Bosphorus crossing zone (×3.0)
 *
 * Run with: npx tsx scripts/buildCostSurface.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'public', 'data');

interface ZoneProps {
  id: string;
  centerLng: number;
  centerLat: number;
  population: number;
  jobDensity: number;
  costMultiplier: number;
}

// Historic areas: [minLng, minLat, maxLng, maxLat, multiplier]
const HISTORIC_BBOXES: Array<[number, number, number, number, number]> = [
  [28.96, 41.00, 28.985, 41.015, 2.5],   // Sultanahmet
  [28.955, 41.008, 28.975, 41.022, 2.5],  // Beyazıt
  [28.969, 41.022, 28.985, 41.035, 2.0],  // Galata / Karaköy
  [28.978, 41.009, 28.990, 41.017, 2.5],  // Topkapı Sarayı surroundings
];

// Dense corridors: [minLng, minLat, maxLng, maxLat, multiplier]
const DENSE_BBOXES: Array<[number, number, number, number, number]> = [
  [28.97, 41.03, 29.00, 41.07, 1.4],   // Şişli / Taksim / Mecidiyeköy
  [28.98, 40.98, 29.05, 41.01, 1.3],   // Üsküdar / Kadıköy waterfront
  [28.85, 41.00, 28.93, 41.06, 1.3],   // Bağcılar / Esenler
];

// Bosphorus water body: [minLng, minLat, maxLng, maxLat, multiplier]
const BOSPHORUS_BBOX: [number, number, number, number, number] = [28.985, 40.91, 29.08, 41.25, 3.0];

function inBbox(lng: number, lat: number, bbox: [number, number, number, number, number]): boolean {
  return lng >= bbox[0] && lng <= bbox[2] && lat >= bbox[1] && lat <= bbox[3];
}

const geojsonPath = join(DATA_DIR, 'istanbul-grid.geojson');
const geojson = JSON.parse(readFileSync(geojsonPath, 'utf-8')) as GeoJSON.FeatureCollection<GeoJSON.Polygon, ZoneProps>;

for (const feature of geojson.features) {
  const { centerLng: lng, centerLat: lat } = feature.properties;
  let multiplier = 1.0;

  if (inBbox(lng, lat, BOSPHORUS_BBOX)) {
    multiplier = Math.max(multiplier, 3.0);
  }

  for (const bbox of DENSE_BBOXES) {
    if (inBbox(lng, lat, bbox)) {
      multiplier = Math.max(multiplier, bbox[4]);
    }
  }

  for (const bbox of HISTORIC_BBOXES) {
    if (inBbox(lng, lat, bbox)) {
      multiplier = Math.max(multiplier, bbox[4]);
    }
  }

  feature.properties.costMultiplier = multiplier;
}

writeFileSync(geojsonPath, JSON.stringify(geojson));
console.log(`Built cost surface for ${geojson.features.length} zones → ${geojsonPath}`);
