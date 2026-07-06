import { create } from 'zustand';
import type { ActiveTool, TrackType } from '../data/types';

interface UIStore {
  activeTool: ActiveTool;
  selectedStationId: string | null;
  selectedSegmentId: string | null;
  selectedLineId: string | null;
  activeLineId: string | null;       // line currently being drawn on
  trackDrawingType: TrackType;
  pendingTrackFrom: string | null;
  showGrid: boolean;
  showHeatmap: boolean;
  showCoverage: boolean;
  showDemandNodes: boolean;
  showIlceMahalle: boolean;
  showMahalleBoundaries: boolean;
  showLinePanel: boolean;
  showStats: boolean;
  showSaveLoad: boolean;

  setActiveTool: (tool: ActiveTool) => void;
  selectStation: (id: string | null) => void;
  selectSegment: (id: string | null) => void;
  selectLine: (id: string | null) => void;
  setActiveLineId: (id: string | null) => void;
  setTrackDrawingType: (type: TrackType) => void;
  setPendingTrackFrom: (stationId: string | null) => void;
  toggleGrid: () => void;
  toggleHeatmap: () => void;
  toggleCoverage: () => void;
  toggleDemandNodes: () => void;
  toggleIlceMahalle: () => void;
  toggleMahalleBoundaries: () => void;
  toggleLinePanel: () => void;
  toggleStats: () => void;
  toggleSaveLoad: () => void;
  clearSelection: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activeTool: 'select',
  selectedStationId: null,
  selectedSegmentId: null,
  selectedLineId: null,
  activeLineId: null,
  trackDrawingType: 'underground',
  pendingTrackFrom: null,
  showGrid: false,
  showHeatmap: false,
  showCoverage: true,
  showDemandNodes: true,
  showIlceMahalle: false,
   showMahalleBoundaries: false,
  showLinePanel: false,
  showStats: true,
  showSaveLoad: false,

  setActiveTool: (tool) =>
    set({ activeTool: tool, pendingTrackFrom: null, selectedStationId: null, selectedSegmentId: null }),

  selectStation: (id) => set({ selectedStationId: id, selectedSegmentId: null }),
  selectSegment: (id) => set({ selectedSegmentId: id, selectedStationId: null }),
  selectLine: (id) => set({ selectedLineId: id }),
  setActiveLineId: (id) => set({ activeLineId: id }),

  setTrackDrawingType: (type) => set({ trackDrawingType: type }),
  setPendingTrackFrom: (stationId) => set({ pendingTrackFrom: stationId }),

  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleHeatmap: () => set((s) => ({ showHeatmap: !s.showHeatmap })),
  toggleCoverage: () => set((s) => ({ showCoverage: !s.showCoverage })),
  toggleDemandNodes: () => set((s) => ({ showDemandNodes: !s.showDemandNodes })),
  toggleIlceMahalle: () => set((s) => ({ showIlceMahalle: !s.showIlceMahalle })),
  toggleMahalleBoundaries: () => set((s) => ({ showMahalleBoundaries: !s.showMahalleBoundaries })),
  toggleLinePanel: () => set((s) => ({ showLinePanel: !s.showLinePanel })),
  toggleStats: () => set((s) => ({ showStats: !s.showStats })),
  toggleSaveLoad: () => set((s) => ({ showSaveLoad: !s.showSaveLoad })),

  clearSelection: () =>
    set({ selectedStationId: null, selectedSegmentId: null, selectedLineId: null }),
}));
