import { Component, Suspense, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import * as THREE from 'three';
import { dataset, fieldColor, fieldState } from './model';
import type { Field, Layer, Section, Snapshot } from './model';
import Forest from './Forest';
import type { MachinePacket, TelemetryFrame } from './telemetry';

type Props = {
  farmId: string;
  date: string;
  layer: Layer;
  section: Section;
  selected: string | null;
  onSelect: (id: string) => void;
  machines: boolean;
  labels: boolean;
  reset: number;
  snapshot: Snapshot;
  telemetry: TelemetryFrame;
  live: boolean;
};
const offsets: Record<string, number> = { aurora: 0, horizonte: 0, veredas: 0 };
const initialCamera = {
  position: [130, 155, 155] as [number, number, number],
  fov: 43,
  near: 1,
  far: 1400,
};
const rendererOptions = {
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance' as const,
};

function MapLabel({
  title,
  subtitle = '',
  hot = false,
  active = false,
  position,
  onClick,
}: {
  title: string;
  subtitle?: string;
  hot?: boolean;
  active?: boolean;
  position: [number, number, number];
  onClick: () => void;
}) {
  const map = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 80;
    const c = canvas.getContext('2d')!;
    c.fillStyle = hot ? '#fff1d9' : active ? '#eaf4d1' : '#fffffff0';
    c.strokeStyle = active ? '#638644' : '#ffffff';
    c.lineWidth = active ? 5 : 2;
    c.beginPath();
    c.roundRect(3, 3, 250, 74, 12);
    c.fill();
    c.stroke();
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = hot ? '#9f6846' : '#405b36';
    c.font = '600 25px Segoe UI, sans-serif';
    c.fillText(title, 128, subtitle ? 27 : 40);
    if (subtitle) {
      c.fillStyle = '#82916f';
      c.font = '19px Segoe UI, sans-serif';
      c.fillText(subtitle, 128, 56);
    }
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [title, subtitle, hot, active]);
  useEffect(() => () => map.dispose(), [map]);
  return (
    <sprite
      position={position}
      scale={[15, 4.7, 1]}
      renderOrder={50}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <spriteMaterial
        map={map}
        transparent
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </sprite>
  );
}

function texture(seed: number, rows = false) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const c = canvas.getContext('2d')!;
  c.fillStyle = rows ? '#d2d1ad' : '#9fae80';
  c.fillRect(0, 0, 256, 256);
  let state = seed;
  for (let i = 0; i < 12000; i++) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const x = (state >>> 16) % 256;
    state = (state * 1664525 + 1013904223) >>> 0;
    const y = (state >>> 16) % 256;
    c.fillStyle = `rgba(${rows ? '50,68,27' : '48,80,32'},${0.025 + (state % 10) / 100})`;
    c.fillRect(x, y, rows ? 2 : 4, rows ? 5 : 3);
  }
  if (rows)
    for (let x = 0; x < 256; x += 8) {
      c.fillStyle = 'rgba(45,55,24,.22)';
      c.fillRect(x, 0, 2, 256);
      c.fillStyle = 'rgba(255,255,210,.12)';
      c.fillRect(x + 2, 0, 1, 256);
    }
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rows ? 3 : 6, rows ? 2 : 6);
  t.anisotropy = 4;
  return t;
}

function FieldMesh({
  field,
  date,
  layer,
  selected,
  onSelect,
  labels,
  fieldTexture,
}: {
  field: Field;
  date: string;
  layer: Layer;
  selected: boolean;
  onSelect: (id: string) => void;
  labels: boolean;
  fieldTexture: THREE.Texture;
}) {
  const color = fieldColor(field, date, layer);
  const state = fieldState(field, date);
  const [w, h] = field.size;
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2 + 3, -h / 2);
    shape.lineTo(w / 2 - 1, -h / 2);
    shape.lineTo(w / 2, h / 2 - 2);
    shape.lineTo(w / 2 - 3, h / 2);
    shape.lineTo(-w / 2, h / 2);
    shape.lineTo(-w / 2, -h / 2 + 3);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.55, bevelEnabled: false });
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / w, uv.getY(i) / h);
    return g;
  }, [w, h]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group position={[field.position[0], 0.25, field.position[1]]}>
      <mesh
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        castShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelect(field.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = '';
        }}
      >
        <meshStandardMaterial
          color={color}
          map={fieldTexture}
          roughness={0.95}
          emissive={selected ? '#adc46b' : '#000000'}
          emissiveIntensity={selected ? 0.23 : 0}
        />
      </mesh>
      {selected && (
        <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w + 1.1, h + 1.1]} />
          <meshBasicMaterial color="#f3e39c" />
        </mesh>
      )}
      {labels && (
        <MapLabel
          position={[0, 2.8, 0]}
          title={field.name.replace('Talhão ', 'T')}
          subtitle={
            layer === 'NDVI'
              ? state.ndvi.toFixed(2)
              : layer === 'Pragas'
                ? `${state.pest}%`
                : field.crop
          }
          active={selected}
          onClick={() => onSelect(field.id)}
        />
      )}
    </group>
  );
}

