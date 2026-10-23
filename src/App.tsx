import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Box,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CloudSun,
  Compass,
  Droplets,
  Expand,
  Eye,
  EyeOff,
  Flag,
  Flower2,
  Layers3,
  Leaf,
  Map,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Sprout,
  Table2,
  Thermometer,
  Tractor,
  Trophy,
  Warehouse,
  Wind,
  X,
} from 'lucide-react';
import {
  alertsFor,
  cropColors,
  dataset,
  dateAt,
  dayDiff,
  farmSnapshot,
  fieldState,
  fullDate,
  num,
  shortDate,
  totalDays,
} from './model';
import type { Field, Layer, Section, Snapshot } from './model';
import { locations } from './geography';

const Scene = lazy(() => import('./Scene'));
const GeoMap = lazy(() => import('./GeoMap'));
const navigation: { id: Section; title: string; short: string; icon: typeof Map }[] = [
  { id: 'overview', title: 'Visão geral', short: 'Visão geral', icon: Map },
  { id: 'fields', title: 'Talhões e culturas', short: 'Talhões', icon: Sprout },
  { id: 'storage', title: 'Armazenagem', short: 'Armazém', icon: Warehouse },
  { id: 'fleet', title: 'Frota e manutenção', short: 'Frota', icon: Tractor },
  { id: 'goals', title: 'Metas e conquistas', short: 'Metas', icon: Trophy },
];
const sectionTitles: Record<Section, string> = {
  overview: 'Uma nova perspectiva do campo.',
  fields: 'Cada talhão conta uma história.',
  storage: 'Da colheita ao próximo destino.',
  fleet: 'A força que move a operação.',
  goals: 'Cultivando bons resultados.',
};

function Pill({ children, tone = '' }: { children: ReactNode; tone?: string }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}
function Progress({ value, color }: { value: number; color?: string }) {
  return (
    <div className="progress">
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} />
    </div>
  );
}
function Metric({
  title,
  value,
  unit,
  detail,
  icon: Icon,
  accent = false,
}: {
  title: string;
  value: string;
  unit?: string;
  detail: string;
  icon: typeof Leaf;
  accent?: boolean;
}) {
  return (
    <div className={`metric ${accent ? 'accent' : ''}`}>
      <div className="metric-title">
        {title}
        <Icon size={17} />
      </div>
      <div className="metric-value">
        {value}
        <span>{unit}</span>
      </div>
      <div className="metric-detail">{detail}</div>
    </div>
  );
}
function Modal({
  open,
  close,
  children,
}: {
  open: boolean;
  close: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={close}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
      aria-label="Sobre a demonstração"
    >
      <button onClick={close} className="icon-button modal-close" aria-label="Fechar">
        <X size={20} />
      </button>
      {children}
    </dialog>
  );
}

function FieldDetails({
  field,
  snapshot,
  date,
}: {
  field: Field;
  snapshot: Snapshot;
  date: string;
}) {
  const s = fieldState(field, date);
  return (
    <>
      <div className="detail-heading">
        <span className="crop-dot" style={{ background: cropColors[field.crop] }} />
        <span>{field.crop}</span>
        <Pill>{s.stage}</Pill>
      </div>
      <h2>{field.name}</h2>
      <p className="muted">
        {snapshot.farm.name} · {num(field.area)} hectares
      </p>
      <div className="detail-grid">
        <div>
          <small>NDVI simulado</small>
          <strong>{s.ndvi.toFixed(2).replace('.', ',')}</strong>
        </div>
        <div>
          <small>Graus-dia sintéticos</small>
          <strong>
            {num(s.degreeDays)} <em>°C·dia</em>
          </strong>
        </div>
      </div>
      <div className="detail-block">
        <h4>Desenvolvimento da safra</h4>
        <div className="row">
          <span>Plantio realizado</span>
          <b>{num(s.planted * 100)}%</b>
        </div>
        <Progress value={s.planted * 100} />
        <div className="row">
          <span>Colheita realizada</span>
          <b>{num(s.harvested * 100)}%</b>
        </div>
        <Progress value={s.harvested * 100} color="#bc9c50" />
        <p className="tiny muted">
          Plantio: {shortDate(field.plantDate)} · Colheita prevista: {shortDate(field.harvestDate)}
        </p>
      </div>
      <div className={`detail-block ${s.pest >= 50 ? 'pest-warning' : ''}`}>
        <h4>
          <Activity size={15} /> Monitoramento de pragas
        </h4>
        <div className="row">
          <span>Incidência de exemplo</span>
          <b>{s.pest}%</b>
        </div>
        <Progress value={s.pest} color={s.pest >= 50 ? '#bc654b' : '#8aa77b'} />
        <p className="tiny">
          {s.pest >= 50
            ? 'Nível de ação de demonstração excedido. Aplicação simulada no dia 20/03.'
            : 'Sem alerta de demonstração nesta data.'}
        </p>
      </div>
      <div className="detail-block">
        <h4>Solo · laudo fictício</h4>
        <div className="row">
          <span>pH</span>
          <b>{num(field.soilPh, 1)}</b>
        </div>
        <div className="row">
          <span>Argila</span>
          <b>{field.clay}%</b>
        </div>
        <div className="row">
          <span>Matéria orgânica</span>
          <b>{num(field.organicMatter, 1)}%</b>
        </div>
      </div>
      <p className="source-note">
        Índices, fenologia e limiares ilustrativos. Não constituem recomendação agronômica.
      </p>
    </>
  );
}

