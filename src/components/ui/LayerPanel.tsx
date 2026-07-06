import { useUIStore } from '../../store/useUIStore';
import { useMapStore } from '../../store/useMapStore';

export default function LayerPanel() {
  const {
    showGrid, showHeatmap, showCoverage, showDemandNodes, showIlceMahalle, showMahalleBoundaries,
    toggleGrid, toggleHeatmap, toggleCoverage, toggleDemandNodes, toggleIlceMahalle, toggleMahalleBoundaries,
    toggleSaveLoad,
  } = useUIStore();
  const { is3D, toggle3D } = useMapStore();

  const LayerToggle = ({
    label,
    active,
    onToggle,
    dot,
    description,
  }: {
    label: string;
    active: boolean;
    onToggle: () => void;
    dot: string;
    description?: string;
  }) => (
    <button
      onClick={onToggle}
      title={description}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 w-full text-left
        ${active ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}
      `}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? dot : 'bg-slate-600'}`} />
      {label}
    </button>
  );

  return (
    <div className="absolute bottom-16 right-4 z-10 flex flex-col gap-1.5 items-end">
      <div className="flex flex-col gap-0.5 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl p-2 w-44">
        <span className="text-[10px] text-slate-600 px-1 uppercase tracking-widest mb-1">Katmanlar</span>

        <LayerToggle
          label="Demand Nodes"
          active={showDemandNodes}
          onToggle={toggleDemandNodes}
          dot="bg-amber-400"
          description="Zone talep düğümleri — renk: mavi=transit, kırmızı=araba, yeşil=yürüyüş"
        />
        <LayerToggle
          label="İlçe / Mahalle"
          active={showIlceMahalle}
          onToggle={toggleIlceMahalle}
          dot="bg-sky-400"
          description="İlçe ve mahalle nüfusu — daire boyutu nüfusa göre"
        />
        <LayerToggle
          label="Mahalle Sınırları"
          active={showMahalleBoundaries}
          onToggle={toggleMahalleBoundaries}
          dot="bg-cyan-300"
          description="İstanbul mahalle poligon sınırları (test / analiz)"
        />
        <LayerToggle
          label="Heatmap"
          active={showHeatmap}
          onToggle={toggleHeatmap}
          dot="bg-red-500"
          description="Nüfus / ridership yoğunluk haritası"
        />
        <LayerToggle
          label="Zone Grid"
          active={showGrid}
          onToggle={toggleGrid}
          dot="bg-indigo-400"
          description="500m hücre grid (debug)"
        />
        <LayerToggle
          label="Coverage"
          active={showCoverage}
          onToggle={toggleCoverage}
          dot="bg-emerald-400"
          description="İstasyon 500m yürüme alanları"
        />
        <LayerToggle
          label="3D Görünüm"
          active={is3D}
          onToggle={toggle3D}
          dot="bg-violet-400"
          description="3D şehir perspektifi"
        />
      </div>

      <button
        onClick={toggleSaveLoad}
        className="flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-slate-700 px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-white transition-colors w-44"
      >
        💾 <span>Kaydet / Yükle</span>
      </button>
    </div>
  );
}
