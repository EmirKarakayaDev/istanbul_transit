import { useMapStore } from '../../store/useMapStore';
import { useUIStore } from '../../store/useUIStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useGameStore } from '../../store/useGameStore';
import { calculateSegmentCost } from '../../engine/costCalculator';
import { formatTL } from '../../utils/geo';

export default function CostDisplay() {
  const { cursorCoords } = useMapStore();
  const { activeTool, pendingTrackFrom, trackDrawingType } = useUIStore();
  const { stations } = useNetworkStore();
  const { mode, budget, spent } = useGameStore();

  const remaining = budget - spent;

  let previewCost: number | null = null;
  let previewDist: number | null = null;
  let historicWarning = false;
  let bosphorusWarning = false;

  if (
    activeTool === 'track' &&
    pendingTrackFrom &&
    cursorCoords
  ) {
    const fromSta = stations[pendingTrackFrom];
    if (fromSta) {
      const factors = calculateSegmentCost(fromSta.coordinates, cursorCoords, trackDrawingType);
      previewCost = factors.total;
      previewDist = factors.distance;
      historicWarning = factors.historicMultiplier > 1;
      bosphorusWarning = factors.bosphorusMultiplier > 1;
    }
  }

  const hasPreview = previewCost !== null;

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
      <div className="bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-4 text-sm">
        {/* Budget remaining */}
        {mode !== 'sandbox' && (
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-500 uppercase tracking-wide">Remaining</span>
            <span className={`font-bold tabular-nums ${remaining < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {formatTL(remaining)}
            </span>
          </div>
        )}

        {mode !== 'sandbox' && <div className="w-px h-8 bg-slate-700" />}

        {/* Total spent */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-slate-500 uppercase tracking-wide">Spent</span>
          <span className="font-bold tabular-nums text-slate-300">{formatTL(spent)}</span>
        </div>

        {/* Live preview */}
        {hasPreview && (
          <>
            <div className="w-px h-8 bg-slate-700" />
            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-500 uppercase tracking-wide">Segment cost</span>
              <span className="font-bold tabular-nums text-yellow-400">{formatTL(previewCost!)}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-500 uppercase tracking-wide">Distance</span>
              <span className="font-bold tabular-nums text-slate-300">{previewDist!.toFixed(2)} km</span>
            </div>
            {historicWarning && (
              <span className="text-xs text-orange-400 font-medium">⚠ Historic area ×2.5</span>
            )}
            {bosphorusWarning && (
              <span className="text-xs text-purple-400 font-medium">⚠ Bosphorus crossing</span>
            )}
          </>
        )}

        {/* Cursor coords */}
        {cursorCoords && (
          <>
            <div className="w-px h-8 bg-slate-700" />
            <span className="text-xs text-slate-600 tabular-nums">
              {cursorCoords[1].toFixed(4)}, {cursorCoords[0].toFixed(4)}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
