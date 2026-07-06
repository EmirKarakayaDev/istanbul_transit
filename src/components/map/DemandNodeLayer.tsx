import { useEffect, useRef, useState } from 'react';
import type { GeoJSONSource, MapMouseEvent, GeoJSONFeature } from 'mapbox-gl';
import { useMapStore } from '../../store/useMapStore';
import { useSimulationStore } from '../../store/useSimulationStore';
import { useUIStore } from '../../store/useUIStore';

const DEMAND_SOURCE = 'demand-nodes-source';
const DEMAND_LAYER = 'demand-nodes-layer';

interface DemandTooltipData {
  zoneName: string;
  population: number;
  jobDensity: number;
  totalTrips: number;
  transitShare: number;
  drivingShare: number;
  walkingShare: number;
  x: number;
  y: number;
}

export default function DemandNodeLayer() {
  const { map } = useMapStore();
  const { zones, result } = useSimulationStore();
  const { showDemandNodes } = useUIStore();
  const popupRef = useRef<boolean>(false); // placeholder ref
  const [tooltip, setTooltip] = useState<DemandTooltipData | null>(null);

  // Initialize Mapbox layer
  useEffect(() => {
    if (!map) return;

    const init = () => {
      if (map.getSource(DEMAND_SOURCE)) return;

      map.addSource(DEMAND_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Outer glow ring
      map.addLayer({
        id: `${DEMAND_LAYER}-glow`,
        type: 'circle',
        source: DEMAND_SOURCE,
        layout: { visibility: 'none' },
        paint: {
          'circle-radius': ['get', 'radius'],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.12,
          'circle-blur': 0.8,
        },
      });

      // Main demand circle
      map.addLayer({
        id: DEMAND_LAYER,
        type: 'circle',
        source: DEMAND_SOURCE,
        layout: { visibility: 'none' },
        paint: {
          'circle-radius': ['get', 'radius'],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.65,
          'circle-stroke-width': 0.5,
          'circle-stroke-color': ['get', 'color'],
          'circle-stroke-opacity': 0.9,
        },
      });
    };

    if (map.isStyleLoaded()) init(); else map.once('load', init);
  }, [map]);

  // Hover → show tooltip, change cursor
  useEffect(() => {
    if (!map) return;

    const onEnter = (e: MapMouseEvent & { features?: GeoJSONFeature[] }) => {
      map.getCanvas().style.cursor = 'pointer';
      const f = e.features?.[0];
      if (!f || !f.properties) return;
      const p = f.properties as Record<string, number | string>;
      const total = Number(p.totalTrips) || 0;
      const transit = Number(p.transitTrips) || 0;
      const driving = Number(p.drivingTrips) || 0;
      const walking = Number(p.walkingTrips) || 0;
      setTooltip({
        zoneName: String(p.zoneName ?? ''),
        population: Number(p.population) || 0,
        jobDensity: Number(p.jobDensity) || 0,
        totalTrips: total,
        transitShare: total > 0 ? (transit / total) * 100 : 0,
        drivingShare: total > 0 ? (driving / total) * 100 : 0,
        walkingShare: total > 0 ? (walking / total) * 100 : 0,
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
      if (!f || !f.properties) { setTooltip(null); return; }
      setTooltip((prev) => prev ? { ...prev, x: e.point.x, y: e.point.y } : prev);
    };

    map.on('mouseenter', DEMAND_LAYER, onEnter);
    map.on('mouseleave', DEMAND_LAYER, onLeave);
    map.on('mousemove', DEMAND_LAYER, onMove);
    return () => {
      map.off('mouseenter', DEMAND_LAYER, onEnter);
      map.off('mouseleave', DEMAND_LAYER, onLeave);
      map.off('mousemove', DEMAND_LAYER, onMove);
      void popupRef.current;
    };
  }, [map]);

  // Toggle visibility
  useEffect(() => {
    if (!map) return;
    const apply = () => {
      const vis = showDemandNodes ? 'visible' : 'none';
      if (map.getLayer(DEMAND_LAYER)) map.setLayoutProperty(DEMAND_LAYER, 'visibility', vis);
      if (map.getLayer(`${DEMAND_LAYER}-glow`)) map.setLayoutProperty(`${DEMAND_LAYER}-glow`, 'visibility', vis);
    };
    if (map.isStyleLoaded()) apply(); else map.once('load', apply);
  }, [map, showDemandNodes]);

  // Update data
  useEffect(() => {
    if (!map || zones.length === 0) return;
    const source = map.getSource(DEMAND_SOURCE) as GeoJSONSource | undefined;
    if (!source) return;

    // Build mode share lookup from simulation result
    interface ZoneMode {
      totalTrips: number;
      transitTrips: number;
      drivingTrips: number;
      walkingTrips: number;
    }
    const zoneModeMap = new Map<string, ZoneMode>();

    if (result && result.zoneRidership.length > 0) {
      for (const zr of result.zoneRidership) {
        zoneModeMap.set(zr.zoneId, {
          totalTrips: zr.totalTrips,
          transitTrips: zr.transitTrips,
          drivingTrips: zr.drivingTrips,
          walkingTrips: zr.walkingTrips,
        });
      }
    }

    // Scale factor: radius in px = sqrt(totalTrips) * scale
    // Without simulation, use sqrt(population * jobDensity) as proxy
    const MAX_RADIUS = 20;
    const MIN_RADIUS = 3;

    const rawValues = zones
      .filter((z) => z.population > 50)
      .map((z) => {
        const zm = zoneModeMap.get(z.id);
        return zm ? zm.totalTrips : z.population * (z.jobDensity + 0.01);
      });

    const maxRaw = Math.max(1, ...rawValues);

    const features: GeoJSON.Feature[] = zones
      .filter((z) => z.population > 50)
      .map((z) => {
        const zm = zoneModeMap.get(z.id);
        const rawVal = zm ? zm.totalTrips : z.population * (z.jobDensity + 0.01);
        const radius = MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * Math.sqrt(rawVal / maxRaw);

        // Color = mode share blend: red→driving, blue→transit, green→walking
        let color: string;
        if (zm && zm.totalTrips > 0) {
          const tShare = zm.transitTrips / zm.totalTrips;
          const dShare = zm.drivingTrips / zm.totalTrips;
          const wShare = zm.walkingTrips / zm.totalTrips;
          // Dominant mode wins the color
          if (tShare >= dShare && tShare >= wShare) {
            // transit → blue, intensity by share
            const intensity = Math.round(100 + tShare * 155);
            color = `rgb(0,${Math.round(tShare * 150)},${intensity})`;
          } else if (wShare >= dShare) {
            // walking → green
            color = `rgb(0,${Math.round(100 + wShare * 155)},0)`;
          } else {
            // driving → red
            color = `rgb(${Math.round(150 + dShare * 105)},${Math.round(30 * (1 - dShare))},0)`;
          }
        } else {
          // No simulation yet: neutral amber (base demand)
          const intensity = Math.sqrt(rawVal / maxRaw);
          color = `rgb(${Math.round(180 + intensity * 75)},${Math.round(120 + intensity * 60)},0)`;
        }

        return {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: z.center },
          properties: {
            zoneId: z.id,
            zoneName: z.id,
            population: z.population,
            jobDensity: parseFloat(z.jobDensity.toFixed(3)),
            radius,
            color,
            totalTrips: zm?.totalTrips ?? 0,
            transitTrips: zm?.transitTrips ?? 0,
            drivingTrips: zm?.drivingTrips ?? 0,
            walkingTrips: zm?.walkingTrips ?? 0,
          },
        };
      });

    source.setData({ type: 'FeatureCollection', features });
  }, [map, zones, result]);

  // React tooltip overlay
  if (!tooltip) return null;

  const pct = (n: number) => `${n.toFixed(1)}%`;
  const fmt = (n: number) => n.toLocaleString('tr-TR');

  return (
    <div
      className="fixed z-40 pointer-events-none"
      style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
    >
      <div className="bg-slate-900/95 border border-slate-600 rounded-xl shadow-2xl p-3 min-w-[200px] text-xs">
        <div className="font-bold text-slate-200 mb-2 text-sm">{tooltip.zoneName}</div>
        <div className="flex flex-col gap-1 text-slate-400 mb-2">
          <Row label="Population" value={fmt(tooltip.population)} />
          <Row label="Job density" value={pct(tooltip.jobDensity * 100)} />
          <Row label="Daily trips" value={fmt(tooltip.totalTrips)} valueClass="text-white font-semibold" />
        </div>
        {tooltip.totalTrips > 0 && (
          <>
            <div className="w-full h-px bg-slate-700 mb-2" />
            <div className="flex flex-col gap-1">
              <ModeRow label="Transit" share={tooltip.transitShare} color="bg-blue-500" />
              <ModeRow label="Driving" share={tooltip.drivingShare} color="bg-red-500" />
              <ModeRow label="Walking" share={tooltip.walkingShare} color="bg-green-500" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, valueClass = 'text-slate-300' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span>{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

function ModeRow({ label, share, color }: { label: string; share: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`} />
      <span className="text-slate-400 flex-1">{label}</span>
      <span className="text-slate-200 font-medium">{share.toFixed(1)}%</span>
      <div className="w-16 bg-slate-800 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(100, share)}%` }} />
      </div>
    </div>
  );
}
