import { describe, expect, it } from 'vitest';
import { dataset } from './model';
import { fieldFootprint, locations, toGeo } from './geography';

describe('sobreposição geográfica de demonstração', () => {
  it('distribui duas unidades em MT e uma no oeste da Bahia', () => {
    expect(Object.values(locations).filter((l) => l.state === 'MT')).toHaveLength(2);
    expect(Object.values(locations).filter((l) => l.state === 'BA')).toHaveLength(1);
    expect(locations.veredas.center[1]).toBeGreaterThan(-47);
    expect(locations.aurora.center[1]).toBeLessThan(-54);
    expect(toGeo('veredas', 0, 0)).toEqual(locations.veredas.center);
  });
  it('preserva a área de todos os talhões ao projetá-los no mapa', () => {
    for (const f of dataset.fields) {
      const center = locations[f.farmId].center;
      const points = fieldFootprint(f).map(([lat, lng]) => [
        (lng - center[1]) * 111320 * Math.cos((center[0] * Math.PI) / 180),
        (lat - center[0]) * 111320,
      ]);
      const area =
        Math.abs(
          points.reduce((sum, p, i) => {
            const q = points[(i + 1) % points.length];
            return sum + p[0] * q[1] - q[0] * p[1];
          }, 0),
        ) / 2;
      expect(area / 10000).toBeCloseTo(f.area, 5);
      expect(
        fieldFootprint(f).every(([lat, lng]) => lat < -10 && lat > -20 && lng < -44 && lng > -59),
      ).toBe(true);
    }
  });
});
