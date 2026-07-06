import type { ScenarioTarget } from './types';

export const SCENARIOS: Array<{ id: string; name: string; budget: number; target: ScenarioTarget; description: string }> = [
  {
    id: 'scenario_2035',
    name: '2035 Istanbul Transport Plan',
    budget: 12_000_000_000,
    target: {
      targetRiders: 4_000_000,
      year: 2035,
      description: 'Build a network serving 4 million daily riders by 2035.',
    },
    description: 'Replicate Istanbul\'s 2035 metropolitan transport vision with 12B TL budget.',
  },
  {
    id: 'scenario_bosphorus',
    name: 'Bosphorus Bridge',
    budget: 8_000_000_000,
    target: {
      targetRiders: 2_000_000,
      year: 2030,
      description: 'Connect European and Asian sides for 2M daily riders.',
    },
    description: 'Create a cross-Bosphorus transit network linking both continents.',
  },
];

// Known major Istanbul transit hubs as starting point suggestions
export const TRANSIT_HUBS = [
  { name: 'Kadıköy', coordinates: [29.0264, 40.9901] as [number, number] },
  { name: 'Taksim', coordinates: [28.9784, 41.0369] as [number, number] },
  { name: 'Sultanahmet', coordinates: [28.9744, 41.0055] as [number, number] },
  { name: 'Eminönü', coordinates: [28.9716, 41.0171] as [number, number] },
  { name: 'Beşiktaş', coordinates: [29.0039, 41.0413] as [number, number] },
  { name: 'Üsküdar', coordinates: [29.0167, 41.0228] as [number, number] },
  { name: 'Levent', coordinates: [29.0112, 41.0795] as [number, number] },
  { name: 'Bağcılar', coordinates: [28.856, 41.036] as [number, number] },
  { name: 'Pendik', coordinates: [29.2308, 40.877] as [number, number] },
  { name: 'Bakırköy', coordinates: [28.8697, 40.9797] as [number, number] },
];
