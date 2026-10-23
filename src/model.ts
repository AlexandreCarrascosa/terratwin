import raw from './data/dataset.json';

export type Crop = 'Soja' | 'Milho' | 'Algodão';
export type Layer = 'Cultura' | 'NDVI' | 'Pragas' | 'Colheita';
export type Section = 'overview' | 'fields' | 'storage' | 'fleet' | 'goals';
export type Field = Omit<(typeof raw.fields)[number], 'crop'> & { crop: Crop };
export type Farm = (typeof raw.farms)[number];
export const dataset = raw as Omit<typeof raw, 'fields'> & { fields: Field[] };
export const cropColors: Record<Crop, string> = {
  Soja: '#8aa85c',
  Milho: '#d7ba66',
  Algodão: '#c0c6a6',
};
export const DAY = 86400000;
export const dateNumber = (s: string) => Date.parse(`${s}T12:00:00Z`);
export const dayDiff = (a: string, b: string) => Math.round((dateNumber(a) - dateNumber(b)) / DAY);
export const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));
export const dateAt = (index: number) =>
  new Date(dateNumber(dataset.startDate) + index * DAY).toISOString().slice(0, 10);
export const totalDays = dayDiff(dataset.endDate, dataset.startDate);
export const num = (n: number, digits = 0) =>
  n.toLocaleString('pt-BR', { maximumFractionDigits: digits });
export const shortDate = (s: string) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(
    dateNumber(s),
  );
