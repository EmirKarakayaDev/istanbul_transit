import { useEffect, useRef } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useSimulationStore } from '../../store/useSimulationStore';
import { useGameStore } from '../../store/useGameStore';
import type { SimulationInput, SimulationOutput, SimulationError } from '../../simulation/simulationWorker';

const DEBOUNCE_MS = 800;

/**
 * Headless component that manages the simulation Web Worker lifecycle.
 * Triggers re-simulation whenever the network changes.
 */
export default function SimulationController() {
  const { stations, segments, lines } = useNetworkStore();
  const { zones, setResult, setIsRunning, setWorker } = useSimulationStore();
  const { updateScore } = useGameStore();

  const workerRef = useRef<Worker | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize worker
  useEffect(() => {
    const worker = new Worker(
      new URL('../../simulation/simulationWorker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (e: MessageEvent<SimulationOutput | SimulationError>) => {
      if (e.data.type === 'result') {
        setResult(e.data.result);
        // Simple score: ridership × coverage bonus
        const score = Math.round(
          e.data.result.totalDailyRidership * (e.data.result.coveragePercent / 100)
        );
        updateScore(score);
      }
    };

    workerRef.current = worker;
    setWorker(worker);

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-run simulation on network or zone changes (debounced)
  useEffect(() => {
    if (!workerRef.current || zones.length === 0) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (!workerRef.current) return;
      setIsRunning(true);

      const input: SimulationInput = {
        zones,
        stations,
        segments,
        lines,
      };
      workerRef.current.postMessage(input);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [stations, segments, lines, zones, setIsRunning]);

  return null;
}
