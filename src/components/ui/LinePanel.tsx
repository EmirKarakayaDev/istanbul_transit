import { useState, useRef, useEffect } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useUIStore } from '../../store/useUIStore';
import { LINE_COLORS } from '../../data/constants';

export default function LinePanel() {
  const { showLinePanel, activeLineId, setActiveLineId, setActiveTool } = useUIStore();
  const { lines, segments, addLine, updateLine, removeLine } = useNetworkStore();

  const lineList = Object.values(lines);

  const handleNewLine = () => {
    const count = lineList.length;
    const newId = addLine(`Hat ${count + 1}`);
    setActiveLineId(newId);
  };

  const handleSelectLine = (id: string) => {
    setActiveLineId(id);
    setActiveTool('track');
  };

  const handleDeleteLine = (id: string) => {
    removeLine(id);
    if (activeLineId === id) setActiveLineId(null);
  };

  if (!showLinePanel) return null;

  // Count stations per line (unique stations touching its segments)
  const lineStats = (lineId: string) => {
    const line = lines[lineId];
    if (!line) return { segCount: 0, staCount: 0 };
    const stationIds = new Set<string>();
    for (const sid of line.segmentIds) {
      const seg = segments[sid];
      if (seg) { stationIds.add(seg.fromStationId); stationIds.add(seg.toStationId); }
    }
    return { segCount: line.segmentIds.length, staCount: stationIds.size };
  };

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-64 flex flex-col gap-0">
      {/* Header */}
      <div className="bg-slate-900/95 backdrop-blur border border-slate-700 rounded-t-2xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">Hat Yöneticisi</span>
          <span className="text-xs bg-slate-700 text-slate-400 rounded px-1.5 py-0.5">{lineList.length}</span>
        </div>
        <button
          onClick={handleNewLine}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          + Yeni Hat
        </button>
      </div>

      {/* Line list */}
      <div className="bg-slate-900/95 backdrop-blur border-x border-slate-700 flex flex-col max-h-[60vh] overflow-y-auto">
        {lineList.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-slate-600">
            Hat yok.<br />
            <span className="text-slate-500">T ile segment çizince<br />otomatik hat oluşur.</span>
          </div>
        ) : (
          lineList.map((line) => {
            const isActive = line.id === activeLineId;
            const { segCount, staCount } = lineStats(line.id);
            return (
              <LineRow
                key={line.id}
                line={line}
                isActive={isActive}
                segCount={segCount}
                staCount={staCount}
                onSelect={() => handleSelectLine(line.id)}
                onRename={(name) => updateLine(line.id, { name })}
                onColorChange={(color) => updateLine(line.id, { color })}
                onDelete={() => handleDeleteLine(line.id)}
              />
            );
          })
        )}
      </div>

      {/* Footer hint */}
      <div className="bg-slate-900/95 backdrop-blur border border-slate-700 rounded-b-2xl px-4 py-2.5">
        <p className="text-[10px] text-slate-600 text-center">
          Hat seç → T ile segment çiz → hatta atanır
        </p>
      </div>
    </div>
  );
}

interface LineRowProps {
  line: { id: string; name: string; color: string; segmentIds: string[] };
  isActive: boolean;
  segCount: number;
  staCount: number;
  onSelect: () => void;
  onRename: (name: string) => void;
  onColorChange: (color: string) => void;
  onDelete: () => void;
}

function LineRow({ line, isActive, segCount, staCount, onSelect, onRename, onColorChange, onDelete }: LineRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(line.name);
  const [showColors, setShowColors] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
  useEffect(() => { setDraft(line.name); }, [line.name]);

  const commitRename = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== line.name) onRename(trimmed);
    else setDraft(line.name);
    setEditing(false);
  };

  return (
    <div
      className={`
        relative flex flex-col px-3 py-2.5 border-b border-slate-800 cursor-pointer transition-colors
        ${isActive ? 'bg-slate-800/80' : 'hover:bg-slate-800/40'}
      `}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2.5">
        {/* Color dot — click to pick color */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowColors((p) => !p); }}
          className="w-4 h-4 rounded-full flex-shrink-0 ring-2 transition-all"
          style={{
            backgroundColor: line.color,
            outline: isActive ? `2px solid ${line.color}` : '2px solid transparent',
            outlineOffset: '2px',
            boxShadow: isActive ? `0 0 8px ${line.color}80` : 'none',
          }}
          title="Renk değiştir"
        />

        {/* Name */}
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setDraft(line.name); setEditing(false); } }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-slate-700 text-white text-sm px-2 py-0.5 rounded outline-none border border-slate-500"
          />
        ) : (
          <span
            className={`flex-1 text-sm font-medium truncate ${isActive ? 'text-white' : 'text-slate-300'}`}
            onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
            title="Çift tıkla → yeniden adlandır"
          >
            {line.name}
          </span>
        )}

        {/* Active badge */}
        {isActive && (
          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ backgroundColor: line.color + '30', color: line.color }}>
            Aktif
          </span>
        )}

        {/* Delete */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-slate-600 hover:text-red-400 transition-colors text-xs px-1"
          title="Hattı sil"
        >
          ✕
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-3 mt-1 ml-6 text-[10px] text-slate-600">
        <span>{staCount} istasyon</span>
        <span>{segCount} segment</span>
      </div>

      {/* Color picker popover */}
      {showColors && (
        <div
          className="absolute left-3 top-full mt-1 z-30 bg-slate-800 border border-slate-600 rounded-xl p-2 flex flex-wrap gap-1.5 w-40 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {LINE_COLORS.map((c) => (
            <button
              key={c}
              className="w-6 h-6 rounded-full transition-transform hover:scale-110 ring-2"
              style={{
                backgroundColor: c,
                boxShadow: line.color === c ? `0 0 6px ${c}` : 'none',
                outline: line.color === c ? '2px solid white' : '2px solid transparent',
                outlineOffset: '2px',
              }}
              onClick={() => { onColorChange(c); setShowColors(false); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
