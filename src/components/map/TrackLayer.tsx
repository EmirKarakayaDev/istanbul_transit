import { useEffect } from 'react';
import type { GeoJSONSource, GeoJSONFeature, MapMouseEvent } from 'mapbox-gl';
import { useMapStore } from '../../store/useMapStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import type { SegmentFeature } from '../../data/types';

const TRACK_SOURCE = 'tracks-source';
const TRACK_LAYER = 'tracks-layer';
const TRACK_CASING_LAYER = 'tracks-casing-layer';

const TYPE_DASH: Record<string, number[]> = {
  surface: [4, 2],
  elevated: [8, 0],
  underground: [8, 0],
};

interface Props {
  onSegmentClick: (segmentId: string) => void;
}

export default function TrackLayer({ onSegmentClick }: Props) {
  const { map } = useMapStore();
  const { segments, lines } = useNetworkStore();

  // Initialize layers
  useEffect(() => {
    if (!map) return;

    const init = (): (() => void) => {
      if (!map.getSource(TRACK_SOURCE)) {
        map.addSource(TRACK_SOURCE, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });

        // Casing (dark outline under the colored line)
        map.addLayer(
          {
            id: TRACK_CASING_LAYER,
            type: 'line',
            source: TRACK_SOURCE,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': '#0f172a',
              'line-width': [
                'interpolate', ['linear'], ['zoom'],
                8, 4,
                14, 9,
              ],
            },
          },
          'stations-layer' // insert below station layer
        );

        map.addLayer(
          {
            id: TRACK_LAYER,
            type: 'line',
            source: TRACK_SOURCE,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': ['get', 'lineColor'],
              'line-width': [
                'interpolate', ['linear'], ['zoom'],
                8, 2.5,
                14, 5,
              ],
            },
          },
          'stations-layer'
        );
      }

      const handleClick = (e: MapMouseEvent & { features?: GeoJSONFeature[] }) => {
        if (!e.features?.length) return;
        const id = e.features[0].properties?.id as string;
        if (id) onSegmentClick(id);
      };

      map.on('click', TRACK_LAYER, handleClick);
      return () => { map.off('click', TRACK_LAYER, handleClick); };
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

  // Update GeoJSON when segments or lines change
  useEffect(() => {
    const source = map?.getSource(TRACK_SOURCE) as GeoJSONSource | undefined;
    if (!source) return;

    // Build a segment → line color map
    const segmentColor = new Map<string, string>();
    for (const line of Object.values(lines)) {
      for (const sid of line.segmentIds) {
        segmentColor.set(sid, line.color);
      }
    }

    const features: SegmentFeature[] = Object.values(segments).map((seg) => ({
      type: 'Feature',
      geometry: seg.geometry,
      properties: {
        ...seg,
        lineColor: segmentColor.get(seg.id) ?? '#94a3b8',
        lineDash: TYPE_DASH[seg.type] ?? [8, 0],
      },
    }));

    source.setData({ type: 'FeatureCollection', features });
  }, [map, segments, lines]);

  return null;
}