function StorageDetails({
  snapshot,
  selected,
  onSelect,
}: {
  snapshot: Snapshot;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const silo = snapshot.silos.find((s) => s.id === selected);
  return (
    <>
      <div className="panel-eyebrow">
        <Warehouse size={15} /> {snapshot.farm.warehouseId}
      </div>
      <h2>{silo ? silo.name : 'Espaço para crescer.'}</h2>
      <p className="muted">
        {silo ? `${silo.product} · nível por silo simulado` : 'Saldo de demonstração por armazém'}
      </p>
      <div className="capacity-ring">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="49" />
          <circle
            cx="60"
            cy="60"
            r="49"
            style={{ strokeDasharray: `${snapshot.occupancy * 308} 308` }}
          />
        </svg>
        <div>
          <strong>
            {num(snapshot.occupancy * 100)}
            <small>%</small>
          </strong>
          <span>ocupação do armazém</span>
        </div>
      </div>
      <div className="row">
        <span>Armazenado</span>
        <b>{num(snapshot.stock)} t</b>
      </div>
      <div className="row">
        <span>Capacidade livre</span>
        <b>{num(snapshot.free)} t</b>
      </div>
      <div className="detail-block">
        <h4>
          Unidades armazenadoras <span className="muted">4</span>
        </h4>
        {snapshot.silos.map((s) => (
          <button
            className={`silo-row ${selected === s.id ? 'chosen' : ''}`}
            key={s.id}
            onClick={() => onSelect(s.id)}
          >
            <Warehouse size={16} />
            <span>
              {s.name}
              <small>
                {s.product} · {num(s.stock)} / {num(s.capacity)} t
              </small>
            </span>
            <b className={s.hot ? 'danger-text' : ''}>{num(s.temperature, 1)} °C</b>
          </button>
        ))}
      </div>
      {silo && (
        <div className={`temperature-box ${silo.hot ? 'hot' : ''}`}>
          <Thermometer size={22} />
          <div>
            <strong>{num(silo.temperature, 1)} °C</strong>
            <p>
              {silo.hot
                ? 'Ponto quente simulado · cabo 02 / sensor 03'
                : 'Termometria simulada estável'}
            </p>
          </div>
        </div>
      )}
      <p className="source-note">
        O EWM é representado por depósito, nunca por silo. O nível individual é simulado. Sem
        conexão com SAP ou sensores.
      </p>
    </>
  );
}

function FleetDetails({
  snapshot,
  selected,
  onSelect,
}: {
  snapshot: Snapshot;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const idx = selected?.startsWith('machine-') ? Number(selected.split('-')[1]) : 1;
  const fault = snapshot.fault && idx === 1;
  return (
    <>
      <div className="panel-eyebrow">
        <Tractor size={15} /> MECANIZAÇÃO
      </div>
      <h2>Prontas para o campo.</h2>
      <p className="muted">3 máquinas · telemetria simulada</p>
      {['Trator · série T', 'Colhedora · série C', 'Pulverizador · série P'].map((name, i) => (
        <button
          className={`machine-row ${idx === i ? 'chosen' : ''}`}
          key={name}
          onClick={() => onSelect(`machine-${i}`)}
        >
          <span className={`machine-icon ${i === 1 ? 'red' : ''}`}>
            <Tractor size={26} />
          </span>
          <span>
            <b>{snapshot.farm.machineIds[i]}</b>
            <small>{name}</small>
            <em>{snapshot.fault && i === 1 ? 'Em falha' : 'Operacional'}</em>
          </span>
          <span className={`status-dot ${snapshot.fault && i === 1 ? 'danger' : ''}`} />
        </button>
      ))}
      <div className="detail-block">
        <h4>{snapshot.farm.machineIds[idx]} · diagnóstico</h4>
        <div className="row">
          <span>Horímetro simulado</span>
          <b>{num(2100 + dayDiff(snapshot.weather.date, dataset.startDate) * 3 + idx * 225)} h</b>
        </div>
        <div className="row">
          <span>Próxima preventiva</span>
          <b>em {65 - idx * 12} h</b>
        </div>
        <div className="row">
          <span>Disponibilidade</span>
          <b>{fault ? 'Parada' : 'Disponível'}</b>
        </div>
      </div>
      {fault ? (
        <div className="temperature-box hot">
          <Activity size={24} />
          <div>
            <strong>DTC DEMO-042</strong>
            <p>
              Falha hidráulica fictícia. Ordem corretiva de exemplo OM-014 aberta em 10/03;
              resolução em 18/03.
            </p>
          </div>
        </div>
      ) : (
        <div className="soft-success">
          <CheckCheck size={20} /> Sem falha ativa nesta data.
        </div>
      )}
      <p className="source-note">
        Ativos genéricos, sem marcas, operadores ou localização real. Nenhuma integração com
        fabricantes.
      </p>
    </>
  );
}

function WeatherCard({ snapshot }: { snapshot: Snapshot }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [live, setLive] = useState<{
    temp: number;
    wind: number;
    humidity: number;
    time: string;
  }>();
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);
  const load = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    setStatus('loading');
    try {
      const response = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=-15.60&longitude=-56.10&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=America%2FCuiaba',
        { signal: controller.signal },
      );
      if (!response.ok) throw new Error('weather');
      const body = await response.json();
      const c = body.current;
      if (
        ![c?.temperature_2m, c?.wind_speed_10m, c?.relative_humidity_2m].every(Number.isFinite) ||
        typeof c.time !== 'string'
      )
        throw new Error('invalid');
      setLive({
        temp: c.temperature_2m,
        wind: c.wind_speed_10m,
        humidity: c.relative_humidity_2m,
        time: c.time,
      });
      setStatus('done');
    } catch {
      setStatus('error');
    } finally {
      window.clearTimeout(timeout);
    }
  };
  return (
    <div className="weather-card">
      <div className="row">
        <h3>O tempo no campo</h3>
        <CloudSun size={23} />
      </div>
      <div className="weather-temp">
        {num(snapshot.weather.temperature, 1)}
        <span>°C</span>
        <Pill>Simulado</Pill>
      </div>
      <div className="weather-grid">
        <span>
          <Droplets size={14} />
          {num(snapshot.rain7, 1)} mm<small>chuva em 7 dias</small>
        </span>
        <span>
          <Wind size={14} />
          {num(snapshot.weather.wind, 1)} km/h<small>vento na data</small>
        </span>
      </div>
      <button className="text-button" onClick={load} disabled={status === 'loading'}>
        {status === 'loading' ? 'Consultando…' : 'Consultar clima público de hoje'}
        <ArrowUpRight size={14} />
      </button>
      {status === 'error' && (
        <p className="tiny danger-text" role="status">
          Consulta indisponível. Tente novamente; o replay usa clima simulado.
        </p>
      )}
      {status === 'done' && live && (
        <div className="live-weather" role="status">
          <b>Cuiabá · referência regional pública</b>
          <span>
            {num(live.temp, 1)} °C · {live.humidity}% UR · {num(live.wind, 1)} km/h
          </span>
          <small>
            {live.time.replace('T', ' às ')} ·{' '}
            <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
              Open-Meteo (CC BY 4.0)
            </a>
            . Não representa as fazendas fictícias nem altera o replay.
          </small>
        </div>
      )}
    </div>
  );
}

