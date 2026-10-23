import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  ArrowLeft,
  Building2,
  Crosshair,
  Eye,
  Layers3,
  Map as MapIcon,
  Satellite,
  Tractor,
} from 'lucide-react';
import type { Layer, Section, Snapshot } from './model';
import { cropColors, dataset, fieldColor, num } from './model';
import { basemaps, fieldFootprint, locations, machinePoint, siloPoint, toGeo } from './geography';
import 'leaflet/dist/leaflet.css';

type Props = {
  farmId: string | null;
  date: string;
  layer: Layer;
  section: Section;
  selected: string | null;
  snapshot: Snapshot;
  onSelect: (id: string) => void;
  onFarmSelect: (id: string) => void;
  onOverview: () => void;
  on3D: () => void;
};

// Texto dos registros nunca é interpolado como HTML.
function textLabel(title: string, subtitle?: string) {
  const root = document.createElement('div');
  const b = document.createElement('b');
  b.textContent = title;
  root.append(b);
  if (subtitle) {
    const span = document.createElement('span');
    span.textContent = subtitle;
    root.append(span);
  }
  return root;
}
function unitIcon(state: string) {
  return L.divIcon({
    className: 'unit-marker-wrapper',
    iconSize: [54, 65],
    iconAnchor: [27, 59],
    html: `<div class="unit-marker"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21V10l9-7 9 7v11H3Zm5 0v-7h8v7M3 10h18M12 3v7"/></svg><span>${state === 'BA' ? 'BA' : 'MT'}</span></div>`,
  });
}
function assetIcon(type: 'silo' | 'machine', danger: boolean, selected: boolean) {
  const path =
    type === 'silo'
      ? '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 4 14 4 14 0V6M5 12c0 4 14 4 14 0"/>'
      : '<path d="M3 17h18M5 17V8h9l3 5h4v4M9 8V4h5v4"/><circle cx="7" cy="18" r="3"/><circle cx="18" cy="18" r="2"/>';
  return L.divIcon({
    className: 'asset-marker-wrapper',
    iconSize: [29, 29],
    iconAnchor: [14, 14],
    html: `<div class="asset-marker ${type} ${danger ? 'danger' : ''} ${selected ? 'selected' : ''}"><svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg></div>`,
  });
}

