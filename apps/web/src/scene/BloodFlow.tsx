import { useMemo, useRef } from 'react';
import { flowClock } from '../lib/flowClock';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { bloodPath, manifest } from '@atlas/anatomy-manifest';
import { useAtlas } from '../store';
import { lerp3, resolveWaypoints, samplePath, type Vec3 } from '../lib/flow';
import { COLORS } from '../lib/colors';

const PER_STEP = 2; // particles per path step (visual density only)

export function BloodFlow() {
  const flowOn = useAtlas((s) => s.flowOn);
  const inst = useRef<THREE.InstancedMesh>(null);
  const waypoints = useMemo(() => resolveWaypoints(bloodPath, (n) => (manifest.structures[n]?.center as Vec3) ?? null), []);
  const count = bloodPath.length * PER_STEP;
  const colors = useMemo(() => ({ low: new THREE.Color(COLORS.bloodLow), high: new THREE.Color(COLORS.bloodHigh) }), []);
  const m = useMemo(() => new THREE.Matrix4(), []);

  const segments = useMemo(() => bloodPath.map((s, i) => {
    const n = bloodPath[(i + 1) % bloodPath.length];
    return s.modelled && n.modelled ? [waypoints[i], waypoints[(i + 1) % bloodPath.length]] : null;
  }).filter(Boolean) as Vec3[][], [waypoints]);

  useFrame(() => {
    if (!inst.current) return;
    const beats = flowClock.beatsAt(performance.now());
    for (let i = 0; i < count; i++) {
      const { step, next, t } = samplePath(beats, bloodPath.length, i / PER_STEP);
      const a = bloodPath[step], b = bloodPath[next];
      const visible = flowOn && a.modelled && b.modelled;
      const p = lerp3(waypoints[step], waypoints[next], t);
      m.makeScale(visible ? 1 : 0, visible ? 1 : 0, visible ? 1 : 0).setPosition(p[0], p[1], p[2]);
      inst.current.setMatrixAt(i, m);
      inst.current.setColorAt(i, (t < 0.5 ? a : b).blood === 'low' ? colors.low : colors.high);
    }
    inst.current.instanceMatrix.needsUpdate = true;
    if (inst.current.instanceColor) inst.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={inst} args={[undefined, undefined, count]} renderOrder={3}>
        <sphereGeometry args={[0.0022, 12, 8]} />
        <meshStandardMaterial roughness={0.4} depthTest={false} transparent />
      </instancedMesh>
      {flowOn && segments.map((pts, i) => (
        <Line key={i} points={pts as [number, number, number][]} color="#2b2e33" lineWidth={1} transparent opacity={0.25} depthTest={false} />
      ))}
    </group>
  );
}
