import type { Snapshot } from './model';
import { locations, toGeo } from './geography';

export type MachinePacket = {
  id: string;
  index: number;
  fieldId: string;
  local: [number, number];
  position: [number, number];
  heading: number;
  localHeading: number;
  speed: number;
  status: 'Trabalhando' | 'Manobrando' | 'Em falha';
  timestamp: number;
  simulated: true;
};
export type TelemetryFrame = { elapsed: number; timestamp: number; packets: MachinePacket[] };

function routeFor(snapshot: Snapshot, index: number) {
  const crop = ['Milho', 'Soja', 'Algodão'][index];
  const field = snapshot.fields.find((f) => f.crop === crop)!;
  // Retângulo interno ao polígono de demonstração, com margem para manobra.
  const width = Math.sqrt((field.area * 10000 * field.size[0]) / field.size[1]);
  const height = (width * field.size[1]) / field.size[0];
  const x = field.position[0] * 50,
    y = -field.position[1] * 50;
  const points: [number, number][] = [];
  for (let row = 0; row < 6; row++) {
    const north = y - height * 0.27 + row * height * 0.108;
    points.push(
      [x + (row % 2 === 0 ? -0.31 : 0.31) * width, north],
      [x + (row % 2 === 0 ? 0.31 : -0.31) * width, north],
    );
  }
  return { field, points };
}

export function demoTelemetry(
  snapshot: Snapshot,
  elapsed: number,
  timestamp: number,
): TelemetryFrame {
  const packets = snapshot.farm.machineIds.map((id, index): MachinePacket => {
    const { field, points } = routeFor(snapshot, index);
    const nominal = [8, 5.5, 12][index];
    const segments = points.map((a, i) => {
      const b = points[(i + 1) % points.length];
      const distance = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const working = i % 2 === 0;
      const speed = working ? nominal : nominal * 0.4;
      return { a, b, duration: distance / (speed / 3.6), speed, working };
    });
    const duration = segments.reduce((s, v) => s + v.duration, 0);
    let t = (Math.max(0, elapsed) + duration * index * 0.19) % duration;
    let segment = segments[0];
    for (const candidate of segments) {
      segment = candidate;
      if (t < candidate.duration) break;
      t -= candidate.duration;
    }
    let local: [number, number] = [
      segment.a[0] + ((segment.b[0] - segment.a[0]) * t) / segment.duration,
      segment.a[1] + ((segment.b[1] - segment.a[1]) * t) / segment.duration,
    ];
    const fault = snapshot.fault && index === 1;
    if (fault) local = [-1800, 3200];
    const bearing =
      (Math.atan2(segment.b[0] - segment.a[0], segment.b[1] - segment.a[1]) * 180) / Math.PI;
    return {
      id,
      index,
      fieldId: field.id,
      local,
      position: toGeo(snapshot.farm.id, ...local),
      heading: ((fault ? 0 : bearing - locations[snapshot.farm.id].angle) + 360) % 360,
      localHeading: fault ? 0 : bearing,
      speed: fault ? 0 : segment.speed,
      status: fault ? 'Em falha' : segment.working ? 'Trabalhando' : 'Manobrando',
      timestamp,
      simulated: true,
    };
  });
  return { elapsed, timestamp, packets };
}