function Machine({
  packet,
  red = false,
  fault = false,
  live,
  onClick,
}: {
  packet: MachinePacket;
  red?: boolean;
  fault?: boolean;
  live: boolean;
  onClick: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const initial = useMemo(
    () => new THREE.Vector3(packet.local[0] / 50, 1, -packet.local[1] / 50),
    [],
  );
  useFrame((_, delta) => {
    if (!group.current) return;
    const target = new THREE.Vector3(packet.local[0] / 50, 1, -packet.local[1] / 50);
    if (fault || !live) group.current.position.copy(target);
    else group.current.position.lerp(target, 1 - Math.exp(-delta * 7));
    const targetAngle = (-packet.localHeading * Math.PI) / 180;
    const diff = Math.atan2(
      Math.sin(targetAngle - group.current.rotation.y),
      Math.cos(targetAngle - group.current.rotation.y),
    );
    group.current.rotation.y += diff * (1 - Math.exp(-delta * 8));
  });
  return (
    <group
      ref={group}
      position={initial}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <mesh position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[2.6, 1.8, 4]} />
        <meshStandardMaterial color={red ? '#bb4737' : '#496b3b'} />
      </mesh>
      <mesh position={[0, 2.7, -0.7]} castShadow>
        <boxGeometry args={[2, 1.5, 1.8]} />
        <meshStandardMaterial color="#708b8e" metalness={0.3} roughness={0.3} />
      </mesh>
      {[-1.5, 1.5].flatMap((x) =>
        [-1.3, 1.3].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.85, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.9, 0.9, 0.65, 12]} />
            <meshStandardMaterial color="#323a34" />
          </mesh>
        )),
      )}
      {fault && <MapLabel position={[0, 6, 0]} title="! Falha" hot onClick={onClick} />}
    </group>
  );
}

function Storage({
  snapshot,
  selected,
  onSelect,
  labels,
}: Pick<Props, 'snapshot' | 'selected' | 'onSelect' | 'labels'>) {
  return (
    <group position={[-12, 0.4, -76]}>
      <mesh position={[10, -0.1, 0]} receiveShadow>
        <boxGeometry args={[65, 0.25, 24]} />
        <meshStandardMaterial color="#b1aa91" />
      </mesh>
      {snapshot.silos.map((s, i) => (
        <group
          key={s.id}
          position={[i * 11 - 8, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(s.id);
          }}
        >
          <mesh position={[0, 4, 0]} castShadow>
            <cylinderGeometry args={[4.2, 4.2, 8, 24, 1, true]} />
            <meshStandardMaterial
              color={selected === s.id ? '#e4e9b9' : '#bdc6c0'}
              metalness={0.5}
              roughness={0.65}
              transparent
              opacity={0.55}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0, (s.stock / s.capacity) * 4, 0]}>
            <cylinderGeometry args={[4, 4, (s.stock / s.capacity) * 8, 24]} />
            <meshStandardMaterial color={s.hot ? '#c7894d' : '#c8b06b'} />
          </mesh>
          <mesh position={[0, 9.1, 0]} castShadow>
            <coneGeometry args={[4.5, 2.2, 24]} />
            <meshStandardMaterial color="#cbd3cd" metalness={0.5} roughness={0.7} />
          </mesh>
          {[1, 3, 5, 7].map((y) => (
            <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[4.23, 0.045, 3, 24]} />
              <meshStandardMaterial color="#87938c" />
            </mesh>
          ))}
          {labels && (
            <MapLabel
              position={[0, 13, 0]}
              title={s.name}
              subtitle={`${Math.round((s.stock / s.capacity) * 100)}%${s.hot ? ' · 39,8 °C' : ''}`}
              hot={s.hot}
              active={selected === s.id}
              onClick={() => onSelect(s.id)}
            />
          )}
        </group>
      ))}
      <mesh position={[54, 3, 0]} castShadow>
        <boxGeometry args={[18, 6, 13]} />
        <meshStandardMaterial color="#d8d7c7" />
      </mesh>
      <mesh position={[54, 6.4, 0]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[19, 0.8, 14]} />
        <meshStandardMaterial color="#717f79" />
      </mesh>
    </group>
  );
}

