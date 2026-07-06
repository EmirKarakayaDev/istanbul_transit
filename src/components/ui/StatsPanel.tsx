import { useUIStore } from '../../store/useUIStore';
import { useSimulationStore } from '../../store/useSimulationStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useGameStore } from '../../store/useGameStore';
import { formatNumber, formatTL } from '../../utils/geo';

export default function StatsPanel() {
  const { showStats, toggleStats } = useUIStore();
  const { result, isRunning } = useSimulationStore();
  const { stations, segments, lines } = useNetworkStore();
  const { mode, budget, spent, score, scenario } = useGameStore();

  const stationCount = Object.keys(stations).length;
  const segmentCount = Object.keys(segments).length;
  const lineCount = Object.keys(lines).length;

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 w-64">
      <button
        onClick={toggleStats}
        className="flex items-center justify-between bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300 hover:text-white transition-colors"
      >
        <span className="font-semibold">Statistics</span>
        <span>{showStats ? '▲' : '▼'}</span>
      </button>

      {showStats && (
        <div className="bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl p-3 flex flex-col gap-3 text-sm">
          {/* Game mode */}
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
              mode === 'sandbox' ? 'bg-slate-700 text-slate-300' :
              mode === 'budget' ? 'bg-blue-900 text-blue-300' :
              'bg-purple-900 text-purple-300'
            }`}>
              {mode}
            </span>
            {mode !== 'sandbox' && (
              <span className="text-slate-400 text-xs">
                Budget: {formatTL(budget)}
              </span>
            )}
          </div>

          {/* Scenario progress */}
          {scenario && result && (
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Target Riders</span>
                <span>{formatNumber(scenario.targetRiders)}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (result.totalDailyRidership / scenario.targetRiders) * 100)}%`,
                  }}
                />
              </div>
              <div className="text-right text-xs text-blue-400 mt-0.5">
                {formatNumber(result.totalDailyRidership)} riders
              </div>
            </div>
          )}

          {/* Network stats */}
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Stations" value={stationCount} />
            <Stat label="Segments" value={segmentCount} />
            <Stat label="Lines" value={lineCount} />
          </div>

          <div className="w-full h-px bg-slate-800" />

          {/* Cost */}
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Total Cost" value={formatTL(spent)} />
            {mode !== 'sandbox' && (
              <Stat
                label="Remaining"
                value={formatTL(budget - spent)}
                valueClass={(budget - spent) < 0 ? 'text-red-400' : 'text-emerald-400'}
              />
            )}
          </div>

          {/* Simulation */}
          {isRunning && (
            <div className="flex items-center gap-2 text-xs text-blue-400">
              <span className="animate-spin">◌</span>
              Running simulation…
            </div>
          )}

          {result && (
            <>
              <div className="w-full h-px bg-slate-800" />
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Transit Riders" value={formatNumber(result.totalDailyRidership)} valueClass="text-blue-400" />
                <Stat
                  label="Coverage"
                  value={`${result.coveragePercent.toFixed(1)}%`}
                  valueClass="text-emerald-400"
                />
                <Stat
                  label="Time Saved"
                  value={`${result.avgCommuteTimeSaved.toFixed(0)} min`}
                  valueClass="text-blue-400"
                />
                <Stat label="Score" value={formatNumber(score)} valueClass="text-yellow-400" />
              </div>

              {/* Mode share bar */}
              <div className="w-full h-px bg-slate-800" />
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wide">Mode Share</span>
                <div className="flex w-full h-2.5 rounded-full overflow-hidden mt-1.5 gap-px">
                  <div
                    className="bg-blue-500 h-full"
                    style={{ width: `${result.transitSharePercent}%` }}
                    title={`Transit: ${result.transitSharePercent.toFixed(1)}%`}
                  />
                  <div
                    className="bg-green-500 h-full"
                    style={{
                      width: `${
                        result.totalDailyRidership + result.totalDrivingTrips + result.totalWalkingTrips > 0
                          ? (result.totalWalkingTrips / (result.totalDailyRidership + result.totalDrivingTrips + result.totalWalkingTrips)) * 100
                          : 0
                      }%`,
                    }}
                    title="Walking"
                  />
                  <div className="bg-red-500 h-full flex-1" title="Driving" />
                </div>
                <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
                  <span className="text-blue-400">🚇 {result.transitSharePercent.toFixed(0)}%</span>
                  <span className="text-green-400">🚶 walk</span>
                  <span className="text-red-400">🚗 drive</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface StatProps {
  label: string;
  value: string | number;
  valueClass?: string;
}

function Stat({ label, value, valueClass = 'text-white' }: StatProps) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`font-bold text-sm tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}
