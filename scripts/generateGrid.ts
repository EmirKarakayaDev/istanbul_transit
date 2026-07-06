/**
 * generateGrid.ts
 *
 * Splits the Istanbul bounding box into 500m × 500m grid cells
 * and writes a GeoJSON FeatureCollection to public/data/istanbul-grid.geojson
 *
 * Run with: npx tsx scripts/generateGrid.ts
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const BBOX: [number, number, number, number] = [28.6, 40.8, 29.5, 41.3];
const CELL_SIZE_KM = 0.5; // 500m

// Approximate degrees per km at Istanbul latitude (~41°N)
const DEG_LAT_PER_KM = 1 / 111.0;
const DEG_LNG_PER_KM = 1 / (111.0 * Math.cos((41 * Math.PI) / 180));

const cellLat = CELL_SIZE_KM * DEG_LAT_PER_KM;
const cellLng = CELL_SIZE_KM * DEG_LNG_PER_KM;

interface ZoneProperties {
  id: string;
  centerLng: number;
  centerLat: number;
  population: number;
  jobDensity: number;
  costMultiplier: number;
}

const features: GeoJSON.Feature<GeoJSON.Polygon, ZoneProperties>[] = [];

let rowIndex = 0;
for (let lat = BBOX[1]; lat < BBOX[3]; lat += cellLat) {
  let colIndex = 0;
  for (let lng = BBOX[0]; lng < BBOX[2]; lng += cellLng) {
    const id = `z_${rowIndex}_${colIndex}`;
    const minLat = lat;
    const maxLat = lat + cellLat;
    const minLng = lng;
    const maxLng = lng + cellLng;
    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [minLng, minLat],
          [maxLng, minLat],
          [maxLng, maxLat],
          [minLng, maxLat],
          [minLng, minLat],
        ]],
      },
      properties: {
        id,
        centerLng,
        centerLat,
        population: 0,       // filled by bindPopulation.ts
        jobDensity: 0,        // filled by bindJobs.ts
        costMultiplier: 1.0,  // filled by buildCostSurface.ts
      },
    });
    colIndex++;
  }
  rowIndex++;
}

const geojson: GeoJSON.FeatureCollection<GeoJSON.Polygon, ZoneProperties> = {
  type: 'FeatureCollection',
  features,
};

const outDir = join(process.cwd(), 'public', 'data');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'istanbul-grid.geojson');
writeFileSync(outPath, JSON.stringify(geojson));

console.log(`Generated ${features.length} grid cells → ${outPath}`);
