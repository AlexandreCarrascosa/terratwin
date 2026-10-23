import type { Field } from './model';

export type GeoPoint = [number, number];
export const locations: Record<
  string,
  { center: GeoPoint; region: string; state: 'MT' | 'BA'; angle: number }
> = {
  aurora: { center: [-13.74, -56.12], region: 'Nova Mutum · MT', state: 'MT', angle: -12 },
  horizonte: { center: [-16.65, -54.95], region: 'Rondonópolis · MT', state: 'MT', angle: 8 },
  veredas: {
    center: [-12.19, -45.94],
    region: 'Luís Eduardo Magalhães · BA',
    state: 'BA',
    angle: -18,
  },
};

// Coordenadas regionais de demonstração; não são perímetros cadastrais.
export function toGeo(farmId: string, east: number, north: number): GeoPoint {
  const { center, angle } = locations[farmId];
  const a = (angle * Math.PI) / 180;
  const x = east * Math.cos(a) - north * Math.sin(a);
  const y = east * Math.sin(a) + north * Math.cos(a);
  return [center[0] + y / 111320, center[1] + x / (111320 * Math.cos((center[0] * Math.PI) / 180))];
}

export function fieldFootprint(field: Field): GeoPoint[] {
  const shape = [
    [-0.5, -0.48],
    [0.46, -0.5],
    [0.5, 0.33],
    [0.33, 0.5],
    [-0.49, 0.46],
    [-0.52, 0.1],
  ];
  const normalizedArea =
    Math.abs(
      shape.reduce((sum, p, i) => {
        const q = shape[(i + 1) % shape.length];
        return sum + p[0] * q[1] - q[0] * p[1];
      }, 0),
    ) / 2;
  const ratio = field.size[0] / field.size[1];
  const width = Math.sqrt((field.area * 10000 * ratio) / normalizedArea);
  const height = width / ratio;
  return shape.map(([x, y]) =>
    toGeo(field.farmId, field.position[0] * 50 + x * width, -field.position[1] * 50 + y * height),
  );
}

export const machinePoint = (farmId: string, i: number) =>
  toGeo(farmId, [-1300, -1800, 1400][i], [700, 3200, -900][i]);
export const siloPoint = (farmId: string, i: number) => toGeo(farmId, -600 + i * 150, 3450);

export const basemaps = {
  satellite: {
    label: 'Satélite · 2016',
    url: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg',
    attribution:
      '<a href="https://cloudless.eox.at/">EOxCloudless</a> by EOX IT Services GmbH · Contains modified Copernicus Sentinel data 2016 · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>',
    maxNativeZoom: 14,
  },
  streets: {
    label: 'Mapa · OSM',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxNativeZoom: 19,
  },
};
