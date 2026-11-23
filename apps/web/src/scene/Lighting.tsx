import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Studio lighting: a procedural room environment for soft reflections (no image download),
 * a warm key light, a cool fill and a rim light from behind that separates organs from each other.
 */
export function Lighting() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.35;
    return () => { scene.environment = null; env.dispose(); pmrem.dispose(); };
  }, [gl, scene]);
  return (
    <>
      <hemisphereLight args={['#f6f7fa', '#3c3f46', 0.45]} />
      <directionalLight position={[0.6, 1.4, 1.2]} intensity={1.9} color="#fff6ec" />
      <directionalLight position={[-1, 0.5, 0.6]} intensity={0.7} color="#dfe8f5" />
      <directionalLight position={[0, 0.8, -1.4]} intensity={1.1} color="#ffffff" />
    </>
  );
}
