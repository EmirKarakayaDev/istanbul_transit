import { useEffect, useState } from 'react';
import type { GeoJSONSource, GeoJSONFeature, MapMouseEvent } from 'mapbox-gl';
import { useMapStore } from '../../store/useMapStore';
import { useUIStore } from '../../store/useUIStore';
import { loadIlceMahalle, type IlceMahallePoint } from '../../utils/loadIlceMahalle';

const SOURCE_ID = 'ilce-mahalle-source';
const LAYER_ID = 'ilce-mahalle-layer';

function pointsToFeatures(points: IlceMahallePoint[]): GeoJSON.Feature<GeoJSON.Point, Record<string, unknown>>[] {
  return points.map((p) => ({
    type: 'Feature' as const,
    geometry: { type: 'Point' as const, coordinates: p.coordinates },
    properties: {
      id: p.id,
      name: p.name,
      type: p.type,
      population: p.population,
      districtName: p.districtName ?? '',
    },
  }));
}

export default function IlceMahalleLayer() {
  const { map } = useMapStore();
  const { showIlceMahalle } = useUIStore();
  const [points, setPoints] = useState<IlceMahallePoint[]>([]);
  const [tooltip, setTooltip] = useState<{ name: string; type: string; population: number; x: number; y: number } | null>(null);

  // Load data once
  useEffect(() => {
    loadIlceMahalle()
      .then((loaded) => {
        if (loaded.length > 0) setPoints(loaded);
      })
      .catch((err) => console.error('İlçe/mahalle yükleme hatası:', err));
  }, []);

  // Init Mapbox source + layer (when we have points)
  useEffect(() => {
    if (!map || !points.length) return;

    const init = () => {
      if (map.getSource(SOURCE_ID)) return;

      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: pointsToFeatures(points) },
      });

      map.addLayer({
        id: LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        layout: { visibility: 'none' },
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['sqrt', ['get', 'population']],
            0, 4, 30, 8, 100, 12, 200, 18, 400, 24, 600, 32, 670, 40,
          ],
          'circle-color': ['match', ['get', 'type'], 'ilce', '#818cf8', 'mahalle', '#38bdf8', '#94a3b8'],
          'circle-opacity': 0.55,
          'circle-stroke-width': ['match', ['get', 'type'], 'ilce', 2.5, 'mahalle', 1, 1],
          'circle-stroke-color': '#1e293b',
          'circle-stroke-opacity': 0.9,
        },
      });
    };

    if (map.isStyleLoaded()) init();
    else map.once('load', init);
  }, [map, points.length]);

  // Sync source when points change (initial load only; data is read-only)
  useEffect(() => {
    if (!map || !points.length) return;
    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    if (!source) return;
    source.setData({ type: 'FeatureCollection', features: pointsToFeatures(points) });
  }, [map, points]);

  // Visibility
  useEffect(() => {
    if (!map || !map.getLayer(LAYER_ID)) return;
    map.setLayoutProperty(LAYER_ID, 'visibility', showIlceMahalle ? 'visible' : 'none');
  }, [map, showIlceMahalle]);

  // Hover tooltip
  useEffect(() => {
    if (!map) return;

    const onEnter = (e: MapMouseEvent & { features?: GeoJSONFeature[] }) => {
      map.getCanvas().style.cursor = 'pointer';
      const f = e.features?.[0];
      if (!f?.properties) return;
      const p = f.properties as Record<string, string | number>;
      setTooltip({
        name: String(p.name),
        type: p.type === 'ilce' ? 'İlçe' : 'Mahalle',
        population: Number(p.population),
        x: e.point.x,
        y: e.point.y,
      });
    };

    const onLeave = () => {
      map.getCanvas().style.cursor = '';
      setTooltip(null);
    };

    const onMove = (e: MapMouseEvent & { features?: GeoJSONFeature[] }) => {
      const f = e.features?.[0];
      if (!f?.properties) {
        setTooltip(null);
        return;
      }
      const p = f.properties as Record<string, string | number>;
      setTooltip({
        name: String(p.name),
        type: p.type === 'ilce' ? 'İlçe' : 'Mahalle',
        population: Number(p.population),
        x: e.point.x,
        y: e.point.y,
      });
    };

    map.on('mouseenter', LAYER_ID, onEnter);
    map.on('mouseleave', LAYER_ID, onLeave);
    map.on('mousemove', LAYER_ID, onMove);

    return () => {
      map.off('mouseenter', LAYER_ID, onEnter);
      map.off('mouseleave', LAYER_ID, onLeave);
      map.off('mousemove', LAYER_ID, onMove);
    };
  }, [map]);

  if (!points.length) return null;

  return (
    <>
      {tooltip && (
        <div
          className="fixed z-40 pointer-events-none bg-slate-900/95 border border-slate-600 rounded-lg shadow-xl px-3 py-2 text-xs"
          style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
        >
          <div className="font-semibold text-white">{tooltip.name}</div>
          <div className="text-slate-400">{tooltip.type}</div>
          <div className="text-emerald-400 font-medium mt-0.5">
            Nüfus: {tooltip.population.toLocaleString('tr-TR')}
          </div>
        </div>
      )}
    </>
  );
}