function Goals({ snapshot, date }: { snapshot: Snapshot; date: string }) {
  const goals = [
    {
      icon: Sprout,
      title: 'Plantio na janela',
      desc: '95% da área implantada na janela de exemplo.',
      pct: snapshot.windowPct * 100,
      target: 95,
      label: 'da área plantada no prazo',
      complete: snapshot.plantedPct === 1 && snapshot.windowPct >= 0.95,
    },
    {
      icon: Flag,
      title: 'Colheita concluída',
      desc: '100% da área até o encerramento da safra.',
      pct: snapshot.harvestedPct * 100,
      target: 100,
      label: 'da área colhida',
      complete: snapshot.harvestedPct === 1,
    },
    {
      icon: ShieldCheck,
      title: 'Silo saudável',
      desc: '30 dias consecutivos sem ponto quente.',
      pct: Math.min(100, (snapshot.healthyDays / 30) * 100),
      target: 100,
      label: 'da sequência de 30 dias',
      complete: snapshot.healthyDays >= 30,
    },
  ];
  return (
    <div className="goals-page">
      <div className="goals-banner">
        <div>
          <span className="eyebrow">CADA AVANÇO IMPORTA</span>
          <h2>
            Metas que fazem
            <br />a operação florescer.
          </h2>
          <p>Resultados por fazenda. Uma conquista de toda a equipe.</p>
        </div>
        <div className="award-art">
          <Trophy size={76} strokeWidth={1.1} />
          <span>SAFRA 2025/26</span>
        </div>
      </div>
      <div className="goal-grid">
        {goals.map((g) => (
          <article className={`goal-card ${g.complete ? 'complete' : ''}`} key={g.title}>
            <div className="goal-top">
              <span className="goal-medal">
                <g.icon size={29} strokeWidth={1.4} />
              </span>
              <Pill tone={g.complete ? 'success' : ''}>
                {g.complete ? 'Conquistada' : 'Em andamento'}
              </Pill>
            </div>
            <h3>{g.title}</h3>
            <p>{g.desc}</p>
            <div className="goal-percent">
              {num(g.pct)}
              <span>%</span>
            </div>
            <Progress value={g.pct} />
            <small>
              {g.label} · meta: {g.target}%
            </small>
          </article>
        ))}
      </div>
      <div className="comparison">
        <div>
          <span className="eyebrow">EVOLUÇÃO COMPARTILHADA</span>
          <h3>Três fazendas. A mesma direção.</h3>
          <p className="muted">Comparação proporcional à área, na data selecionada.</p>
        </div>
        <div className="comparison-bars">
          {dataset.farms.map((f) => {
            const s = farmSnapshot(f.id, date);
            return (
              <div key={f.id}>
                <div className="row">
                  <b>{f.name}</b>
                  <span>{num(s.harvestedPct * 100)}% colhido</span>
                </div>
                <Progress value={s.harvestedPct * 100} />
              </div>
            );
          })}
        </div>
      </div>
      <p className="source-note">
        Metas ilustrativas e não aprovadas. Sem ranking individual. Volume deve ser avaliado junto à
        qualidade; aprovação, auditoria e regras agronômicas ficam para a versão oficial.
      </p>
    </div>
  );
}

