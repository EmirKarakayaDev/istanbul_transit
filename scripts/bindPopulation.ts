/**
 * bindPopulation.ts
 *
 * Reads the grid GeoJSON and assigns synthetic population data to each zone.
 * In production, replace the population estimator with real GHSL raster sampling.
 *
 * Synthetic model: population density peaks at the city centre (Taksim / Eminönü)
 * and the major sub-centres (Kadıköy, Beşiktaş, Üsküdar, Bağcılar).
 *
 * Run with: npx tsx scripts/bindPopulation.ts
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

// Major population centres: [lng, lat, peak_density (people per 500m cell)]
const POP_CENTRES = [
  [28.978, 41.037, 12000],  // Taksim
  [28.971, 41.017, 11000],  // Eminönü / Sultanahmet
  [29.026, 40.990, 10000],  // Kadıköy
  [29.004, 41.041, 9000],   // Beşiktaş
  [29.017, 41.023, 8500],   // Üsküdar
  [28.856, 41.036, 8000],   // Bağcılar / Güneşli
  [28.870, 40.980, 7500],   // Bakırköy
  [29.011, 41.080, 7000],   // Levent
  [29.040, 41.104, 6500],   // Sarıyer
  [29.230, 40.877, 6000],   // Pendik
];

function gaussianPop(
  lng: number,
  lat: number,
  centreLng: number,
  centreLat: number,
  peak: number,
  sigma = 0.04
): number {
  const dLng = lng - centreLng;
  const dLat = lat - centreLat;
  const dist2 = dLng * dLng + dLat * dLat;
  return peak * Math.exp(-dist2 / (2 * sigma * sigma));
}

const geojsonPath = join(DATA_DIR, 'istanbul-grid.geojson');
const geojson = JSON.parse(readFileSync(geojsonPath, 'utf-8')) as GeoJSON.FeatureCollection<GeoJSON.Polygon, ZoneProps>;

for (const feature of geojson.features) {
  const { centerLng, centerLat } = feature.properties;
  let pop = 0;
  for (const [cLng, cLat, peak] of POP_CENTRES) {
    pop += gaussianPop(centerLng, centerLat, cLng as number, cLat as number, peak as number);
  }
  feature.properties.population = Math.round(Math.max(0, pop));
}

writeFileSync(geojsonPath, JSON.stringify(geojson));
console.log(`Bound population data to ${geojson.features.length} zones → ${geojsonPath}`);