function FarmTerrain({
  farmId,
  index,
  props,
  active,
}: {
  farmId: string;
  index: number;
  props: Props;
  active: boolean;
}) {
  const ground = useMemo(() => texture(42 + index), [index]);
  const rows = useMemo(() => texture(100 + index, true), [index]);
  const terrain = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(900, 900, 90, 90);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i),
        z = positions.getY(i);
      const edge = THREE.MathUtils.smoothstep(Math.max(Math.abs(x), Math.abs(z)), 95, 270);
      positions.setZ(
        i,
        edge * (7 * Math.sin(x / 85) * Math.cos(z / 110) + 3 * Math.sin((x + z) / 48)),
      );
    }
    geometry.computeVertexNormals();
    return geometry;
  }, []);
  useEffect(() => {
    ground.repeat.set(28, 28);
    return () => terrain.dispose();
  }, [ground, terrain]);
  useEffect(
    () => () => {
      ground.dispose();
      rows.dispose();
    },
    [ground, rows],
  );
  return (
    <group position={[offsets[farmId], 0, 0]}>
      <mesh
        position={[0, -0.12, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={terrain}
        receiveShadow
      >
        <meshStandardMaterial color="#aab68b" map={ground} roughness={1} />
      </mesh>
      <mesh position={[-7, 0.06, -4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4.5, 157]} />
        <meshStandardMaterial color="#c2b498" />
      </mesh>
      {[-57, -30, -3, 24, 52].map((z) => (
        <mesh key={z} position={[0, 0.07, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[123, 2.1]} />
          <meshStandardMaterial color="#c6bda2" />
        </mesh>
      ))}
      <mesh position={[-64, 0.07, -4]} rotation={[-Math.PI / 2, 0, -0.08]}>
        <planeGeometry args={[4, 185]} />
        <meshStandardMaterial color="#c2b498" />
      </mesh>
      <mesh position={[-91, 0.12, 12]} rotation={[-Math.PI / 2, 0, -0.2]}>
        <planeGeometry args={[7, 178]} />
        <meshStandardMaterial color="#759a91" roughness={0.35} metalness={0.15} />
      </mesh>
      <Forest index={index} />
      {dataset.fields
        .filter((f) => f.farmId === farmId)
        .map((field) => (
          <FieldMesh
            key={field.id}
            field={field}
            date={props.date}
            layer={props.layer}
            selected={props.selected === field.id}
            onSelect={props.onSelect}
            labels={active && props.labels}
            fieldTexture={rows}
          />
        ))}
      {active && (
        <Storage
          snapshot={props.snapshot}
          selected={props.selected}
          onSelect={props.onSelect}
          labels={props.labels}
        />
      )}
      {active && props.machines && (
        <>
          <Machine
            live={props.live}
            packet={props.telemetry.packets[0]}
            onClick={() => props.onSelect('machine-0')}
          />
          <Machine
            packet={props.telemetry.packets[1]}
            live={props.live}
            red
            fault={props.snapshot.fault}
            onClick={() => props.onSelect('machine-1')}
          />
          <Machine
            live={props.live}
            packet={props.telemetry.packets[2]}
            onClick={() => props.onSelect('machine-2')}
          />
        </>
      )}
    </group>
  );
}

function Camera({ farmId, section, reset }: Pick<Props, 'farmId' | 'section' | 'reset'>) {
  const controls = useRef<CameraControls>(null);
  useEffect(() => {
    const x = offsets[farmId];
    const close = section === 'storage';
    controls.current?.setLookAt(
      x + (close ? 59 : 130),
      close ? 49 : 155,
      close ? -10 : 155,
      x + (close ? 4 : -3),
      0,
      close ? -75 : -15,
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
  }, [farmId, section, reset]);
  return (
    <CameraControls
      ref={controls}
      makeDefault
      minDistance={30}
      maxDistance={330}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI / 2.15}
      boundaryEnclosesCamera={false}
    />
  );
}

class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
function NoWebGL() {
  return (
    <div className="scene-unavailable">
      <strong>O modo 3D não está disponível neste dispositivo.</strong>
      <p>Use a visualização em tabela para explorar todos os dados.</p>
    </div>
  );
}

function LiveFrames({ active }: { active: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) invalidate();
    }, 1000 / 30);
    return () => window.clearInterval(timer);
  }, [active, invalidate]);
  return null;
}
export default function Scene(props: Props) {
  return (
    <SceneBoundary fallback={<NoWebGL />}>
      <Canvas
        frameloop="demand"
        shadows
        dpr={[1, 1.5]}
        camera={initialCamera}
        gl={rendererOptions}
        fallback={<NoWebGL />}
      >
        <color attach="background" args={['#dce5dc']} />
        <fog attach="fog" args={['#dce5dc', 270, 760]} />
        <ambientLight intensity={0.55} />
        <hemisphereLight args={['#f3f7ed', '#8e9878', 0.8]} />
        <directionalLight
          position={[-65, 130, 65]}
          intensity={2.1}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-150}
          shadow-camera-right={150}
          shadow-camera-top={150}
          shadow-camera-bottom={-150}
          shadow-bias={-0.001}
        />
        <Suspense fallback={null}>
          {dataset.farms
            .filter((f) => f.id === props.farmId)
            .map((f) => (
              <FarmTerrain
                key={f.id}
                farmId={f.id}
                index={dataset.farms.findIndex((unit) => unit.id === f.id)}
                props={props}
                active={props.farmId === f.id}
              />
            ))}
        </Suspense>
        <Camera farmId={props.farmId} section={props.section} reset={props.reset} />
        <LiveFrames active={props.live && props.machines} />
      </Canvas>
    </SceneBoundary>
  );
}
