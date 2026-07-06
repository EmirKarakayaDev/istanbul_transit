import MapCanvas from './components/map/MapCanvas';
import GridLayer from './components/map/GridLayer';
import HeatmapLayer from './components/map/HeatmapLayer';
import DemandNodeLayer from './components/map/DemandNodeLayer';
import IlceMahalleLayer from './components/map/IlceMahalleLayer';
import MahalleBoundaryLayer from './components/map/MahalleBoundaryLayer';
import CoverageLayer from './components/map/CoverageLayer';
import Toolbar from './components/ui/Toolbar';
import StatsPanel from './components/ui/StatsPanel';
import CostDisplay from './components/ui/CostDisplay';
import ModeSelector from './components/ui/ModeSelector';
import SaveLoadPanel from './components/ui/SaveLoadPanel';
import LayerPanel from './components/ui/LayerPanel';
import LinePanel from './components/ui/LinePanel';
import StationPanel from './components/ui/StationPanel';
import SimulationController from './components/game/SimulationController';
import ZoneLoader from './components/game/ZoneLoader';

export default function App() {
  return (
    <div className="relative w-full h-full">
      {/* Map + map layers */}
      <MapCanvas />
      <CoverageLayer />
      <GridLayer />
      <HeatmapLayer />
      <DemandNodeLayer />
      <IlceMahalleLayer />
      <MahalleBoundaryLayer />

      {/* UI overlays */}
      <ModeSelector />
      <Toolbar />
      <LinePanel />
      <StationPanel />
      <StatsPanel />
      <CostDisplay />
      <LayerPanel />
      <SaveLoadPanel />

      {/* Headless controllers */}
      <SimulationController />
      <ZoneLoader />
    </div>
  );
}
