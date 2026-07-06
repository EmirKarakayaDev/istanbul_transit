import { useEffect } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import type { ActiveTool, TrackType } from '../../data/types';

const TOOLS: Array<{ id: ActiveTool; label: string; icon: string; shortcut: string }> = [
  { id: 'select',  label: 'Seç',      icon: '↖', shortcut: 'V' },
  { id: 'station', label: 'İstasyon', icon: '●', shortcut: 'S' },
  { id: 'track',   label: 'Hat Çiz',  icon: '—', shortcut: 'T' },
  { id: 'upgrade', label: 'Geliştir', icon: '▲', shortcut: 'U' },
  { id: 'demolish',label: 'Yık',      icon: '✕', shortcut: 'D' },
];

const TRACK_TYPES: Array<{ id: TrackType; label: string; dot: string }> = [
  { id: 'surface',     label: 'Yüzey',  dot: 'bg-green-400' },
  { id: 'elevated',    label: 'Viyadük', dot: 'bg-yellow-400' },
  { id: 'underground', label: 'Tünel',   dot: 'bg-blue-400' },
];

export default function Toolbar() {
  const {
    activeTool, trackDrawingType, activeLineId,
    setActiveTool, setTrackDrawingType, toggleLinePanel,
  } = useUIStore();
  const { undo, lines } = useNetworkStore();

  const activeLine = activeLineId ? lines[activeLineId] : null;

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toUpperCase();

      if (e.ctrlKey && key === 'Z') { e.preventDefault(); undo(); return; }
      if (key === 'L') { toggleLinePanel(); return; }
      if (key === 'ESCAPE') { setActiveTool('select'); return; }

      for (const tool of TOOLS) {
        if (key === tool.shortcut) { setActiveTool(tool.id); return; }
      }

      if (activeTool === 'track') {
        if (key === '1') setTrackDrawingType('surface');
        if (key === '2') setTrackDrawingType('elevated');
        if (key === '3') setTrackDrawingType('underground');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTool, setActiveTool, setTrackDrawingType, toggleLinePanel, undo]);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">

      {/* Tool bar */}
      <div className="flex gap-1 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl p-1.5 shadow-2xl">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            title={`${tool.label} (${tool.shortcut})`}
            className={`
              flex flex-col items-center justify-center w-14 h-14 rounded-lg text-xs gap-1
              transition-all duration-150 select-none
              ${activeTool === tool.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }
            `}
          >
            <span className="text-lg leading-none">{tool.icon}</span>
            <span className="font-medium">{tool.label}</span>
          </button>
        ))}

        <div className="w-px bg-slate-700 mx-1" />

        {/* Line Manager toggle */}
        <button
          onClick={toggleLinePanel}
          title="Hat Yöneticisi (L)"
          className="flex flex-col items-center justify-center w-14 h-14 rounded-lg text-xs gap-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-150 select-none"
        >
          <span className="text-lg leading-none">≡</span>
          <span className="font-medium">Hatlar</span>
        </button>

        <div className="w-px bg-slate-700 mx-1" />

        {/* Undo */}
        <button
          onClick={undo}
          title="Geri Al (Ctrl+Z)"
          className="flex flex-col items-center justify-center w-14 h-14 rounded-lg text-xs gap-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-150 select-none"
        >
          <span className="text-lg leading-none">↩</span>
          <span className="font-medium">Geri Al</span>
        </button>
      </div>

      {/* Track sub-bar — shown when Track tool is active */}
      {activeTool === 'track' && (
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl px-3 py-1.5 shadow-xl">

          {/* Track type */}
          {TRACK_TYPES.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setTrackDrawingType(t.id)}
              title={`${t.label} (${i + 1})`}
              className={`
                flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150
                ${trackDrawingType === t.id ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}
              `}
            >
              <span className={`w-2 h-2 rounded-full ${t.dot}`} />
              {t.label}
            </button>
          ))}

          <div className="w-px h-5 bg-slate-700" />

          {/* Active line indicator */}
          {activeLine ? (
            <button
              onClick={toggleLinePanel}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors"
              title="Hat seç (L)"
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: activeLine.color, boxShadow: `0 0 6px ${activeLine.color}` }}
              />
              <span className="text-white max-w-[100px] truncate">{activeLine.name}</span>
              <span className="text-slate-500">↓</span>
            </button>
          ) : (
            <button
              onClick={toggleLinePanel}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
              title="Hat seç (L)"
            >
              <span className="w-2 h-2 rounded-full border border-slate-500" />
              Hat seç
            </button>
          )}
        </div>
      )}
    </div>
  );
}
