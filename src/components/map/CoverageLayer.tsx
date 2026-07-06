import { useEffect } from 'react';
import type { GeoJSONSource } from 'mapbox-gl';
import { useMapStore } from '../../store/useMapStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useUIStore } from '../../store/useUIStore';
import { STATION_WALK_RADIUS_M } from '../../data/constants';

const COVERAGE_SOURCE = 'coverage-source';
const COVERAGE_FILL = 'coverage-fill';
const COVERAGE_STROKE = 'coverage-stroke';

// Approximate a circle as a GeoJSON Polygon
function circlePolygon(
  center: [number, number],
  radiusM: number,
  steps = 64
): GeoJSON.Polygon {
  const [lng, lat] = center;
  const earthR = 6371000;
  const dLat = (radiusM / earthR) * (180 / Math.PI);
  const dLng = dLat / Math.cos((lat * Math.PI) / 180);
  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    coords.push([lng + dLng * Math.cos(angle), lat + dLat * Math.sin(angle)]);
  }
  return { type: 'Polygon', coordinates: [coords] };
}

export default function CoverageLayer() {
  const { map } = useMapStore();
  const { stations, segments, lines } = useNetworkStore();
  const { showCoverage } = useUIStore();

  // Initialize layers
  useEffect(() => {
    if (!map) return;

    const init = () => {
      if (map.getSource(COVERAGE_SOURCE)) return;

      map.addSource(COVERAGE_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: COVERAGE_FILL,
        type: 'fill',
        source: COVERAGE_SOURCE,
        layout: { visibility: 'visible' },
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.1,
        },
      });

      map.addLayer({
        id: COVERAGE_STROKE,
        type: 'line',
        source: COVERAGE_SOURCE,
        layout: { visibility: 'visible' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 1,
          'line-opacity': 0.4,
          'line-dasharray': [3, 2],
        },
      });
    };

    if (map.isStyleLoaded()) init(); else map.once('load', init);
  }, [map]);

  // Visibility toggle
  useEffect(() => {
    if (!map) return;
    const apply = () => {
      const vis = showCoverage ? 'visible' : 'none';
      if (map.getLayer(COVERAGE_FILL)) map.setLayoutProperty(COVERAGE_FILL, 'visibility', vis);
      if (map.getLayer(COVERAGE_STROKE)) map.setLayoutProperty(COVERAGE_STROKE, 'visibility', vis);
    };
    if (map.isStyleLoaded()) apply(); else map.once('load', apply);
  }, [map, showCoverage]);

  // Update circles when network changes
  useEffect(() => {
    if (!map) return;
    const source = map.getSource(COVERAGE_SOURCE) as GeoJSONSource | undefined;
    if (!source) return;

    // Build station → line color map
    const stationColor = new Map<string, string>();
    for (const line of Object.values(lines)) {
      for (const sid of line.segmentIds) {
        const seg = segments[sid];
        if (seg) {
          stationColor.set(seg.fromStationId, line.color);
          stationColor.set(seg.toStationId, line.color);
        }
      }
    }

    const features: GeoJSON.Feature[] = Object.values(stations).map((sta) => ({
      type: 'Feature',
      geometry: circlePolygon(sta.coordinates, STATION_WALK_RADIUS_M),
      properties: {
        stationId: sta.id,
        color: stationColor.get(sta.id) ?? '#94a3b8',
      },
    }));

    source.setData({ type: 'FeatureCollection', features });
  }, [map, stations, segments, lines]);

  return null;
}
