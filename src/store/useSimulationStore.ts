import { create } from 'zustand';
import type { SimulationResult, Zone } from '../data/types';

interface SimulationStore {
  zones: Zone[];
  result: SimulationResult | null;
  isRunning: boolean;
  worker: Worker | null;

  setZones: (zones: Zone[]) => void;
  setResult: (result: SimulationResult) => void;
  setIsRunning: (running: boolean) => void;
  setWorker: (worker: Worker) => void;
  clearResult: () => void;
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  zones: [],
  result: null,
  isRunning: false,
  worker: null,

  setZones: (zones) => set({ zones }),
  setResult: (result) => set({ result, isRunning: false }),
  setIsRunning: (running) => set({ isRunning: running }),
  setWorker: (worker) => set({ worker }),
  clearResult: () => set({ result: null }),
}));