function DataTable({
  snapshot,
  date,
  onSelect,
  selected,
  filter,
}: {
  snapshot: Snapshot;
  date: string;
  onSelect: (id: string) => void;
  selected: string | null;
  filter: string;
}) {
  const fields = snapshot.fields.filter((f) =>
    `${f.name} ${f.crop} ${f.stage}`
      .toLocaleLowerCase('pt-BR')
      .includes(filter.toLocaleLowerCase('pt-BR')),
  );
  return (
    <div className="table-scroll">
      <table>
        <caption className="sr-only">
          Talhões simulados de {snapshot.farm.name} em {fullDate(date)}
        </caption>
        <thead>
          <tr>
            <th>Talhão</th>
            <th>Cultura</th>
            <th>Área</th>
            <th>Estádio</th>
            <th>NDVI</th>
            <th>MIP</th>
            <th>Colheita</th>
            <th>
              <span className="sr-only">Detalhes</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => (
            <tr key={f.id} className={selected === f.id ? 'selected-row' : ''}>
              <td>
                <button className="table-link" onClick={() => onSelect(f.id)}>
                  {f.name}
                </button>
              </td>
              <td>
                <span className="crop-dot" style={{ background: cropColors[f.crop] }} />
                {f.crop}
              </td>
              <td>{num(f.area)} ha</td>
              <td>
                <Pill>{f.stage}</Pill>
              </td>
              <td>{f.ndvi.toFixed(2).replace('.', ',')}</td>
              <td>
                <span className={f.pest >= 50 ? 'danger-text' : ''}>{f.pest}%</span>
              </td>
              <td>{num(f.harvested * 100)}%</td>
              <td>
                <button
                  className="icon-button"
                  onClick={() => onSelect(f.id)}
                  aria-label={`Detalhes de ${f.name}`}
                >
                  <ArrowUpRight size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!fields.length && <p className="empty-state">Nenhum talhão encontrado para “{filter}”.</p>}
    </div>
  );
}

