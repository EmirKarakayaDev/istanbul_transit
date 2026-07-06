import { useState, useEffect } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useGameStore } from '../../store/useGameStore';
import { useSimulationStore } from '../../store/useSimulationStore';
import {
  buildSaveData,
  saveToSlot,
  loadFromSlot,
  deleteSlot,
  listSaveSlots,
  exportToJSON,
  importFromJSON,
  type SaveSlotMeta,
} from '../../utils/saveLoad';
import { formatTL } from '../../utils/geo';

export default function SaveLoadPanel() {
  const { showSaveLoad, toggleSaveLoad } = useUIStore();
  const { stations, segments, lines, loadNetwork } = useNetworkStore();
  const { mode, budget, spent, score, scenario, loadGame } = useGameStore();
  const { result } = useSimulationStore();

  const [slots, setSlots] = useState<SaveSlotMeta[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  const refreshSlots = () => setSlots(listSaveSlots());
  useEffect(() => { if (showSaveLoad) refreshSlots(); }, [showSaveLoad]);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleSave = (slot: number) => {
    const data = buildSaveData(
      { stations, segments, lines },
      { mode, budget, spent, score, scenario },
      result
    );
    saveToSlot(slot, data);
    refreshSlots();
    notify(`Saved to slot ${slot + 1}`);
  };

  const handleLoad = (slot: number) => {
    const data = loadFromSlot(slot);
    if (!data) return;
    loadNetwork(data.network);
    loadGame(data.game);
    notify(`Loaded from slot ${slot + 1}`);
    toggleSaveLoad();
  };

  const handleDelete = (slot: number) => {
    deleteSlot(slot);
    refreshSlots();
  };

  const handleExport = () => {
    const data = buildSaveData(
      { stations, segments, lines },
      { mode, budget, spent, score, scenario },
      result
    );
    exportToJSON(data);
    notify('Exported to JSON');
  };

  const handleImport = async () => {
    try {
      const data = await importFromJSON();
      loadNetwork(data.network);
      loadGame(data.game);
      notify('Imported successfully');
      toggleSaveLoad();
    } catch {
      notify('Import failed');
    }
  };

  if (!showSaveLoad) return null;

  const TOTAL_SLOTS = 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-[480px] max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Save / Load</h2>
          <button
            onClick={toggleSaveLoad}
            className="text-slate-400 hover:text-white text-xl transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          {notification && (
            <div className="bg-emerald-900/50 border border-emerald-700 text-emerald-300 text-sm px-3 py-2 rounded-lg">
              {notification}
            </div>
          )}

          {/* Save slots */}
          <div className="flex flex-col gap-2">
            {Array.from({ length: TOTAL_SLOTS }, (_, i) => {
              const meta = slots.find((s) => s.slot === i);
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-slate-800 rounded-xl p-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    {meta ? (
                      <>
                        <div className="text-sm font-medium text-white">
                          {meta.stationCount} stations · {meta.mode}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(meta.timestamp).toLocaleString('tr-TR')} · {formatTL(meta.spent)} spent
                        </div>
                      </>
                    ) : (
                      <span className="text-sm text-slate-600">Empty slot</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleSave(i)}
                      className="px-2 py-1 text-xs bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      Save
                    </button>
                    {meta && (
                      <>
                        <button
                          onClick={() => handleLoad(i)}
                          className="px-2 py-1 text-xs bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDelete(i)}
                          className="px-2 py-1 text-xs bg-slate-700 hover:bg-red-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Import/Export */}
          <div className="flex gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={handleExport}
              className="flex-1 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
            >
              Export JSON
            </button>
            <button
              onClick={handleImport}
              className="flex-1 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
            >
              Import JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
