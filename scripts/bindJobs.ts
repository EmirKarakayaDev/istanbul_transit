/**
 * bindJobs.ts
 *
 * Assigns job density scores to each grid zone.
 * In production, use the OSM Overpass API to pull offices, shops, commercial areas.
 *
 * Synthetic model: job centres mirror the major CBDs and employment zones of Istanbul.
 *
 * Run with: npx tsx scripts/bindJobs.ts
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

// Job centres: [lng, lat, job_score]
const JOB_CENTRES = [
  [28.978, 41.037, 1.0],   // Taksim / Şişli – prime commercial
  [28.965, 41.018, 0.9],   // Kapalıçarşı / Grand Bazaar area
  [29.011, 41.080, 0.95],  // Levent – finance & corporates
  [28.993, 41.063, 0.8],   // Mecidiyeköy
  [29.026, 40.990, 0.75],  // Kadıköy
  [28.870, 40.980, 0.6],   // Bakırköy
  [29.017, 41.023, 0.6],   // Üsküdar
  [29.040, 41.104, 0.5],   // Sarıyer
  [28.856, 41.036, 0.55],  // Bağcılar
  [28.930, 40.990, 0.5],   // Zeytinburnu
  [29.230, 40.877, 0.4],   // Pendik / Organized industrial
];

function gaussianJob(
  lng: number,
  lat: number,
  cLng: number,
  cLat: number,
  peak: number,
  sigma = 0.035
): number {
  const dLng = lng - cLng;
  const dLat = lat - cLat;
  const dist2 = dLng * dLng + dLat * dLat;
  return peak * Math.exp(-dist2 / (2 * sigma * sigma));
}

const geojsonPath = join(DATA_DIR, 'istanbul-grid.geojson');
const geojson = JSON.parse(readFileSync(geojsonPath, 'utf-8')) as GeoJSON.FeatureCollection<GeoJSON.Polygon, ZoneProps>;

for (const feature of geojson.features) {
  const { centerLng, centerLat } = feature.properties;
  let jobs = 0;
  for (const [cLng, cLat, peak] of JOB_CENTRES) {
    jobs += gaussianJob(centerLng, centerLat, cLng as number, cLat as number, peak as number);
  }
  feature.properties.jobDensity = Math.min(1, Math.max(0, jobs));
}

writeFileSync(geojsonPath, JSON.stringify(geojson));
console.log(`Bound job density to ${geojson.features.length} zones → ${geojsonPath}`);
