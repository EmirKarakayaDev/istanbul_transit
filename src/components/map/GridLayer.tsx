import { useEffect } from 'react';
import type { GeoJSONSource } from 'mapbox-gl';
import { useMapStore } from '../../store/useMapStore';
import { useSimulationStore } from '../../store/useSimulationStore';
import { useUIStore } from '../../store/useUIStore';

const GRID_SOURCE = 'grid-source';
const GRID_FILL_LAYER = 'grid-fill-layer';
const GRID_LINE_LAYER = 'grid-line-layer';

export default function GridLayer() {
  const { map } = useMapStore();
  const { zones, result } = useSimulationStore();
  const { showGrid } = useUIStore();

  // Initialize
  useEffect(() => {
    if (!map) return;

    const init = () => {
      if (!map.getSource(GRID_SOURCE)) {
        map.addSource(GRID_SOURCE, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });

        map.addLayer({
          id: GRID_FILL_LAYER,
          type: 'fill',
          source: GRID_SOURCE,
          layout: { visibility: 'none' },
          paint: {
            'fill-color': [
              'interpolate',
              ['linear'],
              ['get', 'ridership'],
              0,    'rgba(59,130,246,0)',
              100,  'rgba(59,130,246,0.15)',
              1000, 'rgba(239,68,68,0.4)',
            ],
            'fill-opacity': 0.8,
          },
        });

        map.addLayer({
          id: GRID_LINE_LAYER,
          type: 'line',
          source: GRID_SOURCE,
          layout: { visibility: 'none' },
          paint: {
            'line-color': 'rgba(148,163,184,0.15)',
            'line-width': 0.5,
          },
        });
      }
    };

    if (map.isStyleLoaded()) {
      init();
    } else {
      map.once('load', init);
    }
  }, [map]);

  // Update visibility
  useEffect(() => {
    if (!map) return;
    const setVis = () => {
      if (map.getLayer(GRID_FILL_LAYER)) {
        map.setLayoutProperty(GRID_FILL_LAYER, 'visibility', showGrid ? 'visible' : 'none');
      }
      if (map.getLayer(GRID_LINE_LAYER)) {
        map.setLayoutProperty(GRID_LINE_LAYER, 'visibility', showGrid ? 'visible' : 'none');
      }
    };
    if (map.isStyleLoaded()) setVis(); else map.once('load', setVis);
  }, [map, showGrid]);

  // Update data when zones or simulation result changes
  useEffect(() => {
    if (!map || zones.length === 0) return;
    const source = map.getSource(GRID_SOURCE) as GeoJSONSource | undefined;
    if (!source) return;

    const ridershipMap = new Map<string, number>();
    const coveredSet = new Set<string>();
    if (result) {
      for (const zr of result.zoneRidership) {
        ridershipMap.set(zr.zoneId, zr.dailyRiders);
        if (zr.coveredByNetwork) coveredSet.add(zr.zoneId);
      }
    }

    const features = zones.map((zone) => ({
      type: 'Feature' as const,
      geometry: zone.geometry,
      properties: {
        id: zone.id,
        ridership: ridershipMap.get(zone.id) ?? 0,
        population: zone.population,
        covered: coveredSet.has(zone.id),
      },
    }));

    source.setData({ type: 'FeatureCollection', features });
  }, [map, zones, result]);

  return null;
}