export const fullDate = (s: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(dateNumber(s));
export function fieldState(field: Field, date: string) {
  const age = dayDiff(date, field.plantDate);
  const cycle = dayDiff(field.harvestDate, field.plantDate);
  const planted = clamp((age + 1) / field.plantDuration);
  const harvested = clamp((dayDiff(date, field.harvestDate) + 1) / field.harvestDuration);
  const ndvi =
    age < 0
      ? 0.16
      : harvested >= 1
        ? 0.21
        : clamp(
            0.24 + 0.62 * Math.sin(clamp(age / (cycle + 12)) * Math.PI) - harvested * 0.2,
            0.15,
            0.91,
          );
  // Surto roteirizado só durante o crescimento; a aplicação encerra o episódio.
  const pest =
    field.id === 'aurora-03' && date >= '2026-03-05' && date <= '2026-03-19'
      ? 72
      : planted > 0 && harvested === 0
        ? Math.round(8 + 10 * Math.abs(Math.sin(age / 17 + field.area)))
        : 0;
  const stage = !planted
    ? 'Planejado'
    : planted < 1
      ? 'Plantio'
      : harvested >= 1
        ? 'Colhido'
        : harvested > 0
          ? 'Colheita'
          : age < 35
            ? 'Vegetativo'
            : age < cycle - 25
              ? 'Reprodutivo'
              : 'Maturação';
  const degreeDays = dataset.weather
    .filter(
      (w) =>
        w.farmId === field.farmId &&
        w.date >= field.plantDate &&
        w.date <= date &&
        w.date <= field.harvestDate,
    )
    .reduce((sum, w) => sum + Math.max(0, w.temperature - (field.crop === 'Algodão' ? 15 : 10)), 0);
  return {
    planted,
    harvested,
    ndvi,
    pest,
    stage,
    degreeDays: Math.round(degreeDays),
    production: harvested * field.area * field.yieldTonHa,
  };
}
export function farmSnapshot(farmId: string, date: string) {
  const farm = dataset.farms.find((f) => f.id === farmId)!;
  const fields = dataset.fields
    .filter((f) => f.farmId === farmId)
    .map((f) => ({ ...f, ...fieldState(f, date) }));
  const area = fields.reduce((s, f) => s + f.area, 0);
  const plantedArea = fields.reduce((s, f) => s + f.area * f.planted, 0);
  const harvestedArea = fields.reduce((s, f) => s + f.area * f.harvested, 0);
  // Algodão em caroço tem cadeia distinta; não entra nos silos de grãos.
  const receivedSoy = fields.filter((f) => f.crop === 'Soja').reduce((s, f) => s + f.production, 0);
  const receivedCorn = fields
    .filter((f) => f.crop === 'Milho')
    .reduce((s, f) => s + f.production, 0);
  const received = receivedSoy + receivedCorn;
  const elapsed = dayDiff(date, dataset.startDate);
  const shippedSoy = Math.min(farm.openingStock + receivedSoy, Math.max(0, elapsed) * 8);
  const shippedCorn = receivedCorn * 0.7; // Expedição simulada de 70% do milho recebido.
  const shipped = shippedSoy + shippedCorn;
  const soyStock = farm.openingStock + receivedSoy - shippedSoy;
  const cornStock = receivedCorn - shippedCorn;
  const stock = soyStock + cornStock;
  const capacity = farm.capacity;
  const weather = dataset.weather.find((w) => w.farmId === farmId && w.date === date)!;
  const rain7 = dataset.weather
    .filter((w) => w.farmId === farmId && w.date <= date && dayDiff(date, w.date) < 7)
    .reduce((s, w) => s + w.rain, 0);
  const hot = farmId === 'aurora' && date >= '2026-03-08' && date <= '2026-03-22';
  const healthySince =
    farmId === 'aurora' && date > '2026-03-22' ? '2026-03-22' : dataset.startDate;
  const healthyDays = hot ? 0 : Math.max(0, dayDiff(date, healthySince));
  const fault = farmId === 'aurora' && date >= '2026-03-10' && date <= '2026-03-17';
  // Compartimentos dedicados: milho não se mistura à soja. Todos os saldos são simulados.
  const silos = [0.34, 0.33, 0.33, 0].map((weight, i) => ({
    id: `${farmId}-s${i + 1}`,
    name: `Silo ${String(i + 1).padStart(2, '0')}`,
    capacity: capacity * (i === 3 ? 0.08 : 0.92 * weight),
    stock: i === 3 ? cornStock : soyStock * weight,
    temperature: hot && i === 1 ? 39.8 : 26.2 + i * 0.7,
    hot: hot && i === 1,
    product: (i === 3 ? 'Milho' : 'Soja') as Crop,
  }));
  const alertCount =
    (hot ? 1 : 0) +
    (fault ? 1 : 0) +
    fields.filter((f) => f.pest >= 50).length +
    (stock / capacity >= 0.85 ? 1 : 0);
  const windowArea = fields.filter((f) => f.inWindow).reduce((s, f) => s + f.area * f.planted, 0);
  return {
    farm,
    fields,
    area,
    plantedArea,
    harvestedArea,
    plantedPct: plantedArea / area,
    harvestedPct: harvestedArea / area,
    windowPct: plantedArea ? windowArea / plantedArea : 0,
    stock,
    soyStock,
    cornStock,
    capacity,
    received,
    shipped,
    free: capacity - stock,
    occupancy: stock / capacity,
    weather,
    rain7,
    hot,
    healthyDays,
    fault,
    silos,
    alertCount,
    ndvi: fields.reduce((s, f) => s + f.ndvi * f.area, 0) / area,
  };
}
export type Snapshot = ReturnType<typeof farmSnapshot>;
export function alertsFor(s: Snapshot) {
  const items: {
    id: string;
    title: string;
    detail: string;
    section: Section;
    level: 'danger' | 'warning';
  }[] = [];
  if (s.hot)
    items.push({
      id: 'heat',
      title: 'Ponto quente no Silo 02',
      detail: '39,8 °C · acima do limite de demonstração de 35 °C',
      section: 'storage',
      level: 'danger',
    });
  s.fields
    .filter((f) => f.pest >= 50)
    .forEach((f) =>
      items.push({
        id: f.id,
        title: `MIP · ${f.name}`,
        detail: `${f.pest}% de incidência simulada · nível de ação: 50%`,
        section: 'fields',
        level: 'warning',
      }),
    );
  if (s.fault)
    items.push({
      id: 'machine',
      title: 'Colhedora CL-01 parada',
      detail: 'DTC DEMO-042 · falha hidráulica simulada',
      section: 'fleet',
      level: 'danger',
    });
  if (s.occupancy >= 0.85)
    items.push({
      id: 'capacity',
      title: 'Armazém próximo da capacidade',
      detail: `${num(s.occupancy * 100)}% ocupado · ${num(s.free)} t livres`,
      section: 'storage',
      level: 'warning',
    });
  return items;
}
export function fieldColor(field: Field, date: string, layer: Layer) {
  const s = fieldState(field, date);
  if (layer === 'NDVI') return s.ndvi > 0.65 ? '#3d854e' : s.ndvi > 0.4 ? '#98af4e' : '#cc9b56';
  if (layer === 'Pragas') return s.pest >= 50 ? '#d1674a' : s.pest > 12 ? '#c6ae60' : '#78a183';
  if (layer === 'Colheita')
    return s.harvested === 1 ? '#ad874e' : s.harvested > 0 ? '#e0c576' : '#699070';
  return s.harvested >= 1 ? '#987953' : s.planted === 0 ? '#a18968' : cropColors[field.crop];
}
