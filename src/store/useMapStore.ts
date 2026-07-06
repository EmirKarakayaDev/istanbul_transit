import { create } from 'zustand';
import { ISTANBUL_CENTER, ISTANBUL_ZOOM } from '../data/constants';
import type { Map as MapboxMap } from 'mapbox-gl';

interface MapStore {
  map: MapboxMap | null;
  center: [number, number];
  zoom: number;
  is3D: boolean;
  cursorCoords: [number, number] | null;

  setMap: (map: MapboxMap) => void;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  toggle3D: () => void;
  setCursorCoords: (coords: [number, number] | null) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  map: null,
  center: ISTANBUL_CENTER,
  zoom: ISTANBUL_ZOOM,
  is3D: false,
  cursorCoords: null,

  setMap: (map) => set({ map }),
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  toggle3D: () =>
    set((s) => {
      if (s.map) {
        const pitch = s.is3D ? 0 : 45;
        const bearing = s.is3D ? 0 : -17.6;
        s.map.easeTo({ pitch, bearing, duration: 800 });
      }
      return { is3D: !s.is3D };
    }),
  setCursorCoords: (coords) => set({ cursorCoords: coords }),
}));
