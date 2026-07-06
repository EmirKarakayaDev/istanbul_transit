import type { Zone } from '../data/types';

interface GridZoneProps {
  id: string;
  centerLng: number;
  centerLat: number;
  population: number;
  jobDensity: number;
  costMultiplier: number;
}

/**
 * Fetch and parse the pre-generated istanbul-grid.geojson into Zone objects.
 */
export async function loadZones(): Promise<Zone[]> {
  const res = await fetch('/data/istanbul-grid.geojson');
  if (!res.ok) throw new Error(`Failed to load grid data: ${res.status}`);

  const geojson = (await res.json()) as GeoJSON.FeatureCollection<GeoJSON.Polygon, GridZoneProps>;

  return geojson.features.map((f) => ({
    id: f.properties.id,
    geometry: f.geometry,
    center: [f.properties.centerLng, f.properties.centerLat],
    population: f.properties.population,
    jobDensity: f.properties.jobDensity,
    costMultiplier: f.properties.costMultiplier,
  }));
}
