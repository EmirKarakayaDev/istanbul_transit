import type { TrackType } from '../data/types';
import {
  BASE_COST_PER_KM,
  COST_MULTIPLIERS,
  HISTORIC_AREAS,
  BOSPHORUS_BBOX,
} from '../data/constants';
import { haversineKm, pointInBbox } from '../utils/geo';

export interface CostFactors {
  baseCostPerKm: number;
  distance: number;          // km
  typeMultiplier: number;
  densityMultiplier: number;
  historicMultiplier: number;
  bosphorusMultiplier: number;
  total: number;
}

function getHistoricMultiplier(
  from: [number, number],
  to: [number, number]
): number {
  const midpoint: [number, number] = [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2,
  ];
  const inHistoric = HISTORIC_AREAS.some((area) => pointInBbox(midpoint, area.bbox));
  return inHistoric ? COST_MULTIPLIERS.historicArea : 1.0;
}

function getBosphorusMultiplier(
  from: [number, number],
  to: [number, number],
  type: TrackType
): number {
  const crossesBosphorus =
    (from[0] < 29.01 && to[0] > 29.01) ||
    (from[0] > 29.01 && to[0] < 29.01);
  const midpoint: [number, number] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  if (!crossesBosphorus || !pointInBbox(midpoint, BOSPHORUS_BBOX)) return 1.0;

  switch (type) {
    case 'surface':
      return COST_MULTIPLIERS.bosphorus.ferry;
    case 'elevated':
      return COST_MULTIPLIERS.bosphorus.bridge;
    case 'underground':
      return COST_MULTIPLIERS.bosphorus.tunnel;
  }
}

function getDensityMultiplier(): number {
  // Phase B will load real zone data; for Phase A use a default of 1.0
  return 1.0;
}

export function calculateSegmentCost(
  from: [number, number],
  to: [number, number],
  type: TrackType
): CostFactors {
  const distance = haversineKm(from, to);
  const baseCostPerKm = BASE_COST_PER_KM[type];
  const typeMultiplier = 1.0; // already embedded in base cost per type
  const densityMultiplier = getDensityMultiplier();
  const historicMultiplier = getHistoricMultiplier(from, to);
  const bosphorusMultiplier = getBosphorusMultiplier(from, to, type);

  const total =
    baseCostPerKm *
    distance *
    typeMultiplier *
    densityMultiplier *
    historicMultiplier *
    bosphorusMultiplier;

  return {
    baseCostPerKm,
    distance,
    typeMultiplier,
    densityMultiplier,
    historicMultiplier,
    bosphorusMultiplier,
    total,
  };
}
