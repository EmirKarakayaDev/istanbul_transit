import { useEffect } from 'react';
import type { GeoJSONSource } from 'mapbox-gl';
import { useMapStore } from '../../store/useMapStore';
import { useSimulationStore } from '../../store/useSimulationStore';
import { useUIStore } from '../../store/useUIStore';

const HEATMAP_SOURCE = 'heatmap-source';
const HEATMAP_LAYER = 'heatmap-layer';

export default function HeatmapLayer() {
  const { map } = useMapStore();
  const { zones, result } = useSimulationStore();
  const { showHeatmap } = useUIStore();

  // Initialize layer — no beforeId dependency to avoid ordering issues
  useEffect(() => {
    if (!map) return;

    const init = () => {
      if (map.getSource(HEATMAP_SOURCE)) return;

      map.addSource(HEATMAP_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: HEATMAP_LAYER,
        type: 'heatmap',
        source: HEATMAP_SOURCE,
        layout: { visibility: 'none' },
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 1, 1],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 8, 0.6, 14, 2.5],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 8, 25, 14, 45],
          'heatmap-opacity': 0.8,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,   'rgba(0,0,0,0)',
            0.15, 'rgba(0,0,255,0.5)',
            0.35, 'rgb(0,176,255)',
            0.55, 'rgb(0,255,170)',
            0.75, 'rgb(255,200,0)',
            0.9,  'rgb(255,100,0)',
            1,    'rgb(255,0,0)',
          ],
        },
      });
    };

    if (map.isStyleLoaded()) {
      init();
    } else {
      map.once('load', init);
    }
  }, [map]);

  // Toggle visibility
  useEffect(() => {
    if (!map) return;
    const apply = () => {
      if (!map.getLayer(HEATMAP_LAYER)) return;
      map.setLayoutProperty(HEATMAP_LAYER, 'visibility', showHeatmap ? 'visible' : 'none');
    };
    if (map.isStyleLoaded()) apply(); else map.once('load', apply);
  }, [map, showHeatmap]);

  // Update heatmap data:
  // - When simulation result exists → show actual ridership per zone
  // - When no result yet          → show population × jobDensity (base demand)
  useEffect(() => {
    if (!map || zones.length === 0) return;

    const source = map.getSource(HEATMAP_SOURCE) as GeoJSONSource | undefined;
    if (!source) return;

    let features: GeoJSON.Feature[];

    if (result && result.zoneRidership.some((z) => z.dailyRiders > 0)) {
      // Ridership mode
      const maxRidership = Math.max(1, ...result.zoneRidership.map((z) => z.dailyRiders));
      const zoneById = new Map(zones.map((z) => [z.id, z]));

      features = result.zoneRidership
        .filter((zr) => zr.dailyRiders > 0)
        .reduce<GeoJSON.Feature[]>((acc, zr) => {
          const zone = zoneById.get(zr.zoneId);
          if (!zone) return acc;
          acc.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: zone.center },
            properties: { weight: zr.dailyRiders / maxRidership },
          });
          return acc;
        }, []);
    } else {
      // Base demand mode — population × jobDensity, only non-zero zones
      const maxScore = Math.max(
        1,
        ...zones.map((z) => z.population * (z.jobDensity + 0.01))
      );

      features = zones
        .filter((z) => z.population > 100)
        .map((z) => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: z.center },
          properties: {
            weight: (z.population * (z.jobDensity + 0.01)) / maxScore,
          },
        }));
    }

    source.setData({ type: 'FeatureCollection', features });
  }, [map, zones, result]);

  return null;
}
