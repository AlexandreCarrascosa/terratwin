import { describe, expect, it } from 'vitest';
import { demoTelemetry } from './telemetry';
import { dataset, farmSnapshot } from './model';
import { fieldFootprint } from './geography';

function inside(point: [number, number], polygon: [number, number][]) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j];
    if (
      a[1] > point[1] !== b[1] > point[1] &&
      point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      result = !result;
  }
  return result;
}
describe('telemetria sintética', () => {
  it('mantém a máquina em falha imóvel e continua movimentando as outras', () => {
    const s = farmSnapshot('aurora', dataset.defaultDate),
      a = demoTelemetry(s, 0, 1000),
      b = demoTelemetry(s, 20, 2000);
    expect(a.packets[1].position).toEqual(b.packets[1].position);
    expect(b.packets[1].speed).toBe(0);
    expect(b.packets[1].status).toBe('Em falha');
    expect(a.packets[0].position).not.toEqual(b.packets[0].position);
    expect(b.packets[0].timestamp).toBe(2000);
  });
  it('percorre linhas dentro dos talhões, com deslocamento compatível com a velocidade', () => {
    for (const farm of dataset.farms) {
      const s = farmSnapshot(farm.id, '2026-03-23');
      for (let elapsed = 0; elapsed < 16000; elapsed += 137) {
        const a = demoTelemetry(s, elapsed, 0),
          b = demoTelemetry(s, elapsed + 1, 1000);
        for (let i = 0; i < 3; i++) {
          const packet = a.packets[i];
          expect(
            inside(packet.position, fieldFootprint(s.fields.find((f) => f.id === packet.fieldId)!)),
          ).toBe(true);
          const distance = Math.hypot(
            b.packets[i].local[0] - packet.local[0],
            b.packets[i].local[1] - packet.local[1],
          );
          expect(distance).toBeLessThanOrEqual([8, 5.5, 12][i] / 3.6 + 1e-6);
          expect(packet.heading).toBeGreaterThanOrEqual(0);
          expect(packet.heading).toBeLessThan(360);
        }
      }
    }
  });
});
