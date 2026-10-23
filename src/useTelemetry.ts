import { useEffect, useMemo, useState } from 'react';
import type { Snapshot } from './model';
import { demoTelemetry } from './telemetry';

export function useTelemetry(snapshot: Snapshot, enabled: boolean) {
  const [running, setRunning] = useState(
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [rate, setRate] = useState(20);
  const key = `${snapshot.farm.id}/${snapshot.weather.date}`;
  const [sample, setSample] = useState({ key, elapsed: 0, timestamp: Date.now() });
  useEffect(() => {
    setSample({ key, elapsed: 0, timestamp: Date.now() });
  }, [key]);
  useEffect(() => {
    if (!enabled || !running) return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = Math.min(2, (now - previous) / 1000);
      previous = now;
      if (document.hidden) return;
      setSample((s) => ({
        key,
        elapsed: (s.key === key ? s.elapsed : 0) + delta * rate,
        timestamp: Date.now(),
      }));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [enabled, running, rate, key]);
  const frame = useMemo(
    () => demoTelemetry(snapshot, sample.key === key ? sample.elapsed : 0, sample.timestamp),
    [snapshot, sample, key],
  );
  return { frame, running: running && enabled, setRunning, rate, setRate };
}
