import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Station, TrackSegment, TransitLine, NetworkState } from '../data/types';
import { LINE_COLORS } from '../data/constants';

interface NetworkActions {
  addStation: (station: Omit<Station, 'id'>) => string;
  updateStation: (id: string, updates: Partial<Station>) => void;
  removeStation: (id: string) => void;

  addSegment: (segment: Omit<TrackSegment, 'id'>) => string;
  removeSegment: (id: string) => void;

  addLine: (name: string, color?: string) => string;
  updateLine: (id: string, updates: Partial<TransitLine>) => void;
  removeLine: (id: string) => void;
  addSegmentToLine: (lineId: string, segmentId: string) => void;
  removeSegmentFromLine: (lineId: string, segmentId: string) => void;

  undo: () => void;
  reset: () => void;
  loadNetwork: (network: NetworkState) => void;
}

interface NetworkStore extends NetworkState, NetworkActions {
  history: NetworkState[];
}

const emptyNetwork = (): NetworkState => ({
  stations: {},
  segments: {},
  lines: {},
});

const snapshot = (state: NetworkStore): NetworkState => ({
  stations: { ...state.stations },
  segments: { ...state.segments },
  lines: { ...state.lines },
});

let _idCounter = 0;
const nextId = (prefix: string) => `${prefix}_${Date.now()}_${_idCounter++}`;

export const useNetworkStore = create<NetworkStore>()(
  subscribeWithSelector((set, get) => ({
    ...emptyNetwork(),
    history: [],

    addStation: (station) => {
      const id = nextId('sta');
      set((s) => {
        const prev = snapshot(s as NetworkStore);
        return {
          history: [...s.history.slice(-50), prev],
          stations: { ...s.stations, [id]: { ...station, id } },
        };
      });
      return id;
    },

    updateStation: (id, updates) => {
      set((s) => ({
        stations: {
          ...s.stations,
          [id]: { ...s.stations[id], ...updates },
        },
      }));
    },

    removeStation: (id) => {
      set((s) => {
        const prev = snapshot(s as NetworkStore);
        // Remove all segments connected to this station
        const segments = Object.fromEntries(
          Object.entries(s.segments).filter(
            ([, seg]) => seg.fromStationId !== id && seg.toStationId !== id
          )
        );
        // Clean up lines referencing removed segments
        const removedSegIds = new Set(
          Object.keys(s.segments).filter(
            (sid) =>
              s.segments[sid].fromStationId === id ||
              s.segments[sid].toStationId === id
          )
        );
        const lines = Object.fromEntries(
          Object.entries(s.lines).map(([lid, line]) => [
            lid,
            { ...line, segmentIds: line.segmentIds.filter((sid) => !removedSegIds.has(sid)) },
          ])
        );
        const stations = { ...s.stations };
        delete stations[id];
        return { history: [...s.history.slice(-50), prev], stations, segments, lines };
      });
    },

    addSegment: (segment) => {
      const id = nextId('seg');
      set((s) => {
        const prev = snapshot(s as NetworkStore);
        return {
          history: [...s.history.slice(-50), prev],
          segments: { ...s.segments, [id]: { ...segment, id } },
        };
      });
      return id;
    },

    removeSegment: (id) => {
      set((s) => {
        const prev = snapshot(s as NetworkStore);
        const segments = { ...s.segments };
        delete segments[id];
        const lines = Object.fromEntries(
          Object.entries(s.lines).map(([lid, line]) => [
            lid,
            { ...line, segmentIds: line.segmentIds.filter((sid) => sid !== id) },
          ])
        );
        return { history: [...s.history.slice(-50), prev], segments, lines };
      });
    },

    addLine: (name, color) => {
      const id = nextId('line');
      const existingCount = Object.keys(get().lines).length;
      const lineColor = color ?? LINE_COLORS[existingCount % LINE_COLORS.length];
      set((s) => ({
        lines: {
          ...s.lines,
          [id]: { id, name, color: lineColor, segmentIds: [] },
        },
      }));
      return id;
    },

    updateLine: (id, updates) => {
      set((s) => ({
        lines: { ...s.lines, [id]: { ...s.lines[id], ...updates } },
      }));
    },

    removeLine: (id) => {
      set((s) => {
        const lines = { ...s.lines };
        delete lines[id];
        return { lines };
      });
    },

    addSegmentToLine: (lineId, segmentId) => {
      set((s) => {
        const line = s.lines[lineId];
        if (!line || line.segmentIds.includes(segmentId)) return s;
        return {
          lines: {
            ...s.lines,
            [lineId]: { ...line, segmentIds: [...line.segmentIds, segmentId] },
          },
        };
      });
    },

    removeSegmentFromLine: (lineId, segmentId) => {
      set((s) => {
        const line = s.lines[lineId];
        if (!line) return s;
        return {
          lines: {
            ...s.lines,
            [lineId]: {
              ...line,
              segmentIds: line.segmentIds.filter((id) => id !== segmentId),
            },
          },
        };
      });
    },

    undo: () => {
      set((s) => {
        if (s.history.length === 0) return s;
        const prev = s.history[s.history.length - 1];
        return {
          ...prev,
          history: s.history.slice(0, -1),
        };
      });
    },

    reset: () => set({ ...emptyNetwork(), history: [] }),

    loadNetwork: (network) => set({ ...network, history: [] }),
  }))
);
