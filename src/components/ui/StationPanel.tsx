import { useState, useEffect, useRef } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useSimulationStore } from '../../store/useSimulationStore';
import { haversineKm } from '../../utils/geo';
import { STATION_WALK_RADIUS_M } from '../../data/constants';

const WALK_RADIUS_KM = STATION_WALK_RADIUS_M / 1000;

export default function StationPanel() {
  const { selectedStationId, clearSelection } = useUIStore();
  const { stations, segments, lines, updateStation } = useNetworkStore();
  const { zones, result } = useSimulationStore();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const station = selectedStationId ? stations[selectedStationId] : null;

  useEffect(() => {
    if (station) setDraft(station.name);
  }, [station?.id, station?.name]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (!station) return null;

  // Lines passing through this station
  const lineIds = new Set<string>();
  for (const line of Object.values(lines)) {
    for (const segId of line.segmentIds) {
      const seg = segments[segId];
      if (seg && (seg.fromStationId === station.id || seg.toStationId === station.id)) {
        lineIds.add(line.id);
        break;
      }
    }
  }
  const stationLines = Object.values(lines).filter((l) => lineIds.has(l.id));

  // Coverage: population within 500m
  let coveragePopulation = 0;
  for (const z of zones) {
    if (haversineKm(station.coordinates, z.center) <= WALK_RADIUS_KM) {
      coveragePopulation += z.population;
    }
  }

  // Ridership for this station's "zone" — nearest zone's daily riders from result
  let zoneRidership = 0;
  if (result) {
    let nearestZoneId: string | null = null;
    let nearestDist = Infinity;
    for (const z of zones) {
      const d = haversineKm(station.coordinates, z.center);
      if (d < nearestDist) {
        nearestDist = d;
        nearestZoneId = z.id;
      }
    }
    if (nearestZoneId) {
      const zr = result.zoneRidership.find((r) => r.zoneId === nearestZoneId);
      if (zr) zoneRidership = zr.dailyRiders;
    }
  }

  const commitRename = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== station.name) updateStation(station.id, { name: trimmed });
    else setDraft(station.name);
    setEditing(false);
  };

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-72 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">İstasyon</span>
        <button
          onClick={clearSelection}
          className="text-slate-500 hover:text-white transition-colors text-sm"
          title="Kapat"
        >
          ✕
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Name */}
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Ad</label>
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') {
                  setDraft(station.name);
                  setEditing(false);
                }
              }}
              className="w-full bg-slate-800 text-white text-sm px-3 py-2 rounded-lg border border-slate-600 outline-none focus:border-blue-500"
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="w-full text-left text-white font-semibold text-base px-0 py-1 hover:text-blue-400 transition-colors"
            >
              {station.name}
              <span className="text-slate-500 text-xs ml-2">(düzenle)</span>
            </button>
          )}
        </div>

        {/* Type */}
        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Tip</span>
          <p className="text-slate-300 text-sm mt-0.5">
            {station.type === 'surface' ? 'Yüzey' : station.type === 'elevated' ? 'Viyadük' : 'Tünel'}
          </p>
        </div>

        {/* Lines */}
        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Hatlar</span>
          {stationLines.length === 0 ? (
            <p className="text-slate-500 text-sm mt-0.5">Hat yok</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {stationLines.map((l) => (
                <span
                  key={l.id}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium text-white"
                  style={{ backgroundColor: l.color + '40', borderLeft: `3px solid ${l.color}` }}
                >
                  {l.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Coverage population */}
        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Kapsanan nüfus (500m)</span>
          <p className="text-emerald-400 font-semibold text-sm mt-0.5">
            {coveragePopulation.toLocaleString('tr-TR')}
          </p>
        </div>

        {/* Ridership (nearest zone) */}
        {result && (
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Bölge yolcu (günlük)</span>
            <p className="text-blue-400 font-semibold text-sm mt-0.5">
              {zoneRidership.toLocaleString('tr-TR')}
            </p>
          </div>
        )}

        {/* Coords */}
        <div className="text-[10px] text-slate-600 pt-2 border-t border-slate-800">
          {station.coordinates[1].toFixed(4)}, {station.coordinates[0].toFixed(4)}
        </div>
      </div>
    </div>
  );
}
