import type { SaveData, NetworkState, GameState, SimulationResult } from '../data/types';
import { SAVE_KEY_PREFIX, MAX_SAVE_SLOTS, CURRENT_SAVE_VERSION } from '../data/constants';

export interface SaveSlotMeta {
  slot: number;
  timestamp: number;
  stationCount: number;
  mode: string;
  spent: number;
}

export function buildSaveData(
  network: NetworkState,
  game: GameState,
  simulationResult: SimulationResult | null
): SaveData {
  return {
    version: CURRENT_SAVE_VERSION,
    timestamp: Date.now(),
    network,
    game,
    simulationResult,
  };
}

export function saveToSlot(slot: number, data: SaveData): void {
  const key = `${SAVE_KEY_PREFIX}${slot}`;
  localStorage.setItem(key, JSON.stringify(data));
}

export function loadFromSlot(slot: number): SaveData | null {
  const key = `${SAVE_KEY_PREFIX}${slot}`;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SaveData;
  } catch {
    return null;
  }
}

export function deleteSlot(slot: number): void {
  localStorage.removeItem(`${SAVE_KEY_PREFIX}${slot}`);
}

export function listSaveSlots(): SaveSlotMeta[] {
  const metas: SaveSlotMeta[] = [];
  for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
    const raw = localStorage.getItem(`${SAVE_KEY_PREFIX}${i}`);
    if (!raw) continue;
    try {
      const data = JSON.parse(raw) as SaveData;
      metas.push({
        slot: i,
        timestamp: data.timestamp,
        stationCount: Object.keys(data.network.stations).length,
        mode: data.game.mode,
        spent: data.game.spent,
      });
    } catch {
      // corrupt slot, skip
    }
  }
  return metas;
}

export function exportToJSON(data: SaveData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `istanbul_transit_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importFromJSON(): Promise<SaveData> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error('No file selected'));
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string) as SaveData;
          resolve(data);
        } catch {
          reject(new Error('Invalid save file'));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}
