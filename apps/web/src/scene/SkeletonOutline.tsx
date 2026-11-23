import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useAtlas } from '../store';
import { COLORS } from '../lib/colors';
import { clipPlane } from './clipPlane';

const FILE = 'skeleton-outline.glb';
const url = `${import.meta.env.BASE_URL}models/${FILE}`;
/** Opacity of the full CT skeleton: a pale guide around the labelled HuBMAP bones, never hiding the organs. */
export const SKELETON_OUTLINE_OPACITY = 0.3;

/**
 * Full NIH 3D skeleton (one unlabelled CT mesh, fitted to the HuBMAP pelvis and legs by scripts/build-nih-skeleton.mjs).
 * Not clickable: it has no per-bone names or ontology IDs, so clicks pass through to the labelled structures.
 */
export function SkeletonOutline() {
  const { scene } = useGLTF(url);
  const visible = useAtlas((s) => s.layers.skeletonOutline);
  const section = useAtlas((s) => s.section.enabled);
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: COLORS.skeletal, roughness: 0.7, transparent: true, opacity: SKELETON_OUTLINE_OPACITY, depthWrite: false,
  }), []);
  useEffect(() => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.material = material;
      m.raycast = () => {}; // non-clickable
      m.renderOrder = 3;
      m.userData.layer = 'skeletonOutline';
    });
  }, [scene, material]);
  useEffect(() => { material.clippingPlanes = section ? [clipPlane] : null; material.side = section ? THREE.DoubleSide : THREE.FrontSide; material.needsUpdate = true; }, [section, material]);
  return <primitive object={scene} visible={visible} />;
}
