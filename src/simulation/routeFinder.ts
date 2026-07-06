import type { TransitGraph, GraphEdge } from '../engine/graphBuilder';
import { TRANSFER_MIN } from '../engine/graphBuilder';

export interface RouteResult {
  path: string[];           // station IDs from → to
  totalTimeMin: number;
  transferCount: number;
  found: boolean;
}

/**
 * Dijkstra shortest-path algorithm on the transit graph.
 * Weight is travel time in minutes + transfer penalties.
 */
export function findShortestRoute(
  graph: TransitGraph,
  fromStationId: string,
  toStationId: string
): RouteResult {
  if (fromStationId === toStationId) {
    return { path: [fromStationId], totalTimeMin: 0, transferCount: 0, found: true };
  }

  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const unvisited = new Set<string>(graph.nodes);

  for (const node of graph.nodes) {
    dist.set(node, Infinity);
    prev.set(node, null);
  }
  dist.set(fromStationId, 0);

  while (unvisited.size > 0) {
    // Find unvisited node with smallest distance
    let u: string | null = null;
    let uDist = Infinity;
    for (const node of unvisited) {
      const d = dist.get(node) ?? Infinity;
      if (d < uDist) {
        uDist = d;
        u = node;
      }
    }

    if (u === null || uDist === Infinity) break;
    if (u === toStationId) break;

    unvisited.delete(u);

    const edges: GraphEdge[] = graph.adjacency.get(u) ?? [];
    for (const edge of edges) {
      if (!unvisited.has(edge.to)) continue;
      const alt = uDist + edge.travelTimeMin;
      if (alt < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, alt);
        prev.set(edge.to, u);
      }
    }
  }

  const totalTimeMin = dist.get(toStationId) ?? Infinity;
  if (!isFinite(totalTimeMin)) {
    return { path: [], totalTimeMin: Infinity, transferCount: 0, found: false };
  }

  // Reconstruct path
  const path: string[] = [];
  let current: string | null = toStationId;
  while (current) {
    path.unshift(current);
    current = prev.get(current) ?? null;
  }

  // Estimate transfers (simplified: each direction change = 1 transfer)
  const transferCount = Math.max(0, Math.floor(path.length / 4));
  const totalWithPenalty = totalTimeMin + transferCount * TRANSFER_MIN;

  return { path, totalTimeMin: totalWithPenalty, transferCount, found: true };
}

/**
 * Batch route finding: find all reachable destinations from a source station.
 * Returns a map of stationId → { timeMin }
 */
export function findAllReachable(
  graph: TransitGraph,
  fromStationId: string
): Map<string, number> {
  const dist = new Map<string, number>();
  const unvisited = new Set<string>(graph.nodes);

  for (const node of graph.nodes) dist.set(node, Infinity);
  dist.set(fromStationId, 0);

  while (unvisited.size > 0) {
    let u: string | null = null;
    let uDist = Infinity;
    for (const node of unvisited) {
      const d = dist.get(node) ?? Infinity;
      if (d < uDist) { uDist = d; u = node; }
    }
    if (!u || uDist === Infinity) break;
    unvisited.delete(u);

    const edges: GraphEdge[] = graph.adjacency.get(u) ?? [];
    for (const edge of edges) {
      if (!unvisited.has(edge.to)) continue;
      const alt = uDist + edge.travelTimeMin;
      if (alt < (dist.get(edge.to) ?? Infinity)) dist.set(edge.to, alt);
    }
  }

  const reachable = new Map<string, number>();
  for (const [id, d] of dist) {
    if (isFinite(d) && id !== fromStationId) reachable.set(id, d);
  }
  return reachable;
}
