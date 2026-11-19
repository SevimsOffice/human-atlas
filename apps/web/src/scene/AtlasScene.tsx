import { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { manifest } from '@atlas/anatomy-manifest';
import { HeartModels } from './HeartModels';
import { BloodFlow } from './BloodFlow';
import { useAtlas } from '../store';
import { softwareRendering, SOFTWARE_FRAME_GAP_MS } from '../lib/renderProfile';

/** Software mode: request the next frame only after a pause, so frames never monopolise the main thread. */
function PacedFrames() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const loop = () => { if (!alive) return; invalidate(); requestAnimationFrame(() => { timer = setTimeout(loop, SOFTWARE_FRAME_GAP_MS); }); };
    loop();
    return () => { alive = false; clearTimeout(timer); };
  }, [invalidate]);
  return null;
}

const c = manifest.structures.VH_M_heart.center!; // frame the heart (model space, metres)
const target: [number, number, number] = [c[0], c[1] + 0.01, c[2]];

export function AtlasScene() {
  const select = useAtlas((s) => s.select);
  return (
    <Canvas
      camera={{ position: [target[0], target[1] + 0.03, target[2] + 0.6], fov: 35, near: 0.005, far: 5 }}
      dpr={softwareRendering ? 1 : [1, 2]}
      gl={{ antialias: !softwareRendering }}
      frameloop={softwareRendering ? 'demand' : 'always'}
      onPointerMissed={() => select(null)}
      aria-label="3D heart model"
    >
      {softwareRendering && <PacedFrames />}
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
