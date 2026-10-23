import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

const TREES = 128,
  CROWNS = 7;
function randomGenerator(seed: number) {
  let n = seed;
  return () => {
    n = (n * 1664525 + 1013904223) >>> 0;
    return n / 4294967296;
  };
}

// Folhas individuais curvadas: a silhueta tem vazios e ramos visíveis, sem esferas opacas.
function leafCluster() {
  const random = randomGenerator(181);
  const vertices: number[] = [],
    colors: number[] = [];
  const v = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const leaf = [
    [-0.23, 0, 0],
    [0, 0, 0.105],
    [0.23, 0, 0],
    [0, 0, -0.105],
    [0, 0.055, 0],
  ];
  const indices = [0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4];
  for (let i = 0; i < 100; i++) {
    const theta = random() * Math.PI * 2,
      r = Math.sqrt(random()),
      y = (random() - 0.5) * 1.25;
    const center = new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r * 0.85);
    q.setFromEuler(
      new THREE.Euler(random() * 1.8 - 0.9, random() * Math.PI * 2, random() * 1.5 - 0.75),
    );
    const size = 0.65 + random() * 0.8,
      tone = 0.64 + random() * 0.36;
    for (const index of indices) {
      const p = leaf[index];
      v.set(p[0], p[1], p[2]).multiplyScalar(size).applyQuaternion(q).add(center);
      vertices.push(v.x, v.y, v.z);
      colors.push(tone * 0.84, tone, tone * 0.68);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

export default function Forest({ index }: { index: number }) {
  const wood = useRef<THREE.InstancedMesh>(null),
    foliage = useRef<THREE.InstancedMesh>(null),
    shrubs = useRef<THREE.InstancedMesh>(null);
  const leaves = useMemo(leafCluster, []);
  useEffect(() => () => leaves.dispose(), [leaves]);
  useEffect(() => {
    const random = randomGenerator(7601 + index * 93),
      obj = new THREE.Object3D(),
      up = new THREE.Vector3(0, 1, 0);
    const placeBranch = (i: number, a: THREE.Vector3, b: THREE.Vector3, radius: number) => {
      const direction = b.clone().sub(a);
      obj.position.copy(a).add(b).multiplyScalar(0.5);
      obj.scale.set(radius, direction.length(), radius);
      obj.quaternion.setFromUnitVectors(up, direction.normalize());
      obj.updateMatrix();
      wood.current!.setMatrixAt(i, obj.matrix);
    };
    for (let i = 0; i < TREES; i++) {
      const z = -107 + random() * 210;
      const x =
        i < 66
          ? -85 + Math.sin(z / 35) * 5 + (random() - 0.5) * 18
          : i < 108
            ? 81 + (random() - 0.5) * 24
            : -65 + random() * 154;
      const north = i >= 108 ? -101 + (random() - 0.5) * 18 : z;
      const height = 6.8 + random() * 5.8,
        radius = 0.24 + random() * 0.17;
      const origin = new THREE.Vector3(x, 0, north),
        fork = new THREE.Vector3(x + 0.2, height * 0.45, north);
      placeBranch(
        i * (CROWNS + 1),
        origin,
        new THREE.Vector3(x + 0.3, height * 0.85, north),
        radius,
      );
      const tone = new THREE.Color().setHSL(
        0.24 + random() * 0.065,
        0.32 + random() * 0.15,
        0.18 + random() * 0.07,
      );
      for (let j = 0; j < CROWNS; j++) {
        const angle = (j / CROWNS) * Math.PI * 2 + random() * 0.7,
          spread = j === 0 ? 0.35 : 1.7 + random() * 1.7;
        const tip = new THREE.Vector3(
          x + Math.cos(angle) * spread,
          height * (j === 0 ? 0.91 : 0.62 + random() * 0.2),
          north + Math.sin(angle) * spread,
        );
        placeBranch(i * (CROWNS + 1) + j + 1, fork, tip, radius * (0.27 + random() * 0.2));
        obj.position.copy(tip);
        obj.quaternion.setFromEuler(new THREE.Euler(random() * 0.5, random() * 6, random() * 0.3));
        const crown = 2 + random() * 1.2;
        obj.scale.set(crown, crown * (0.8 + random() * 0.4), crown);
        obj.updateMatrix();
        foliage.current!.setMatrixAt(i * CROWNS + j, obj.matrix);
        foliage.current!.setColorAt(i * CROWNS + j, tone);
      }
      if (i < 60) {
        obj.position.set(x + (random() - 0.5) * 11, 0.7 + random(), north + (random() - 0.5) * 10);
        obj.rotation.set(0, random() * 6, 0);
        obj.scale.set(1.3 + random(), 1.1 + random(), 1.4 + random());
        obj.updateMatrix();
        shrubs.current!.setMatrixAt(i, obj.matrix);
        shrubs.current!.setColorAt(i, tone);
      }
    }
    for (const mesh of [wood.current!, foliage.current!, shrubs.current!]) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }, [index]);
  return (
    <group name="Vegetação nativa ramificada">
      <instancedMesh
        ref={wood}
        args={[undefined, undefined, TREES * (CROWNS + 1)]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.42, 1, 1, 7]} />
        <meshStandardMaterial color="#64523e" roughness={1} />
      </instancedMesh>
      <instancedMesh
        ref={foliage}
        args={[leaves, undefined, TREES * CROWNS]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.92} />
      </instancedMesh>
      <instancedMesh ref={shrubs} args={[leaves, undefined, 60]} receiveShadow>
        <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={1} />
      </instancedMesh>
    </group>
  );
}
