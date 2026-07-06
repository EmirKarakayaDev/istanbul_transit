import type { Station, TrackSegment } from '../data/types';
import { haversineKm } from '../utils/geo';
import { AVG_TRAIN_SPEED_KMH, TRANSFER_PENALTY_MINUTES } from '../data/constants';

export interface GraphEdge {
  from: string;
  to: string;
  travelTimeMin: number;
  segmentId: string;
}

export interface TransitGraph {
  nodes: string[];           // station IDs
  edges: GraphEdge[];
  adjacency: Map<string, GraphEdge[]>;
}

/**
 * Build a bidirectional transit graph from the current network state.
 */
export function buildGraph(
  stations: Record<string, Station>,
  segments: Record<string, TrackSegment>
): TransitGraph {
  const nodes = Object.keys(stations);
  const edges: GraphEdge[] = [];
  const adjacency = new Map<string, GraphEdge[]>();

  for (const id of nodes) {
    adjacency.set(id, []);
  }

  for (const seg of Object.values(segments)) {
    const fromSta = stations[seg.fromStationId];
    const toSta = stations[seg.toStationId];
    if (!fromSta || !toSta) continue;

    const distKm = haversineKm(fromSta.coordinates, toSta.coordinates);
    const travelTimeMin = (distKm / AVG_TRAIN_SPEED_KMH) * 60;

    const fwd: GraphEdge = {
      from: seg.fromStationId,
      to: seg.toStationId,
      travelTimeMin,
      segmentId: seg.id,
    };
    const bwd: GraphEdge = {
      from: seg.toStationId,
      to: seg.fromStationId,
      travelTimeMin,
      segmentId: seg.id,
    };

    edges.push(fwd, bwd);
    adjacency.get(seg.fromStationId)!.push(fwd);
    adjacency.get(seg.toStationId)!.push(bwd);
  }

  return { nodes, edges, adjacency };
}

/**
 * Transfer penalty in minutes applied when switching lines at a station.
 */
export const TRANSFER_MIN = TRANSFER_PENALTY_MINUTES;
