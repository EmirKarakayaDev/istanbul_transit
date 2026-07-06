# Istanbul Transit

A web-based city transit simulation and strategy game. Design the optimal metro network for Istanbul.

## Quick Start

### 1. Get a Mapbox Token

Create a free account at [mapbox.com](https://www.mapbox.com/) and copy your public token.

### 2. Configure Environment

Edit `.env` and replace the placeholder:

```
VITE_MAPBOX_TOKEN=pk.eyJ1IjoieW91...
```

### 3. Generate Map Data (run once)

```bash
npm run pipeline
```

This runs all four data pipeline scripts in sequence and writes `public/data/istanbul-grid.geojson` — a 16,912-cell 500m grid covering the Istanbul metropolitan area with synthetic population, job density, and construction cost data.

### 4. Start Dev Server

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Game Controls

| Action | Key / Click |
|--------|------------|
| Select tool | V |
| Station tool | S |
| Track tool | T |
| Upgrade tool | U |
| Demolish tool | D |
| Undo | Ctrl+Z |
| Cancel / back to select | Escape |
| Track type: Surface | 1 (while Track tool active) |
| Track type: Elevated | 2 (while Track tool active) |
| Track type: Underground | 3 (while Track tool active) |

### Building a Network

1. Press **S** and click on the map to place stations
2. Press **T** to draw tracks — click a start station, then an end station; the segment is drawn and cost is deducted
3. Chain segments by continuing to click stations (the last station becomes the new start)
4. Press **Escape** or **V** to exit drawing mode

### Layers

Toggle in the bottom-right panel:
- **Zone Grid** — shows the 500m simulation grid coloured by ridership density
- **Heatmap** — ridership demand heatmap across the city
- **Coverage** — stations within walking radius
- **3D View** — tilted 3D perspective of the city

---

## Game Modes

| Mode | Description |
|------|-------------|
| **Sandbox** | Unlimited budget, free design |
| **Budget** | 20B TL budget; minimise commute time and maximise ridership |
| **Scenario** | Pre-set goals (2035 Istanbul Transport Plan, Bosphorus Bridge) |

Select a mode from the top-left panel. Switching modes resets the current network.

---

## Architecture

```
src/
├── components/
│   ├── map/          # Mapbox GL JS layers (stations, tracks, grid, heatmap)
│   ├── ui/           # Toolbar, StatsPanel, CostDisplay, SaveLoadPanel, ModeSelector
│   └── game/         # SimulationController (Web Worker), ZoneLoader
├── store/            # Zustand stores (network, map, UI, game, simulation)
├── engine/           # Cost calculator, coverage engine, graph builder
├── simulation/       # Web Worker: trip generation, demand matrix, Dijkstra router
├── data/             # Types, constants, presets
└── utils/            # Geo helpers, save/load, zone loader

scripts/              # Offline data pipeline (Node.js / tsx)
public/data/          # Pre-generated GeoJSON assets
```

### Simulation Model

- Zone-based gravity model: `Trips ∝ Population × JobDensity / Distance²`
- 16,912 zones × 500m grid covering Istanbul bbox `[28.6°E, 40.8°N, 29.5°E, 41.3°N]`
- Simulation runs in a **Web Worker** to keep the UI responsive
- Triggered automatically 800ms after any network change

### Construction Cost Formula

```
cost = base_cost_per_km × distance_km × density_mult × historic_mult × bosphorus_mult
```

| Track type | Base cost/km |
|------------|-------------|
| Surface | 50M TL |
| Elevated | 150M TL |
| Underground | 400M TL |

| Zone modifier | Multiplier |
|---------------|-----------|
| Historic area (Sultanahmet etc.) | ×2.5 |
| Dense urban corridor | ×1.4 |
| Bosphorus water crossing | ×3.0 |

---

## Save / Load

- **5 save slots** — stored in `localStorage`
- **JSON export/import** — portable save files
- Access via the 💾 button in the bottom-right corner

---

## Data Pipeline Scripts

| Script | Purpose |
|--------|---------|
| `generateGrid.ts` | Splits Istanbul bbox into 500m cells → GeoJSON |
| `bindPopulation.ts` | Assigns Gaussian population density (synthetic model of real Istanbul) |
| `bindJobs.ts` | Assigns job density scores based on CBD locations |
| `buildCostSurface.ts` | Applies historic/dense/Bosphorus cost multipliers per zone |

To replace the synthetic data with real data:
- **Population**: sample [GHSL](https://ghsl.jrc.ec.europa.eu/) GeoTIFF rasters per zone centroid in `bindPopulation.ts`
- **Jobs**: query [OSM Overpass API](https://overpass-turbo.eu/) for `office`, `commercial`, `retail` POIs in `bindJobs.ts`

---

## Development Phases

| Phase | Status | Description |
|-------|--------|-------------|
| A — Builder MVP | ✅ Done | Map, station/track tools, cost engine, save/load |
| B — Basic Simulation | ✅ Done | Zone grid, population/jobs, ridership, heatmap, stats |
| C — Full Gameplay | ✅ Done | Route finding (Dijkstra), OD demand matrix, budget mode, scoring |
| D — Steam PC | Planned | Electron wrapper or native port |
