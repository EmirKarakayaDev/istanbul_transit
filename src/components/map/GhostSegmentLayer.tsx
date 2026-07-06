import { useEffect } from 'react';
import type { GeoJSONSource } from 'mapbox-gl';
import { useMapStore } from '../../store/useMapStore';
import { useUIStore } from '../../store/useUIStore';
import { useNetworkStore } from '../../store/useNetworkStore';

const GHOST_SOURCE = 'ghost-segment-source';
const GHOST_LAYER = 'ghost-segment-layer';

export default function GhostSegmentLayer() {
  const { map, cursorCoords } = useMapStore();
  const { activeTool, pendingTrackFrom, activeLineId } = useUIStore();
  const { stations, lines } = useNetworkStore();

  const showGhost =
    activeTool === 'track' &&
    pendingTrackFrom &&
    cursorCoords &&
    stations[pendingTrackFrom] &&
    activeLineId &&
    lines[activeLineId];

  // Init layer
  useEffect(() => {
    if (!map) return;

    const init = () => {
      if (map.getSource(GHOST_SOURCE)) return;

      map.addSource(GHOST_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: GHOST_LAYER,
        type: 'line',
        source: GHOST_SOURCE,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 4,
          'line-opacity': 0.7,
          'line-dasharray': [2, 2],
        },
      });
    };

    if (map.isStyleLoaded()) init();
    else map.once('load', init);
  }, [map]);

  // Update ghost line
  useEffect(() => {
    if (!map) return;
    const source = map.getSource(GHOST_SOURCE) as GeoJSONSource | undefined;
    if (!source) return;

    if (!showGhost) {
      source.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    const from = stations[pendingTrackFrom!].coordinates;
    const to = cursorCoords!;
    const color = lines[activeLineId!].color;

    source.setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: [from, to] },
          properties: { color },
        },
      ],
    });
  }, [map, showGhost, pendingTrackFrom, cursorCoords, activeLineId, stations, lines]);

  // Hide layer when not drawing
  useEffect(() => {
    if (!map || !map.getLayer(GHOST_LAYER)) return;
    map.setLayoutProperty(
      GHOST_LAYER,
      'visibility',
      showGhost ? 'visible' : 'none'
    );
  }, [map, showGhost]);

  return null;
}
