import { describe, expect, it } from 'vitest';
import { alertsFor, dataset, dateAt, dayDiff, farmSnapshot, fieldState, totalDays } from './model';

describe('safra reproduzível', () => {
  it('contém só três fazendas fictícias, 24 talhões e um ano completo', () => {
    expect(dataset.simulated).toBe(true);
    expect(dataset.seed).toBe(42);
    expect(dataset.farms).toHaveLength(3);
    expect(dataset.fields).toHaveLength(24);
    expect(dataset.weather).toHaveLength((totalDays + 1) * 3);
    expect(dateAt(totalDays)).toBe(dataset.endDate);
    expect(dayDiff('2026-03-12', '2026-03-11')).toBe(1);
  });

  it('conserva massa, capacidade e percentuais em todos os dias e fazendas', () => {
    for (let d = 0; d <= totalDays; d++) {
      for (const farm of dataset.farms) {
        const s = farmSnapshot(farm.id, dateAt(d));
        expect(s.stock).toBeCloseTo(farm.openingStock + s.received - s.shipped, 7);
        expect(s.silos.reduce((sum, silo) => sum + silo.stock, 0)).toBeCloseTo(s.stock, 7);
        expect(s.silos.reduce((sum, silo) => sum + silo.capacity, 0)).toBeCloseTo(s.capacity, 7);
        expect(s.stock).toBeGreaterThanOrEqual(0);
        expect(s.free).toBeGreaterThanOrEqual(0);
        expect(s.plantedPct).toBeGreaterThanOrEqual(s.harvestedPct);
        expect(s.plantedPct).toBeLessThanOrEqual(1);
        expect(s.harvestedPct).toBeLessThanOrEqual(1);
        expect(alertsFor(s)).toHaveLength(s.alertCount);
        for (const silo of s.silos) {
          expect(silo.stock, `${dateAt(d)} ${silo.id}`).toBeGreaterThanOrEqual(0);
          expect(silo.stock, `${dateAt(d)} ${silo.id}`).toBeLessThanOrEqual(silo.capacity);
        }
      }
    }
  });

  it('não colhe antes do plantio nem conta algodão como grão', () => {
    for (const field of dataset.fields) {
      expect(fieldState(field, dataset.startDate).planted).toBe(0);
      expect(fieldState(field, field.plantDate).harvested).toBe(0);
      expect(fieldState(field, dataset.endDate).harvested).toBe(1);
    }
    const s = farmSnapshot('aurora', dataset.endDate);
    expect(s.received).toBeCloseTo(
      s.fields.filter((f) => f.crop !== 'Algodão').reduce((sum, f) => sum + f.production, 0),
    );
  });

  it('mostra e resolve os eventos roteirizados na data correta', () => {
    const demo = farmSnapshot('aurora', dataset.defaultDate);
    expect(demo.hot).toBe(true);
    expect(demo.fault).toBe(true);
    expect(demo.fields.find((f) => f.id === 'aurora-03')?.pest).toBe(72);
    const resolved = farmSnapshot('aurora', '2026-03-23');
    expect(resolved.hot).toBe(false);
    expect(resolved.fault).toBe(false);
    expect(resolved.fields.find((f) => f.id === 'aurora-03')!.pest).toBeLessThan(50);
    expect(farmSnapshot('horizonte', dataset.defaultDate).occupancy).toBeGreaterThan(0.85);
    expect(farmSnapshot('horizonte', dataset.defaultDate).windowPct).toBe(1);
  });
});