export default function GeoMap(props: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const overlays = useRef<L.LayerGroup | null>(null);
  const [base, setBase] = useState<keyof typeof basemaps>('satellite');
  const [opacity, setOpacity] = useState(0.23);
  const [labels, setLabels] = useState(true);
  const [assets, setAssets] = useState(true);
  const [reset, setReset] = useState(0);
  const [tileError, setTileError] = useState(false);
  const { farmId, snapshot, onSelect, onFarmSelect } = props;
  const background = basemaps[base];

  useEffect(() => {
    const map = L.map(container.current!, {
      center: [-14, -51],
      zoom: 5,
      minZoom: 3,
      maxZoom: 18,
      zoomControl: false,
    });
    mapRef.current = map;
    overlays.current = L.layerGroup().addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);
    const resize = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    resize.observe(container.current!);
    return () => {
      resize.disconnect();
      map.remove();
      mapRef.current = null;
      overlays.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current!;
    setTileError(false);
    const tiles = L.tileLayer(background.url, {
      attribution: background.attribution,
      maxNativeZoom: background.maxNativeZoom,
      maxZoom: 18,
      updateWhenIdle: true,
      keepBuffer: 1,
    }).addTo(map);
    tiles.on('tileerror', () => setTileError(true));
    return () => {
      tiles.off();
      tiles.remove();
    };
  }, [background]);

  useEffect(() => {
    const group = overlays.current!;
    group.clearLayers();
    if (!farmId) {
      dataset.farms.forEach((f) => {
        L.marker(locations[f.id].center, {
          icon: unitIcon(locations[f.id].state),
          title: `Selecionar ${f.name}`,
          alt: `Selecionar ${f.name}`,
        })
          .bindTooltip(textLabel(f.name, locations[f.id].region), {
            permanent: true,
            direction: 'bottom',
            offset: [0, 5],
            className: 'unit-map-tooltip',
          })
          .on('click', () => onFarmSelect(f.id))
          .addTo(group);
      });
      return;
    }
    L.polyline([toGeo(farmId, -350, 3850), toGeo(farmId, -350, -2700)], {
      color: '#e8d9b2',
      weight: 3,
      opacity: 0.7,
      dashArray: '5 5',
    }).addTo(group);
    snapshot.fields.forEach((f) => {
      const color = fieldColor(f, props.date, props.layer);
      const polygon = L.polygon(fieldFootprint(f), {
        color: props.selected === f.id ? '#fff4ba' : color,
        fillColor: color,
        fillOpacity: opacity,
        weight: props.selected === f.id ? 3 : 1.8,
        opacity: 0.95,
      })
        .on('click', () => onSelect(f.id))
        .addTo(group);
      if (labels)
        polygon.bindTooltip(
          textLabel(
            f.name.replace('Talhão ', 'T'),
            props.layer === 'NDVI'
              ? f.ndvi.toFixed(2)
              : props.layer === 'Pragas'
                ? `${f.pest}%`
                : f.crop,
          ),
          {
            permanent: true,
            direction: 'center',
            className: `field-map-tooltip ${props.selected === f.id ? 'selected' : ''}`,
          },
        );
      const element = polygon.getElement();
      if (element) {
        element.setAttribute('role', 'button');
        element.setAttribute('tabindex', '0');
        element.setAttribute('aria-label', `Selecionar ${f.name}`);
        element.addEventListener('keydown', (event) => {
          const key = (event as KeyboardEvent).key;
          if (key === 'Enter' || key === ' ') {
            event.preventDefault();
            onSelect(f.id);
          }
        });
      }
      if (props.layer === 'Pragas' && f.pest >= 50) {
        const point = toGeo(farmId, f.position[0] * 50, -f.position[1] * 50);
        [180, 330, 480].forEach((radius, i) =>
          L.circle(point, {
            radius,
            color: '#ef8050',
            weight: 0,
            fillOpacity: 0.16 - i * 0.04,
            interactive: false,
          }).addTo(group),
        );
      }
    });
    if (assets) {
      snapshot.silos.forEach((s, i) =>
        L.marker(siloPoint(farmId, i), {
          icon: assetIcon('silo', s.hot, props.selected === s.id),
          title: `Selecionar ${s.name}`,
          alt: `Selecionar ${s.name}`,
        })
          .bindTooltip(
            textLabel(
              s.name,
              `${num((s.stock / s.capacity) * 100)}% · ${num(s.temperature, 1)} °C`,
            ),
            { direction: 'top' },
          )
          .on('click', () => onSelect(s.id))
          .addTo(group),
      );
      snapshot.farm.machineIds.forEach((id, i) =>
        L.marker(machinePoint(farmId, i), {
          icon: assetIcon('machine', snapshot.fault && i === 1, props.selected === `machine-${i}`),
          title: `Selecionar máquina ${id}`,
          alt: `Selecionar máquina ${id}`,
        })
          .bindTooltip(
            textLabel(id, `${snapshot.fault && i === 1 ? 'Em falha' : 'Operacional'} · simulado`),
            { direction: 'top' },
          )
          .on('click', () => onSelect(`machine-${i}`))
          .addTo(group),
      );
    }
  }, [
    farmId,
    snapshot,
    props.date,
    props.layer,
    props.selected,
    labels,
    assets,
    opacity,
    onSelect,
    onFarmSelect,
  ]);

  useEffect(() => {
    const map = mapRef.current!;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fields = dataset.fields.filter((f) => f.farmId === farmId);
    const selectedField = fields.find((f) => f.id === props.selected);
    let bounds = farmId
      ? L.latLngBounds([...fields.flatMap(fieldFootprint), toGeo(farmId, 0, 3950)])
      : L.latLngBounds(Object.values(locations).map((l) => l.center));
    if (selectedField) bounds = L.latLngBounds(fieldFootprint(selectedField)).pad(0.2);
    if (farmId && props.section === 'storage')
      bounds = L.latLngBounds([toGeo(farmId, -1250, 3050), toGeo(farmId, 700, 3950)]);
    map.flyToBounds(bounds, {
      padding: [farmId ? 45 : 65, farmId ? 75 : 85],
      maxZoom: props.section === 'storage' ? 16 : 14,
      duration: reduced ? 0 : 1.1,
      animate: !reduced,
    });
  }, [farmId, props.section, props.selected, reset]);

  return (
    <div className={`geo-map ${base}`} data-testid="geographic-map">
      <div ref={container} className="geo-map-canvas" aria-label="Mapa geográfico das unidades" />
      <div className="geo-heading">
        <span className="eyebrow">
          {farmId ? 'BASE REAL · SOBREPOSIÇÃO DEMONSTRATIVA' : 'TERRITÓRIO CONECTADO'}
        </span>
        <b>{farmId ? snapshot.farm.name : 'Três unidades. Duas regiões.'}</b>
        <span>
          {farmId
            ? `${locations[farmId].region} · posição de demonstração`
            : '2 em Mato Grosso · 1 na Bahia · selecione para explorar'}
        </span>
      </div>
      <div className="geo-basemaps" role="group" aria-label="Fundo do mapa">
        <button
          onClick={() => setBase('satellite')}
          className={base === 'satellite' ? 'active' : ''}
          aria-pressed={base === 'satellite'}
        >
          <Satellite size={13} />
          Satélite 2016
        </button>
        <button
          onClick={() => setBase('streets')}
          className={base === 'streets' ? 'active' : ''}
          aria-pressed={base === 'streets'}
        >
          <MapIcon size={13} />
          Mapa
        </button>
      </div>
      <div className="geo-tools">
        <button
          onClick={() => setReset((r) => r + 1)}
          aria-label="Enquadrar unidades"
          title="Enquadrar"
        >
          <Crosshair size={16} />
        </button>
        {farmId && (
          <>
            <button
              onClick={() => setLabels(!labels)}
              aria-label="Alternar rótulos geográficos"
              aria-pressed={labels}
            >
              <Eye size={16} />
            </button>
            <button
              onClick={() => setAssets(!assets)}
              aria-label="Alternar ativos geográficos"
              aria-pressed={assets}
            >
              <Tractor size={16} />
            </button>
          </>
        )}
      </div>
      {farmId ? (
        <>
          <div className="geo-unit-actions">
            <button onClick={props.onOverview}>
              <ArrowLeft size={13} />
              Todas as unidades
            </button>
            <button className="primary" onClick={props.on3D}>
              <Building2 size={13} />
              Explorar em 3D
            </button>
          </div>
          <div className="geo-opacity">
            <Layers3 size={13} />
            <label htmlFor="overlay-opacity">Sobreposição</label>
            <input
              id="overlay-opacity"
              type="range"
              min={0}
              max={75}
              value={Math.round(opacity * 100)}
              onChange={(e) => setOpacity(Number(e.target.value) / 100)}
            />
            <span>{Math.round(opacity * 100)}%</span>
          </div>
        </>
      ) : (
        <div className="geo-select-hint">
          Selecione um marcador ou um cartão de unidade para ver talhões, indicadores e 3D.
        </div>
      )}
      {tileError && (
        <div className="geo-tile-error" role="status">
          Algumas imagens não carregaram.{' '}
          <button onClick={() => setBase(base === 'satellite' ? 'streets' : 'satellite')}>
            Trocar fundo
          </button>{' '}
          · os dados seguem disponíveis na tabela.
        </div>
      )}
      <div className="geo-origin">
        {base === 'satellite'
          ? 'Mosaico histórico de 2016 · não acompanha a data do replay'
          : 'Cartografia OpenStreetMap'}{' '}
        · limites operacionais fictícios
      </div>
      {farmId && (
        <div className="geo-crop-legend">
          {Object.entries(cropColors).map(([name, color]) => (
            <span key={name}>
              <i style={{ background: color }} />
              {name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
