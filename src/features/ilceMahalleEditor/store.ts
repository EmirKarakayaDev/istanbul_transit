import { create } from 'zustand';
import type { IlceMahallePoint } from '../../utils/loadIlceMahalle';

export interface IlceMahalleEditorStore {
  points: IlceMahallePoint[];
  setPoints: (points: IlceMahallePoint[]) => void;
  updatePointCoordinates: (id: string, coordinates: [number, number]) => void;
}

export const useIlceMahalleEditorStore = create<IlceMahalleEditorStore>((set) => ({
  points: [],

  setPoints: (points) => set({ points }),

  updatePointCoordinates: (id, coordinates) =>
    set((state) => ({
      points: state.points.map((p) =>
        p.id === id ? { ...p, coordinates } : p
      ),
    })),
}));
