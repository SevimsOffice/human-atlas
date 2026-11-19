import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { manifest } from '@atlas/anatomy-manifest';
import { HeartModels } from './HeartModels';
import { BloodFlow } from './BloodFlow';
import { useAtlas } from '../store';

const c = manifest.structures.VH_M_heart.center!; // frame the heart (model space, metres)
const target: [number, number, number] = [c[0], c[1] + 0.01, c[2]];

export function AtlasScene() {
  const select = useAtlas((s) => s.select);
  return (
    <Canvas
      camera={{ position: [target[0], target[1] + 0.03, target[2] + 0.44], fov: 35, near: 0.005, far: 5 }}
      dpr={[1, 2]}
      onPointerMissed={() => select(null)}
      aria-label="3D heart model"
    >
      <color attach="background" args={['#eceef0']} />
      <hemisphereLight args={['#f4f6f9', '#5d6066', 1.35]} />
      <directionalLight position={[0.5, 1.2, 1]} intensity={1.6} />
      <directionalLight position={[-0.8, 0.4, -0.6]} intensity={0.5} color="#dfe6ef" />
      {/* specimen stage below the model */}
      <mesh rotation-x={-Math.PI / 2} position={[target[0], 0.16, target[2]]}>
        <circleGeometry args={[0.32, 96]} />
        <meshStandardMaterial color="#e1e4e7" roughness={0.95} />
      </mesh>
      <Suspense fallback={null}>
        <HeartModels />
        <BloodFlow />
      </Suspense>
      <OrbitControls makeDefault target={target} enableDamping minDistance={0.08} maxDistance={1.2} />
    </Canvas>
  );
}
