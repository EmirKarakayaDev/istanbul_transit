import { useEffect, useState } from 'react';
import type { GeoJSONSource, GeoJSONFeature, MapMouseEvent } from 'mapbox-gl';
import { useMapStore } from '../../store/useMapStore';
import { useUIStore } from '../../store/useUIStore';

const SOURCE_ID = 'istanbul-mahalle-boundaries-source';
const FILL_LAYER_ID = 'istanbul-mahalle-boundaries-fill';
const LINE_LAYER_ID = 'istanbul-mahalle-boundaries-line';

interface MahalleFeatureProperties {
  id?: number | string;
  name?: string;
  ad?: string;
  MAHALLE_ADI?: string;
  [key: string]: unknown;
}

export default function MahalleBoundaryLayer() {
  const { map } = useMapStore();
  const { showMahalleBoundaries } = useUIStore();
  const [hasSource, setHasSource] = useState(false);
  const [tooltip, setTooltip] = useState<{ name: string; x: number; y: number } | null>(null);

  // Add source and layers once
  useEffect(() => {
    if (!map) return;

    const init = () => {
      if (map.getSource(SOURCE_ID)) {
        setHasSource(true);
        return;
      }

      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: '/data/istanbul_mahalle_sinir.geojson',
      });

      map.addLayer({
        id: FILL_LAYER_ID,
        type: 'fill',
        source: SOURCE_ID,
        layout: {
          visibility: 'none',
        },
        paint: {
          'fill-color': '#38bdf8',
          'fill-opacity': 0.08,
        },
      });

      map.addLayer({
        id: LINE_LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        layout: {
          visibility: 'none',
        },
        paint: {
          'line-color': '#0ea5e9',
          'line-width': 0.8,
          'line-opacity': 0.9,
        },
      });

      setHasSource(true);
    };

    if (map.isStyleLoaded()) init();
    else map.once('load', init);
  }, [map]);

  // Toggle visibility from UI store
  useEffect(() => {
    if (!map || !hasSource) return;
    const visibility = showMahalleBoundaries ? 'visible' : 'none';
    if (map.getLayer(FILL_LAYER_ID)) {
      map.setLayoutProperty(FILL_LAYER_ID, 'visibility', visibility);
    }
    if (map.getLayer(LINE_LAYER_ID)) {
      map.setLayoutProperty(LINE_LAYER_ID, 'visibility', visibility);
    }
  }, [map, hasSource, showMahalleBoundaries]);

  // Hover tooltip on line layer (daha net seçim için)
  useEffect(() => {
    if (!map || !hasSource) return;

    const getName = (props: MahalleFeatureProperties | undefined): string | null => {
      if (!props) return null;
      return (
        (props.MAHALLE_ADI as string | undefined) ??
        (props.name as string | undefined) ??
        (props.ad as string | undefined) ??
        null
      );
    };

    const onMove = (e: MapMouseEvent & { features?: GeoJSONFeature[] }) => {
      if (!showMahalleBoundaries) {
        setTooltip(null);
        return;
      }
      const f = e.features?.[0];
      const name = getName(f?.properties as MahalleFeatureProperties | undefined);
      if (!name) {
        setTooltip(null);
        return;
      }
      map.getCanvas().style.cursor = 'pointer';
      setTooltip({
        name,
        x: e.point.x,
        y: e.point.y,
      });
    };

    const onLeave = () => {
      map.getCanvas().style.cursor = '';
      setTooltip(null);
    };

    map.on('mousemove', LINE_LAYER_ID, onMove);
    map.on('mouseleave', LINE_LAYER_ID, onLeave);

    return () => {
      map.off('mousemove', LINE_LAYER_ID, onMove);
      map.off('mouseleave', LINE_LAYER_ID, onLeave);
    };
  }, [map, hasSource, showMahalleBoundaries]);

  if (!showMahalleBoundaries || !tooltip) return null;

  return (
    <div
      className="fixed z-40 pointer-events-none bg-slate-900/95 border border-slate-600 rounded-lg shadow-xl px-3 py-1.5 text-xs"
      style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
    >
      <div className="font-semibold text-white">{tooltip.name}</div>
      <div className="text-[10px] text-slate-400 mt-0.5">Mahalle sınırı (test katmanı)</div>
    </div>
  );
}

