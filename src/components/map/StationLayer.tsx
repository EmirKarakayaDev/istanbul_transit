import { useEffect } from 'react';
import type { GeoJSONSource, GeoJSONFeature, MapMouseEvent } from 'mapbox-gl';
import { useMapStore } from '../../store/useMapStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useUIStore } from '../../store/useUIStore';
import type { StationFeature } from '../../data/types';

const STATION_SOURCE = 'stations-source';
const STATION_LAYER = 'stations-layer';
const STATION_LABEL_LAYER = 'stations-label-layer';
const PENDING_LAYER = 'stations-pending-layer';

const TYPE_COLORS: Record<string, string> = {
  surface: '#22c55e',
  elevated: '#f59e0b',
  underground: '#3b82f6',
};

interface Props {
  onStationClick: (stationId: string) => void;
}

export default function StationLayer({ onStationClick }: Props) {
  const { map } = useMapStore();
  const { stations } = useNetworkStore();
  const { pendingTrackFrom, selectedStationId } = useUIStore();

  // Initialize layers once the map is ready
  useEffect(() => {
    if (!map) return;

    const init = (): (() => void) => {
      if (!map.getSource(STATION_SOURCE)) {
        map.addSource(STATION_SOURCE, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });

        map.addLayer({
          id: PENDING_LAYER,
          type: 'circle',
          source: STATION_SOURCE,
          filter: ['==', ['get', 'id'], ''],
          paint: {
            'circle-radius': 22,
            'circle-color': '#ffffff',
            'circle-opacity': 0.35,
            'circle-stroke-width': 3,
            'circle-stroke-color': '#60a5fa',
            'circle-stroke-opacity': 0.9,
          },
        });

        map.addLayer({
          id: STATION_LAYER,
          type: 'circle',
          source: STATION_SOURCE,
          paint: {
            'circle-radius': [
              'interpolate', ['linear'], ['zoom'],
              8, 4,
              12, 7,
              16, 10,
            ],
            'circle-color': [
              'match',
              ['get', 'type'],
              'surface', TYPE_COLORS.surface,
              'elevated', TYPE_COLORS.elevated,
              'underground', TYPE_COLORS.underground,
              '#94a3b8',
            ],
            'circle-stroke-width': [
              'case', ['==', ['get', 'id'], selectedStationId ?? ''], 3, 1.5,
            ],
            'circle-stroke-color': '#ffffff',
          },
        });

        map.addLayer({
          id: STATION_LABEL_LAYER,
          type: 'symbol',
          source: STATION_SOURCE,
          minzoom: 12,
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 11,
            'text-offset': [0, 1.4],
            'text-anchor': 'top',
          },
          paint: {
            'text-color': '#e2e8f0',
            'text-halo-color': '#0f172a',
            'text-halo-width': 1.5,
          },
        });
      }

      // Click handler
      const handleClick = (e: MapMouseEvent & { features?: GeoJSONFeature[] }) => {
        if (!e.features?.length) return;
        const id = e.features[0].properties?.id as string;
        if (id) onStationClick(id);
      };

      map.on('click', STATION_LAYER, handleClick);
      return () => { map.off('click', STATION_LAYER, handleClick); };
    };

    let cleanup: (() => void) | undefined;
    if (map.isStyleLoaded()) {
      cleanup = init();
    } else {
      map.once('load', () => { cleanup = init(); });
    }
    return () => { cleanup?.(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // Update GeoJSON data when stations change
  useEffect(() => {
    const source = map?.getSource(STATION_SOURCE) as GeoJSONSource | undefined;
    if (!source) return;

    const features: StationFeature[] = Object.values(stations).map((sta) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: sta.coordinates },
      properties: sta,
    }));

    source.setData({ type: 'FeatureCollection', features });
  }, [map, stations]);

  // Update pending highlight filter
  useEffect(() => {
    if (!map || !map.getLayer(PENDING_LAYER)) return;
    map.setFilter(PENDING_LAYER, ['==', ['get', 'id'], pendingTrackFrom ?? '']);
  }, [map, pendingTrackFrom]);

  // Update selected stroke
  useEffect(() => {
    if (!map || !map.getLayer(STATION_LAYER)) return;
    map.setPaintProperty(STATION_LAYER, 'circle-stroke-width', [
      'case', ['==', ['get', 'id'], selectedStationId ?? ''], 3, 1.5,
    ]);
  }, [map, selectedStationId]);

  return null;
}
