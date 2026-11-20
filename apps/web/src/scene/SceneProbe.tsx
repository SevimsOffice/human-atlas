import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { manifest, type Layer } from '@atlas/anatomy-manifest';

/** What the renderer actually draws, per layer: meshes shown, meshes inside the camera view, lowest/highest opacity. */
export interface LayerProbe { shown: number; inView: number; minOpacity: number; maxOpacity: number; depthWrite: boolean; renderOrder: number }

function shownInScene(o: THREE.Object3D | null): boolean {
  for (; o; o = o.parent) if (!o.visible) return false;
  return true;
}

function structureOf(o: THREE.Object3D | null): string | null {
  for (; o; o = o.parent) if (manifest.structures[o.name]) return o.name;
  return null;
}

/**
 * Writes a summary of the rendered scene onto the stage element (data-scene), twice a second.
 * Read by the end-to-end tests and useful when diagnosing "I can't see X" reports in the browser console:
 *   JSON.parse(document.querySelector('[data-testid=stage]').dataset.scene)
 */
export function SceneProbe() {
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    const frustum = new THREE.Frustum(), m = new THREE.Matrix4(), box = new THREE.Box3();
    const id = setInterval(() => {
      const el = document.querySelector<HTMLElement>('[data-testid=stage]');
      if (!el) return;
      camera.updateMatrixWorld();
      frustum.setFromProjectionMatrix(m.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
      const out: Partial<Record<Layer, LayerProbe>> = {};
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        const name = structureOf(mesh);
        if (!name || !shownInScene(mesh)) return;
        const layer = manifest.structures[name].layer;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        const p = (out[layer] ??= { shown: 0, inView: 0, minOpacity: 1, maxOpacity: 0, depthWrite: false, renderOrder: mesh.renderOrder });
        p.shown++;
        if (frustum.intersectsBox(box.setFromObject(mesh))) p.inView++;
        p.minOpacity = Math.min(p.minOpacity, mat.opacity);
        p.maxOpacity = Math.max(p.maxOpacity, mat.opacity);
        p.depthWrite ||= mat.depthWrite;
        p.renderOrder = Math.max(p.renderOrder, mesh.renderOrder);
      });
      el.dataset.scene = JSON.stringify(out);
    }, 500);
    return () => clearInterval(id);
  }, [scene, camera]);
  return null;
}
