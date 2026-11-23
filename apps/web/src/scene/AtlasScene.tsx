import { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { CameraRig } from './CameraRig';
import { CAMERA_LIMITS, DEFAULT_VIEW, STAGE_Y } from '../lib/camera';
import { HeartModels } from './HeartModels';
import { BloodFlow } from './BloodFlow';
import { SceneProbe } from './SceneProbe';
import { SkeletonOutline } from './SkeletonOutline';
import { Lighting } from './Lighting';
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

const target = DEFAULT_VIEW.target;

export function AtlasScene() {
  const select = useAtlas((s) => s.select);
  return (
    <Canvas
      camera={{ position: DEFAULT_VIEW.position, fov: 35, near: CAMERA_LIMITS.near, far: CAMERA_LIMITS.far }}
      dpr={softwareRendering ? 1 : [1, 2]}
      gl={{ antialias: !softwareRendering }}
      frameloop={softwareRendering ? 'demand' : 'always'}
      onPointerMissed={() => select(null)}
      aria-label="3D anatomy model"
      onCreated={({ gl }) => { gl.localClippingEnabled = true; }}
    >
      {softwareRendering && <PacedFrames />}
      <color attach="background" args={['#dfe3e8']} />
      <Lighting />
      {/* specimen stage below the model */}
      <mesh rotation-x={-Math.PI / 2} position={[target[0], STAGE_Y, target[2]]}>
        <circleGeometry args={[0.55, 96]} />
        <meshStandardMaterial color="#e1e4e7" roughness={0.95} />
      </mesh>
      <Suspense fallback={null}>
        <HeartModels />
        <BloodFlow />
      </Suspense>
      <Suspense fallback={null}>
        <SkeletonOutline />
      </Suspense>
      <CameraRig />
      <SceneProbe />
    </Canvas>
  );
}
