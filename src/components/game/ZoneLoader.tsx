import { useEffect, useState } from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { loadZones } from '../../utils/loadZones';

/**
 * Headless component that loads zone data from the pre-generated GeoJSON asset
 * into the simulation store at app startup.
 */
export default function ZoneLoader() {
  const { setZones } = useSimulationStore();
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  useEffect(() => {
    setStatus('loading');
    loadZones()
      .then((zones) => {
        setZones(zones);
        setStatus('done');
      })
      .catch((err) => {
        console.error('Failed to load zone data:', err);
        setStatus('error');
      });
  }, [setZones]);

  if (status === 'loading') {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl px-4 py-2 text-sm text-blue-400 flex items-center gap-2">
        <span className="animate-spin">◌</span>
        Loading Istanbul zone data…
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-red-950/90 border border-red-700 rounded-xl px-4 py-2 text-sm text-red-400">
        ⚠ Zone data failed to load. Run npm run pipeline first.
      </div>
    );
  }

  return null;
}
