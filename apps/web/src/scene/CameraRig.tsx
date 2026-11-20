import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useAtlas } from '../store';
import { CAMERA_LIMITS, DEFAULT_VIEW, INTRO_LAYERS, bodyLayers, fitView, focusView, type V3 } from '../lib/camera';
import { modelsFor } from '../lib/models';

/** Pause on the whole body before the intro close-up of heart and lungs (ms). */
const INTRO_DELAY_MS = 2000;

const v = (a: V3) => new THREE.Vector3(...a);

/** Writes the camera state onto the stage element (read by e2e tests and assistive tooling). */
function publish(controls: OrbitControlsImpl, camera: THREE.Camera) {
  const el = document.querySelector<HTMLElement>('[data-testid=stage]');
  if (!el) return;
  const t = controls.target;
  el.dataset.camPolar = (THREE.MathUtils.radToDeg(controls.getPolarAngle())).toFixed(1);
  el.dataset.camDistance = camera.position.distanceTo(t).toFixed(3);
  el.dataset.camTarget = [t.x, t.y, t.z].map((x) => x.toFixed(4)).join(',');
}

function setIntro(state: 'pending' | 'running' | 'done') {
  const el = document.querySelector<HTMLElement>('[data-testid=stage]');
  if (el) el.dataset.intro = state;
}

export function CameraRig() {
  const controls = useRef<OrbitControlsImpl>(null);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const layers = useAtlas((s) => s.layers);
  const fitted = useRef(false);
  const goal = useRef<{ target: THREE.Vector3; position: THREE.Vector3 } | null>(null);

  // On load (once the canvas has its real size): frame the whole body, no animation.
  useEffect(() => {
    const c = controls.current;
    if (!c || fitted.current || !size.width || !size.height) return;
    const f = fitView(bodyLayers(layers), size.width / size.height);
    c.target.set(...f.target); camera.position.set(...f.position); c.update();
    fitted.current = true;
    setIntro('pending');
  }, [size, layers, camera]);

  // Intro: once the visible models are in, pause on the whole body, then glide to heart and lungs.
  // Any user interaction (drag, reset, focus) cancels it.
  const ready = useAtlas((s) => modelsFor(s.layers).every((f) => s.loadedModels.includes(f)));
  const intro = useRef<'pending' | 'running' | 'done'>('pending');
  useEffect(() => {
    if (!ready || intro.current !== 'pending' || !size.width) return;
    const timer = setTimeout(() => {
      if (intro.current !== 'pending') return;
      const f = fitView(INTRO_LAYERS, size.width / Math.max(1, size.height), 1.3);
      goal.current = { target: v(f.target), position: v(f.position) };
      intro.current = 'running'; setIntro('running');
    }, INTRO_DELAY_MS);
    return () => clearTimeout(timer);
  }, [ready, size]);
  const endIntro = () => { if (intro.current !== 'done') { intro.current = 'done'; setIntro('done'); } };
  const request = useAtlas((s) => s.cameraRequest);

  useEffect(() => {
    const c = controls.current;
    if (!c || !request) return;
    endIntro();
    if (request.kind === 'reset') {
      const f = fitView(bodyLayers(useAtlas.getState().layers), size.width / Math.max(1, size.height));
      goal.current = { target: v(f.target), position: v(f.position) };
    }
    else {
      const f = focusView(request.name, camera.position.toArray() as V3, c.target.toArray() as V3);
      if (f) goal.current = { target: v(f.target), position: v(f.position) };
    }
  }, [request, camera, size]);

  useFrame((_, dt) => {
    const c = controls.current;
    if (!c) return;
    if (goal.current) {
      const k = 1 - Math.exp(-Math.min(dt, 0.2) * 8); // smooth, frame-rate independent
      c.target.lerp(goal.current.target, k);
      camera.position.lerp(goal.current.position, k);
      if (c.target.distanceTo(goal.current.target) < 1e-4 && camera.position.distanceTo(goal.current.position) < 1e-4) {
        c.target.copy(goal.current.target); camera.position.copy(goal.current.position); goal.current = null;
        if (intro.current === 'running') endIntro();
      }
      c.update();
    }
    publish(c, camera);
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={DEFAULT_VIEW.target}
      enablePan={false}
      enableDamping
      dampingFactor={CAMERA_LIMITS.damping}
      minPolarAngle={CAMERA_LIMITS.minPolar}
      maxPolarAngle={CAMERA_LIMITS.maxPolar}
      minDistance={CAMERA_LIMITS.minDistance}
      maxDistance={CAMERA_LIMITS.maxDistance}
      onStart={() => { goal.current = null; endIntro(); }}
    />
  );
}
