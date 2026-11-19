import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { bloodPath, manifest, meshesUnder } from '@atlas/anatomy-manifest';
import { useAtlas } from '../store';
import { COLORS, colorFor } from '../lib/colors';

const url = (file: string) => `${import.meta.env.BASE_URL}models/${file}`;

function shownInScene(o: THREE.Object3D | null): boolean {
  for (; o; o = o.parent) if (!o.visible) return false;
  return true;
}

function Model({ file }: { file: string }) {
  const { scene } = useGLTF(url(file)); // drei registers the Meshopt decoder (no network fetch)
  const { selected, layers, flowOn, flowStep, select, setHovered, markLoaded } = useAtlas();

  // One material per mesh so each structure can be highlighted independently.
  const meshes = useMemo(() => {
    const list: { mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial; base: THREE.Color }[] = [];
    scene.traverse((o) => {
      const s = manifest.structures[o.name];
      if (!(o as THREE.Mesh).isMesh || !s) return;
      const base = new THREE.Color(colorFor(s));
      const mat = new THREE.MeshStandardMaterial({ color: base, roughness: 0.62, metalness: 0.0, transparent: true });
      (o as THREE.Mesh).material = mat;
      list.push({ mesh: o as THREE.Mesh, mat, base });
    });
    return list;
  }, [scene]);

  useEffect(() => markLoaded(file), [file, markLoaded]);

  useEffect(() => {
    const sel = new Set(selected ? meshesUnder(selected) : []);
    const step = bloodPath[flowStep];
    const stepMeshes = new Set(flowOn && step ? step.highlight.flatMap(meshesUnder) : []);
    for (const { mesh, mat, base } of meshes) {
      const s = manifest.structures[mesh.name];
      mesh.visible = layers[s.layer];
      const isSel = sel.has(mesh.name);
      // Translucent walls while the blood path is shown, so particles inside the heart stay visible.
      const opacity = isSel ? (flowOn ? 0.6 : 0.95) : flowOn ? (s.layer === 'heart' ? 0.22 : 0.5) : selected ? 0.55 : 1;
      mat.opacity = opacity;
      mat.depthWrite = opacity > 0.9;
      mat.color.copy(base);
      mat.emissive.set(isSel ? COLORS.selected : stepMeshes.has(mesh.name) ? COLORS.stepGlow : '#000000');
      mat.emissiveIntensity = isSel ? 0.28 : 0.3;
      mesh.renderOrder = isSel ? 2 : s.layer === 'heart' ? 1 : 0;
    }
  }, [meshes, selected, layers, flowOn, flowStep]);

  const pick = (e: ThreeEvent<MouseEvent>) => {
    if (!shownInScene(e.object) || !manifest.structures[e.object.name]) return; // let the next hit handle it
    e.stopPropagation();
    select(e.object.name);
  };
  const hover = (e: ThreeEvent<PointerEvent>) => {
    if (!shownInScene(e.object) || !manifest.structures[e.object.name]) return;
    e.stopPropagation();
    setHovered(e.object.name);
    document.body.style.cursor = 'pointer';
  };
  const out = () => { setHovered(null); document.body.style.cursor = ''; };

  return <primitive object={scene} onClick={pick} onPointerMove={hover} onPointerOut={out} />;
}

export function HeartModels() {
  return <>{manifest.models.map((m) => <Model key={m.file} file={m.file} />)}</>;
}

manifest.models.forEach((m) => useGLTF.preload(url(m.file)));