export default function App() {
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const farmId = selectedFarmId ?? dataset.farms[0].id;
  const [section, setSection] = useState<Section>('overview');
  const [dateIndex, setDateIndex] = useState(dayDiff(dataset.defaultDate, dataset.startDate));
  const [layer, setLayer] = useState<Layer>('Cultura');
  const [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState<'Mapa' | '3D' | 'Tabela'>('Mapa');
  const [labels, setLabels] = useState(true);
  const [machines, setMachines] = useState(true);
  const [reset, setReset] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [help, setHelp] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);
  const date = dateAt(dateIndex);
  const snapshot = useMemo(() => farmSnapshot(farmId, date), [farmId, date]);
  const alerts = useMemo(
    () => (selectedFarmId ? alertsFor(snapshot) : []),
    [snapshot, selectedFarmId],
  );
  const allSnapshots = useMemo(() => dataset.farms.map((f) => farmSnapshot(f.id, date)), [date]);
  const scope = selectedFarmId
    ? snapshot
    : {
        area: allSnapshots.reduce((sum, s) => sum + s.area, 0),
        plantedArea: allSnapshots.reduce((sum, s) => sum + s.plantedArea, 0),
        harvestedArea: allSnapshots.reduce((sum, s) => sum + s.harvestedArea, 0),
        stock: allSnapshots.reduce((sum, s) => sum + s.stock, 0),
        free: allSnapshots.reduce((sum, s) => sum + s.free, 0),
        capacity: allSnapshots.reduce((sum, s) => sum + s.capacity, 0),
        get plantedPct() {
          return this.plantedArea / this.area;
        },
        get harvestedPct() {
          return this.harvestedArea / this.area;
        },
        get occupancy() {
          return this.stock / this.capacity;
        },
      };
  const field = dataset.fields.find((f) => f.id === selected);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () =>
        setDateIndex((d) => {
          if (d >= totalDays) {
            setPlaying(false);
            return totalDays;
          }
          return d + 1;
        }),
      600,
    );
    return () => window.clearInterval(timer);
  }, [playing]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const chooseFarm = (id: string) => {
    setSelectedFarmId(id);
    setSelected(null);
    setSearch('');
    setMode('Mapa');
  };
  const overview = () => {
    setSelectedFarmId(null);
    setSelected(null);
    setSection('overview');
    setMode('Mapa');
    setSearch('');
  };
  const chooseSection = (id: Section) => {
    if (!selectedFarmId && id !== 'overview') {
      setNotice('Selecione uma unidade no mapa para abrir seus detalhes.');
      return;
    }
    setSection(id);
    setSelected(null);
    setSearch('');
  };
  const select = (id: string) => {
    setSelected(id);
    if (id.includes('-s')) setSection('storage');
    else if (id.startsWith('machine-')) setSection('fleet');
    else setSection('fields');
  };
  const openAlert = (id: string, target: Section) => {
    setSection(target);
    setSelected(id === 'heat' ? `${farmId}-s2` : id === 'machine' ? 'machine-1' : id);
    setAlertModal(false);
  };
  const exportData = () => {
    const rows = [
      [
        'Fazenda fictícia',
        'Data',
        'Talhão',
        'Cultura',
        'Área ha',
        'Plantio %',
        'Colheita %',
        'NDVI simulado',
        'Incidência simulada %',
      ],
      ...snapshot.fields.map((f) => [
        snapshot.farm.name,
        date,
        f.name,
        f.crop,
        f.area,
        Math.round(f.planted * 100),
        Math.round(f.harvested * 100),
        f.ndvi.toFixed(2),
        f.pest,
      ]),
    ];
    const csv =
      '\uFEFF' +
      rows.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(';')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terratwin-simulado-${farmId}-${date}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('Retrato da safra exportado em CSV.');
  };
  const demo = (
    target: Section,
    selection: string | null = null,
    targetLayer: Layer = 'Cultura',
  ) => {
    chooseFarm('aurora');
    setDateIndex(dayDiff(dataset.defaultDate, dataset.startDate));
    setSection(target);
    setSelected(selection);
    setLayer(targetLayer);
    setMode('3D');
    setPlaying(false);
    setHelp(false);
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Ir para o conteúdo
      </a>
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            chooseSection('overview');
          }}
          aria-label="TerraTwin início"
        >
          <span className="brand-symbol">
            <Sprout size={27} />
          </span>
          <span>
            terra<span className="brand-light">twin</span>
            <small>O CAMPO, CONECTADO.</small>
          </span>
        </a>
        <div className="workspace">
          <span className="workspace-icon">
            <Layers3 size={18} />
          </span>
          <span>
            Meu espaço<small>Projeto demonstrativo</small>
          </span>
          <ChevronDown size={13} />
        </div>
        <span className="nav-label">ACOMPANHAMENTO</span>
        <nav aria-label="Navegação principal">
          {navigation.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${section === n.id ? 'active' : ''}`}
              aria-label={n.title}
              aria-disabled={!selectedFarmId && n.id !== 'overview'}
              aria-current={section === n.id ? 'page' : undefined}
              onClick={() => chooseSection(n.id)}
            >
              <n.icon size={19} />
              <span>{n.title}</span>
              <span className="nav-mobile">{n.short}</span>
              {section === n.id && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <div className="seed-icon">
            <Flower2 size={27} strokeWidth={1.2} />
          </div>
          <b>Um olhar para o futuro.</b>
          <p>Explore o potencial de uma operação agrícola conectada.</p>
          <button onClick={() => setHelp(true)}>
            Conheça o projeto
            <ArrowUpRight size={14} />
          </button>
        </div>
        <button className="help-link" onClick={() => setHelp(true)}>
          <CircleHelp size={18} />
          <span>Guia da demonstração</span>
        </button>
        <div className="sidebar-bottom">
          <span className="status-dot" /> Protótipo pessoal <span>v0.2</span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Meu espaço</span>
            <ChevronRight size={14} />
            <b>{navigation.find((n) => n.id === section)?.title}</b>
          </div>
          <div className="top-actions">
            <span className="simulation-badge">
              <span />
              DADOS SIMULADOS
            </span>
            <button
              className="icon-button notification"
              disabled={!selectedFarmId}
              aria-label={`Abrir alertas: ${alerts.length}`}
              onClick={() => setAlertModal(true)}
            >
              <Bell size={19} />
              {alerts.length > 0 && <i />}
            </button>
            <span className="avatar" title="Usuário fixo de demonstração">
              DE
            </span>
          </div>
        </header>
        <main id="main">
          <div className="page-heading">
            <div>
              <span className="eyebrow">INTELIGÊNCIA TERRITORIAL</span>
              <h1>{sectionTitles[section]}</h1>
              <p>
                {selectedFarmId
                  ? `${snapshot.farm.name} · ${locations[farmId].region}`
                  : 'Selecione uma unidade no mapa para abrir seus detalhes e o 3D.'}
              </p>
            </div>
            <button
              className="secondary-button export-button"
              aria-label="Exportar retrato"
              disabled={!selectedFarmId}
              onClick={exportData}
            >
              <ArrowDownToLine size={16} />
              <span>Exportar retrato</span>
            </button>
          </div>
          {selectedFarmId && (
            <button className="unit-back-button" onClick={overview}>
              ← Todas as unidades · mapa geral
            </button>
          )}
          <div className="farm-selector" role="group" aria-label="Selecionar fazenda">
            {dataset.farms.map((f, i) => {
              const s = f.id === farmId ? snapshot : farmSnapshot(f.id, date);
              return (
                <button
                  className={`farm-card ${f.id === selectedFarmId ? 'active' : ''}`}
                  key={f.id}
                  onClick={() => chooseFarm(f.id)}
                  aria-pressed={f.id === selectedFarmId}
                >
                  <span className={`farm-thumbnail farm-${i}`}>
                    <Sprout size={21} />
                  </span>
                  <span className="farm-name">
                    <b>{f.name}</b>
                    <small>{locations[f.id].region} · demo</small>
                  </span>
                  <span className="farm-card-end">
                    {f.id === selectedFarmId ? (
                      <span className="checked-circle">
                        <Check size={11} />
                      </span>
                    ) : (
                      <ArrowUpRight size={15} />
                    )}
                    <small>{num(s.area)} ha</small>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="metrics">
            <Metric
              title="Área monitorada"
              value={num(scope.area)}
              unit="ha"
              detail={
                selectedFarmId ? '8 talhões · 3 culturas' : '3 unidades · 24 talhões · simulado'
              }
              icon={Sprout}
            />
            <Metric
              title="Plantio realizado"
              value={num(scope.plantedPct * 100)}
              unit="%"
              detail={`${num(scope.plantedArea)} ha da área planejada`}
              icon={Leaf}
            />
            <Metric
              title="Colheita realizada"
              value={num(scope.harvestedPct * 100)}
              unit="%"
              detail={`${num(scope.harvestedArea)} ha nesta safra`}
              icon={Flag}
            />
            <Metric
              title="Grãos armazenados"
              value={num(scope.stock)}
              unit="t"
              detail={`${num(scope.occupancy * 100)}% ocupado · ${num(scope.free)} t livres`}
              icon={Warehouse}
              accent
            />
          </div>
          {section === 'goals' ? (
            <Goals snapshot={snapshot} date={date} />
          ) : (
            <div className="operation-grid">
              <section className="map-card" aria-label="Gêmeo digital da fazenda">
                <div className="map-toolbar">
                  <div className="map-title">
                    <span className="live-dot" />
                    <h2>
                      {!selectedFarmId
                        ? 'Mapa das unidades'
                        : section === 'storage'
                          ? 'Complexo de armazenagem'
                          : section === 'fleet'
                            ? 'Operação no campo'
                            : 'Gêmeo digital'}
                    </h2>
                    <span className="subtle-tag">EXPLORAR</span>
                  </div>
                  <div className="segmented" aria-label="Visualização">
                    <button
                      className={mode === 'Mapa' ? 'active' : ''}
                      onClick={() => setMode('Mapa')}
                      aria-pressed={mode === 'Mapa'}
                    >
                      <Map size={14} />
                      Mapa
                    </button>
                    <button
                      disabled={!selectedFarmId}
                      className={mode === '3D' ? 'active' : ''}
                      onClick={() => setMode('3D')}
                      aria-pressed={mode === '3D'}
                    >
                      <Box size={14} />
                      3D
                    </button>
                    <button
                      disabled={!selectedFarmId}
                      className={mode === 'Tabela' ? 'active' : ''}
                      onClick={() => setMode('Tabela')}
                      aria-pressed={mode === 'Tabela'}
                    >
                      <Table2 size={14} />
                      Tabela
                    </button>
                  </div>
                </div>
                <div className="map-body" ref={mapRef}>
                  {mode === 'Mapa' ? (
                    <Suspense
                      fallback={
                        <div className="scene-loading">
                          <Map size={28} />
                          <span>Preparando o mapa…</span>
                        </div>
                      }
                    >
                      <GeoMap
                        farmId={selectedFarmId}
                        date={date}
                        layer={layer}
                        section={section}
                        selected={selected}
                        snapshot={snapshot}
                        onSelect={select}
                        onFarmSelect={chooseFarm}
                        onOverview={overview}
                        on3D={() => setMode('3D')}
                      />
                    </Suspense>
                  ) : mode === '3D' ? (
                    <>
                      <Suspense
                        fallback={
                          <div className="scene-loading">
                            <Sprout size={32} />
                            <span>Preparando o campo…</span>
                          </div>
                        }
                      >
                        <Scene
                          farmId={farmId}
                          date={date}
                          layer={layer}
                          section={section}
                          selected={selected}
                          onSelect={select}
                          machines={machines}
                          labels={labels}
                          reset={reset}
                          snapshot={snapshot}
                        />
                      </Suspense>
                      <div className="map-location">
                        <span className="eyebrow">MODELO ESPACIAL ILUSTRATIVO</span>
                        <b>{snapshot.farm.name}</b>
                        <span>Terreno e limites fictícios · sem escala geográfica</span>
                      </div>
                      <div className="map-controls">
                        <button
                          className="map-control"
                          title="Reposicionar câmera"
                          aria-label="Reposicionar câmera"
                          onClick={() => setReset((r) => r + 1)}
                        >
                          <RotateCcw size={17} />
                        </button>
                        <button
                          className={`map-control ${labels ? 'on' : ''}`}
                          title="Mostrar rótulos"
                          aria-label="Alternar rótulos"
                          aria-pressed={labels}
                          onClick={() => setLabels(!labels)}
                        >
                          {labels ? <Eye size={17} /> : <EyeOff size={17} />}
                        </button>
                        <button
                          className={`map-control ${machines ? 'on' : ''}`}
                          title="Mostrar máquinas"
                          aria-label="Alternar máquinas"
                          aria-pressed={machines}
                          onClick={() => setMachines(!machines)}
                        >
                          <Tractor size={17} />
                        </button>
                        <button
                          className="map-control"
                          title="Tela cheia"
                          aria-label="Tela cheia"
                          onClick={() => {
                            const p = document.fullscreenElement
                              ? document.exitFullscreen()
                              : mapRef.current?.requestFullscreen();
                            p?.catch(() => setNotice('Tela cheia indisponível neste navegador.'));
                          }}
                        >
                          <Expand size={17} />
                        </button>
                      </div>
                      <div className="compass" aria-hidden="true">
                        <span>N</span>
                        <Compass size={36} strokeWidth={1} />
                      </div>
                      <div className="map-hint">
                        <Maximize2 size={12} />
                        <span>Arraste para orbitar · role para aproximar</span>
                      </div>
                      <div className="map-legend">
                        {layer === 'Cultura' ? (
                          (Object.keys(cropColors) as (keyof typeof cropColors)[]).map((c) => (
                            <span key={c}>
                              <i style={{ background: cropColors[c] }} />
                              {c}
                            </span>
                          ))
                        ) : layer === 'NDVI' ? (
                          <>
                            <span>
                              <i style={{ background: '#cc9b56' }} />
                              Baixo
                            </span>
                            <span>
                              <i style={{ background: '#98af4e' }} />
                              Médio
                            </span>
                            <span>
                              <i style={{ background: '#3d854e' }} />
                              Alto
                            </span>
                          </>
                        ) : layer === 'Pragas' ? (
                          <>
                            <span>
                              <i style={{ background: '#78a183' }} />
                              Baixa incidência
                            </span>
                            <span>
                              <i style={{ background: '#d1674a' }} />
                              Alerta ≥50%
                            </span>
                          </>
                        ) : (
                          <>
                            <span>
                              <i style={{ background: '#699070' }} />A colher
                            </span>
                            <span>
                              <i style={{ background: '#e0c576' }} />
                              Em colheita
                            </span>
                            <span>
                              <i style={{ background: '#ad874e' }} />
                              Colhido
                            </span>
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="table-view">
                      <div className="table-search">
                        <Search size={16} />
                        <input
                          aria-label="Buscar talhão ou cultura"
                          placeholder="Buscar talhão, cultura ou estádio…"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </div>
                      <DataTable
                        snapshot={snapshot}
                        date={date}
                        selected={selected}
                        onSelect={select}
                        filter={search}
                      />
                      {section === 'storage' && (
                        <div className="warehouse-table">
                          <h3>Armazém {snapshot.farm.warehouseId} · saldo simulado</h3>
                          {snapshot.silos.map((s) => (
                            <button key={s.id} className="silo-row" onClick={() => select(s.id)}>
                              <span>{s.name}</span>
                              <b>{num(s.stock)} t</b>
                              <span>{num(s.temperature, 1)} °C</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {section === 'fleet' && (
                        <p className="source-note">
                          A lista de máquinas e seus detalhes estão no painel ao lado.
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="layer-toolbar">
                  <span>
                    <Layers3 size={15} />
                    Camadas
                  </span>
                  <div role="group" aria-label="Camadas do mapa">
                    {(['Cultura', 'NDVI', 'Pragas', 'Colheita'] as Layer[]).map((l) => (
                      <button
                        className={layer === l ? 'active' : ''}
                        key={l}
                        disabled={!selectedFarmId}
                        onClick={() => {
                          setLayer(l);
                          if (mode === 'Tabela')
                            setNotice(
                              `A coluna ${l === 'Cultura' ? 'Cultura' : l === 'Pragas' ? 'MIP' : l} está disponível na tabela. Abra o mapa para ver a camada espacial.`,
                            );
                        }}
                        aria-pressed={layer === l}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
              <aside className="insight-panel" aria-label="Detalhes da operação">
                {!selectedFarmId ? (
                  <div className="unit-overview-panel">
                    <span className="eyebrow">COMECE PELO TERRITÓRIO</span>
                    <h2>
                      Escolha onde
                      <br />
                      quer olhar.
                    </h2>
                    <p>
                      Duas unidades em Mato Grosso e uma no oeste da Bahia. Selecione um marcador
                      para aproximar a operação.
                    </p>
                    {dataset.farms.map((f) => (
                      <button
                        className="unit-overview-row"
                        key={f.id}
                        onClick={() => chooseFarm(f.id)}
                      >
                        <span className="unit-state-tag">{locations[f.id].state}</span>
                        <span>
                          <b>{f.name}</b>
                          <small>{locations[f.id].region}</small>
                        </span>
                        <ArrowUpRight size={15} />
                      </button>
                    ))}
                    <div className="unit-map-note">
                      <Map size={20} />
                      <div>
                        <b>Mapa real. Cenário demonstrativo.</b>
                        <p>
                          Fundo de satélite público e posições regionais de referência. Talhões,
                          ativos e operação fictícios.
                        </p>
                      </div>
                    </div>
                    <p className="source-note">
                      Os detalhes, a tabela e a visualização 3D são liberados depois de selecionar
                      uma unidade.
                    </p>
                  </div>
                ) : field ? (
                  <div className="insight-content">
                    <button className="panel-back" onClick={() => setSelected(null)}>
                      ← Todos os talhões
                    </button>
                    <FieldDetails field={field} snapshot={snapshot} date={date} />
                  </div>
                ) : section === 'storage' ? (
                  <div className="insight-content">
                    <StorageDetails snapshot={snapshot} selected={selected} onSelect={select} />
                  </div>
                ) : section === 'fleet' ? (
                  <div className="insight-content">
                    <FleetDetails snapshot={snapshot} selected={selected} onSelect={select} />
                  </div>
                ) : (
                  <>
                    <div className="alerts-section">
                      <div className="row">
                        <h3>Atenção no campo</h3>
                        <span className="count-badge">{alerts.length}</span>
                      </div>
                      <p className="muted small">O que merece o seu olhar agora.</p>
                      <div className="alert-list">
                        {alerts.length ? (
                          alerts.map((a) => (
                            <button
                              key={a.id}
                              className="alert-card"
                              onClick={() => openAlert(a.id, a.section)}
                            >
                              <span className={`alert-mark ${a.level}`}>
                                <Activity size={15} />
                              </span>
                              <span>
                                <b>{a.title}</b>
                                <small>{a.detail}</small>
                                <em>
                                  Ver detalhes <ArrowRight size={12} />
                                </em>
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="empty-alerts">
                            <ShieldCheck size={28} />
                            <b>Tudo em equilíbrio.</b>
                            <span>Sem alertas simulados nesta data.</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <WeatherCard snapshot={snapshot} />
                    <button className="achievement-peek" onClick={() => chooseSection('goals')}>
                      <span>
                        <Trophy size={21} />
                      </span>
                      <div>
                        <b>Cada avanço, uma conquista.</b>
                        <small>Acompanhe as metas da safra</small>
                      </div>
                      <ChevronRight size={15} />
                    </button>
                  </>
                )}
              </aside>
            </div>
          )}
          <section className="timeline" aria-label="Linha do tempo da safra">
            <div className="timeline-heading">
              <div>
                <span className="eyebrow">UMA SAFRA, MUITAS HISTÓRIAS</span>
                <h3>
                  Linha do tempo <span>2025/26</span>
                </h3>
              </div>
              <div className="timeline-date">
                <span className="replay-label">REPLAY</span>
                <time dateTime={date}>{fullDate(date)}</time>
                <button
                  className="icon-button"
                  aria-label="Voltar à data da demonstração"
                  onClick={() => {
                    setDateIndex(dayDiff(dataset.defaultDate, dataset.startDate));
                    setPlaying(false);
                  }}
                >
                  <RotateCcw size={15} />
                </button>
              </div>
            </div>
            <div className="timeline-controls">
              <button
                className="play-button"
                onClick={() => {
                  if (dateIndex === totalDays) setDateIndex(0);
                  setPlaying(!playing);
                }}
                aria-label={playing ? 'Pausar replay' : 'Reproduzir safra'}
              >
                {playing ? (
                  <Pause size={17} fill="currentColor" />
                ) : (
                  <Play size={17} fill="currentColor" />
                )}
              </button>
              <div className="timeline-track">
                <input
                  type="range"
                  min={0}
                  max={totalDays}
                  value={dateIndex}
                  onChange={(e) => {
                    setDateIndex(Number(e.target.value));
                    setPlaying(false);
                  }}
                  aria-label="Data da safra"
                  aria-valuetext={fullDate(date)}
                  style={
                    { '--progress': `${(dateIndex / totalDays) * 100}%` } as React.CSSProperties
                  }
                />
                <div className="timeline-months">
                  <span>SET 25</span>
                  <span>NOV</span>
                  <span>JAN 26</span>
                  <span>MAR</span>
                  <span>MAI</span>
                  <span>JUL</span>
                  <span>AGO</span>
                </div>
              </div>
            </div>
            <div className="timeline-events">
              <button
                onClick={() => {
                  setDateIndex(dayDiff('2025-10-08', dataset.startDate));
                  setPlaying(false);
                }}
              >
                <i className="green" />
                Início do plantio
              </button>
              <button
                onClick={() => {
                  setDateIndex(dayDiff('2026-02-04', dataset.startDate));
                  setPlaying(false);
                }}
              >
                <i className="gold" />
                Colheita da soja
              </button>
              <button
                onClick={() => {
                  setDateIndex(dayDiff('2026-03-12', dataset.startDate));
                  setPlaying(false);
                }}
              >
                <i className="orange" />
                Eventos de demonstração
              </button>
            </div>
          </section>
          <footer>
            <span>
              <Sprout size={13} />
              TerraTwin · Feito para explorar possibilidades.
            </span>
            <span>
              Base geográfica real · limites e operação fictícios · seed 42
              <button onClick={() => setHelp(true)}>
                Fontes e escopo
                <ArrowUpRight size={12} />
              </button>
            </span>
          </footer>
        </main>
      </div>
      <Modal open={help} close={() => setHelp(false)}>
        <span className="modal-icon">
          <Sprout size={29} />
        </span>
        <span className="eyebrow">BEM-VINDO AO TERRATWIN</span>
        <h2>
          O campo tem uma história.
          <br />
          Explore cada perspectiva.
        </h2>
        <p>
          Protótipo pessoal, sem vínculo com empresas. Três fazendas, 24 talhões, uma safra
          reprodutível e cinco passos para explorar em cerca de 15 minutos.
        </p>
        <div className="demo-steps">
          {[
            [
              '01',
              'Conheça a operação',
              'Voe entre as três fazendas e compare os indicadores.',
              () => demo('overview'),
            ],
            [
              '02',
              'Encontre o problema no talhão',
              'NDVI, pragas, fenologia e solo no Talhão 03.',
              () => demo('fields', 'aurora-03', 'Pragas'),
            ],
            [
              '03',
              'Olhe para dentro do armazém',
              'Explore o ponto quente no Silo 02 e a capacidade livre.',
              () => demo('storage', 'aurora-s2'),
            ],
            [
              '04',
              'Acompanhe as máquinas',
              'Veja a falha simulada e a manutenção da colhedora.',
              () => demo('fleet', 'machine-1'),
            ],
            [
              '05',
              'Celebre os resultados',
              'Compare metas e percorra a safra pela linha do tempo.',
              () => demo('goals'),
            ],
          ].map(([n, title, desc, action]) => (
            <button key={String(n)} onClick={action as () => void}>
              <span>{String(n)}</span>
              <div>
                <b>{String(title)}</b>
                <small>{String(desc)}</small>
              </div>
              <ArrowUpRight size={16} />
            </button>
          ))}
        </div>
        <div className="scope-note">
          <b>Sobre os dados e a entrega</b>
          <p>
            O mapa Leaflet usa mosaico Sentinel-2 EOX de 2016 (CC BY 4.0) ou OpenStreetMap. As
            posições são referências regionais: duas em MT e uma na BA. Limites, NDVI, clima do
            replay e toda a operação são sintéticos. O clima público atual é opcional e usa o
            Open-Meteo para uma referência regional em Cuiabá. O 3D usa relevo procedural, sem DEM
            real, login, escrita de dados ou integração corporativa nesta versão.
          </p>
          <p>
            Modelos 3D gerados em código e dependências open source. O README contém instalação,
            arquitetura, roteiro e evolução para dados geográficos reais.
          </p>
        </div>
      </Modal>
      <Modal open={alertModal} close={() => setAlertModal(false)}>
        <span className="eyebrow">CENTRAL DE EVENTOS</span>
        <h2>Atenção no campo</h2>
        <p>
          {snapshot.farm.name} · {fullDate(date)}
        </p>
        <div className="alert-list">
          {alerts.length ? (
            alerts.map((a) => (
              <button className="alert-card" key={a.id} onClick={() => openAlert(a.id, a.section)}>
                <span className={`alert-mark ${a.level}`}>
                  <Bell size={17} />
                </span>
                <span>
                  <b>{a.title}</b>
                  <small>{a.detail}</small>
                  <em>
                    Abrir no contexto
                    <ArrowRight size={13} />
                  </em>
                </span>
              </button>
            ))
          ) : (
            <p>Nenhum alerta nesta data. Explore os eventos em 12 de março de 2026.</p>
          )}
        </div>
      </Modal>
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
        </div>
      )}
    </div>
  );
}
