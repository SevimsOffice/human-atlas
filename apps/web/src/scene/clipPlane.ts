import * as THREE from 'three';
import { boundsOf } from '../lib/camera';
import { isClipped, sectionPlane } from '../lib/section';
import { useAtlas } from '../store';

/** The single cross-section plane shared by every material (three.js keeps the side where normal·p + constant ≥ 0). */
export const clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);

function update() {
  const { section, layers } = useAtlas.getState();
  const b = boundsOf(layers) ?? boundsOf({ heart: true })!;
  const p = sectionPlane(section.axis, section.t, b);
  clipPlane.normal.set(...p.normal);
  clipPlane.constant = p.constant;
  const el = typeof document !== 'undefined' ? document.querySelector<HTMLElement>('[data-testid=stage]') : null;
  if (el) { el.dataset.section = section.enabled ? `${section.axis}:${section.t.toFixed(2)}` : 'off'; el.dataset.sectionPos = p.constant.toFixed(4); }
}
update();
useAtlas.subscribe((s, prev) => { if (s.section !== prev.section || s.layers !== prev.layers) update(); });

/** Is this world-space point removed by the active section? */
export function clippedAway(p: THREE.Vector3): boolean {
  const s = useAtlas.getState().section;
  return s.enabled && isClipped([p.x, p.y, p.z], { normal: clipPlane.normal.toArray() as [number, number, number], constant: clipPlane.constant });
}
