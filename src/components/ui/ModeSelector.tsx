import { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useSimulationStore } from '../../store/useSimulationStore';
import { SCENARIOS } from '../../data/presets';
import { formatTL } from '../../utils/geo';
import type { GameMode } from '../../data/types';

export default function ModeSelector() {
  const [open, setOpen] = useState(false);
  const { mode, budget, setMode, setScenario, resetGame } = useGameStore();
  const { reset: resetNetwork } = useNetworkStore();
  const { clearResult } = useSimulationStore();

  const handleSetMode = (m: GameMode) => {
    resetGame();
    resetNetwork();
    clearResult();
    setMode(m);
    setOpen(false);
  };

  const handleScenario = (scenarioId: string) => {
    const sc = SCENARIOS.find((s) => s.id === scenarioId);
    if (!sc) return;
    resetGame();
    resetNetwork();
    clearResult();
    setScenario(sc.target);
    setOpen(false);
  };

  const modeLabel = mode === 'sandbox' ? 'Sandbox' : mode === 'budget' ? 'Budget' : 'Scenario';
  const modeColor =
    mode === 'sandbox' ? 'bg-slate-700' :
    mode === 'budget' ? 'bg-blue-700' :
    'bg-purple-700';

  return (
    <div className="absolute top-4 left-4 z-10">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-white shadow-lg
          ${modeColor} hover:opacity-90 transition-opacity
        `}
      >
        <span>🗺</span>
        {modeLabel} Mode
        {mode !== 'sandbox' && (
          <span className="text-xs opacity-75">({formatTL(budget)})</span>
        )}
        <span className="text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-2 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl w-72">
          <div className="p-3 border-b border-slate-800">
            <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Game Modes</p>

            <button
              onClick={() => handleSetMode('sandbox')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                mode === 'sandbox' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="font-semibold">Sandbox</div>
              <div className="text-xs text-slate-500">Unlimited budget, free design</div>
            </button>

            <button
              onClick={() => handleSetMode('budget')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                mode === 'budget' ? 'bg-blue-900 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="font-semibold">Budget Mode</div>
              <div className="text-xs text-slate-500">20B TL · Optimize commute &amp; ridership</div>
            </button>
          </div>

          <div className="p-3">
            <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Scenarios</p>
            {SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                onClick={() => handleScenario(sc.id)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm mb-1 text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <div className="font-semibold">{sc.name}</div>
                <div className="text-xs text-slate-500">{sc.description}</div>
                <div className="text-xs text-purple-400 mt-0.5">Budget: {formatTL(sc.budget)} · Target: {sc.target.targetRiders.toLocaleString('tr-TR')} riders</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
