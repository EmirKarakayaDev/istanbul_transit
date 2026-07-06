import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapStore } from '../../store/useMapStore';
import { useUIStore } from '../../store/useUIStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useGameStore } from '../../store/useGameStore';
import { calculateSegmentCost } from '../../engine/costCalculator';
import { makeLineString } from '../../utils/geo';
import { ISTANBUL_CENTER, ISTANBUL_ZOOM, MAPBOX_STYLE } from '../../data/constants';
import type { TrackType } from '../../data/types';
import StationLayer from './StationLayer';
import TrackLayer from './TrackLayer';
import GhostSegmentLayer from './GhostSegmentLayer';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

export default function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const { setMap, setCursorCoords } = useMapStore();
  const {
    activeTool,
    trackDrawingType,
    pendingTrackFrom,
    activeLineId,
    setPendingTrackFrom,
    setActiveLineId,
    selectStation,
  } = useUIStore();
  const { addStation, addSegment, addSegmentToLine, addLine, stations, removeStation, removeSegment } =
    useNetworkStore();
  const { deductCost } = useGameStore();

  // Refs to avoid stale closures in Mapbox event callbacks
  const activeToolRef = useRef(activeTool);
  const trackDrawingTypeRef = useRef<TrackType>(trackDrawingType);
  const pendingTrackFromRef = useRef<string | null>(pendingTrackFrom);
  const activeLineIdRef = useRef<string | null>(activeLineId);
  const stationsRef = useRef(stations);

  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
  useEffect(() => { trackDrawingTypeRef.current = trackDrawingType; }, [trackDrawingType]);
  useEffect(() => { pendingTrackFromRef.current = pendingTrackFrom; }, [pendingTrackFrom]);
  useEffect(() => { activeLineIdRef.current = activeLineId; }, [activeLineId]);
  useEffect(() => { stationsRef.current = stations; }, [stations]);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const HIDE_LAYER_PATTERNS = [
      'railway',
      'rail',
      'subway',
      'metro',
      'light-rail',
      'tram',
      'aerialway',
      'transit',
      'station',
      'stop',
      'bus',
      'ferry',
      'airport',
      'aeroway',
      'poi',
      'label',
      'admin',
      'boundary',
    ];

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_STYLE,
      center: ISTANBUL_CENTER,
      zoom: ISTANBUL_ZOOM,
      minZoom: 8,
      maxZoom: 19,
      // İstanbul çevresi için pan sınırı (kabaca il sınırları, biraz pay bırakılmış)
      maxBounds: [
        [27.8, 40.7], // south-west
        [30.1, 41.8], // north-east
      ],
      pitch: 0,
      bearing: 0,
      antialias: true,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    map.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.on('mousemove', (e) => setCursorCoords([e.lngLat.lng, e.lngLat.lat]));
    map.on('mouseleave', () => setCursorCoords(null));

    // Base style temizliği: duraklar, raylı sistem, label ve idari sınır katmanlarını gizle
    const STREET_LABEL_PATTERNS = ['road-label', 'street-label', 'road-number-shield'];
    const ROAD_LAYER_PATTERNS = ['road', 'street', 'highway', 'motorway', 'primary', 'secondary'];
    const WATER_LAYER_PATTERNS = ['water', 'ocean', 'river', 'lake'];

    map.on('load', () => {
      const style = map.getStyle();
      if (!style?.layers) return;
      style.layers.forEach((layer) => {
        const id = layer.id.toLowerCase();
          const isStreetLabel = STREET_LABEL_PATTERNS.some((p) => id.includes(p));
          const isRoad = ROAD_LAYER_PATTERNS.some((p) => id.includes(p));
          const isWater = WATER_LAYER_PATTERNS.some((p) => id.includes(p));

          // Sokak isimleri: tamamen kapatma, sadece daha da yakın zoomlarda görünür yap
        if (isStreetLabel && map.getLayer(layer.id)) {
          try {
            map.setLayoutProperty(layer.id, 'visibility', 'visible');
              map.setLayerZoomRange(layer.id, 15, 24); // çok yakın zoom seviyelerinde
          } catch {
            // ignore
          }
          return;
        }

          // Yol katmanları: en uzak zoomlarda gizle (yalnızca daha yakında göster)
          if (isRoad && map.getLayer(layer.id)) {
            try {
              const min = 10; // bu zoomdan sonra yollar görünsün
              const max = 24;
              map.setLayerZoomRange(layer.id, min, max);
            } catch {
              // ignore
            }
          }

          // Su katmanları: her zaman mavi tonda olsun
          if (isWater && map.getLayer(layer.id)) {
            try {
              // Daha sakin, koyu mavi ton
              map.setPaintProperty(layer.id, 'fill-color' as any, '#0369a1');
            } catch {
              // some water layers may be line-only
            }
            try {
              map.setPaintProperty(layer.id, 'line-color' as any, '#0369a1');
            } catch {
              // ignore
            }
          }

        const shouldHide = HIDE_LAYER_PATTERNS.some((p) => id.includes(p));
        if (shouldHide && map.getLayer(layer.id)) {
          try {
            map.setLayoutProperty(layer.id, 'visibility', 'none');
          } catch {
            // bazı layer tiplerinde visibility olmayabilir; sessiz geç
          }
        }
      });
    });

    map.on('click', (e) => {
      if (activeToolRef.current !== 'station') return;
      const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      const stationName = `İstasyon ${Object.keys(stationsRef.current).length + 1}`;
      addStation({ name: stationName, coordinates: coords, type: trackDrawingTypeRef.current, zoneId: null });
    });

    mapRef.current = map;
    setMap(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cursor style
  useEffect(() => {
    const canvas = mapRef.current?.getCanvas();
    if (!canvas) return;
    switch (activeTool) {
      case 'station':  canvas.style.cursor = 'crosshair'; break;
      case 'track':    canvas.style.cursor = pendingTrackFrom ? 'cell' : 'crosshair'; break;
      case 'demolish': canvas.style.cursor = 'not-allowed'; break;
      default:         canvas.style.cursor = '';
    }
  }, [activeTool, pendingTrackFrom]);

  // Ensure activeLineId still exists in the store (deleted line → clear)
  useEffect(() => {
    if (!activeLineId) return;
    const exists = !!useNetworkStore.getState().lines[activeLineId];
    if (!exists) setActiveLineId(null);
  }, [activeLineId, setActiveLineId]);

  /** Resolve the current active line. If none exists, create one automatically. */
  const resolveActiveLine = (): string => {
    const currentId = activeLineIdRef.current;
    const lines = useNetworkStore.getState().lines;

    // If current activeLineId is valid, reuse it
    if (currentId && lines[currentId]) return currentId;

    // Create a new line automatically
    const lineCount = Object.keys(lines).length;
    const newLineId = addLine(`Hat ${lineCount + 1}`);
    setActiveLineId(newLineId);
    return newLineId;
  };

  const handleStationClick = (stationId: string) => {
    const tool = activeToolRef.current;

    if (tool === 'select') {
      selectStation(stationId);
      return;
    }

    if (tool === 'demolish') {
      removeStation(stationId);
      return;
    }

    if (tool === 'track') {
      const fromId = pendingTrackFromRef.current;
      if (!fromId) {
        setPendingTrackFrom(stationId);
        return;
      }
      if (fromId === stationId) {
        setPendingTrackFrom(null);
        return;
      }

      const fromSta = stationsRef.current[fromId];
      const toSta = stationsRef.current[stationId];
      if (!fromSta || !toSta) return;

      const trackType = trackDrawingTypeRef.current;
      const { total, distance } = calculateSegmentCost(fromSta.coordinates, toSta.coordinates, trackType);

      if (!deductCost(total)) {
        setPendingTrackFrom(null);
        return;
      }

      const segmentId = addSegment({
        fromStationId: fromId,
        toStationId: stationId,
        type: trackType,
        geometry: makeLineString(fromSta.coordinates, toSta.coordinates),
        cost: total,
        distance,
      });

      // Assign segment to active line (auto-create if needed)
      const lineId = resolveActiveLine();
      addSegmentToLine(lineId, segmentId);

      setPendingTrackFrom(stationId);
    }
  };

  const handleSegmentClick = (segmentId: string) => {
    if (activeToolRef.current === 'demolish') {
      const seg = useNetworkStore.getState().segments[segmentId];
      if (seg) {
        useGameStore.getState().addCost(seg.cost);
        removeSegment(segmentId);
      }
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <StationLayer onStationClick={handleStationClick} />
      <TrackLayer onSegmentClick={handleSegmentClick} />
      <GhostSegmentLayer />
    </div>
  );
}
