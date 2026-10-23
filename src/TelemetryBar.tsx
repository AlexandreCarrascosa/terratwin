import { Pause, Play, Radio, Tractor } from 'lucide-react';
import type { TelemetryFrame } from './telemetry';

export const packetTime = (timestamp: number) =>
  new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/Cuiaba',
  }).format(timestamp);
export default function TelemetryBar({
  frame,
  running,
  rate,
  onToggle,
  onRate,
}: {
  frame: TelemetryFrame;
  running: boolean;
  rate: number;
  onToggle: () => void;
  onRate: (rate: number) => void;
}) {
  return (
    <div className={`telemetry-bar ${running ? 'running' : ''}`} data-testid="telemetry-bar">
      <div className="telemetry-source">
        <Radio size={17} />
        <span>
          <b>{running ? 'Simulação ao vivo' : 'Atualização pausada'}</b>
          <small>Telemetria fictícia · pacotes a cada 1 s</small>
        </span>
      </div>
      <span className="telemetry-count">
        <Tractor size={14} />
        {frame.packets.filter((p) => p.speed > 0).length} em operação ·{' '}
        {frame.packets.filter((p) => p.status === 'Em falha').length} em falha
      </span>
      <span className="telemetry-time">
        Último pacote <time>{packetTime(frame.timestamp)}</time>
      </span>
      <label className="telemetry-rate">
        <span>Ritmo</span>
        <select
          aria-label="Velocidade da simulação"
          value={rate}
          onChange={(e) => onRate(Number(e.target.value))}
        >
          <option value={1}>1× · tempo real</option>
          <option value={20}>20× · demonstração</option>
        </select>
      </label>
      <button
        className="telemetry-toggle"
        onClick={onToggle}
        aria-label={running ? 'Pausar telemetria' : 'Retomar telemetria'}
      >
        {running ? <Pause size={14} /> : <Play size={14} />}
        <span>{running ? 'Pausar' : 'Retomar'}</span>
      </button>
    </div>
  );
}
