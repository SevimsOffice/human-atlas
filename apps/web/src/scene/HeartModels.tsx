import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { bloodPath, manifest, meshesUnder, type Layer } from '@atlas/anatomy-manifest';
import { useAtlas } from '../store';
import { COLORS, colorFor } from '../lib/colors';
import { breathClock } from '../lib/flowClock';
import { breathScale } from '../lib/breathing';

const url = (file: string) => `${import.meta.env.BASE_URL}models/${file}`;

function shownInScene(o: THREE.Object3D | null): boolean {
  for (; o; o = o.parent) if (!o.visible) return false;
  return true;
}

const isLung = (name: string) => manifest.structures[name]?.layer === 'lungs';

/**
 * Picks the structure the user meant: the nearest visible structure, but looking *through* the
 * translucent lungs when something else lies behind them (the lungs wrap the heart).
 */
function pickFrom(intersections: THREE.Intersection[]): string | null {
  const hits = intersections.map((i) => i.object).filter((o) => manifest.structures[o.name] && shownInScene(o));
  return (hits.find((o) => !isLung(o.name)) ?? hits[0])?.name ?? null;
}

/** Resting opacity per layer: lungs stay translucent so the heart remains visible inside. */
function baseOpacity(layer: Layer, flowOn: boolean, somethingSelected: boolean): number {
  if (layer === 'lungs') return flowOn ? 0.12 : 0.2;
  if (layer === 'airways') return flowOn ? 0.45 : 0.75;
  if (flowOn) return layer === 'heart' ? 0.22 : 0.5;
  return somethingSelected ? 0.55 : 1;
}

/** Scales the lungs about their own centre once per breath (schematic amplitude). */
function useBreathing(scene: THREE.Object3D) {
  const lungs = useMemo(() => scene.getObjectByName('VH_M_lungs') ?? null, [scene]);
  const centre = useMemo(() => {
    const c = manifest.structures.VH_M_lungs?.center;
    return c ? new THREE.Vector3(...c) : null;
  }, []);
  useFrame(() => {
    if (!lungs || !centre) return;
    const s = breathScale(breathClock.beatsAt(performance.now()) % 1);
    lungs.scale.setScalar(s);
    lungs.position.copy(centre).multiplyScalar(1 - s); // p' = s·p + c·(1 − s)
  });
}

function Model({ file }: { file: string }) {
  const { scene } = useGLTF(url(file)); // drei registers the Meshopt decoder (no network fetch)
  const { selected, layers, flowOn, flowStep, select, setHovered, markLoaded } = useAtlas();
  useBreathing(scene);

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
      const opacity = isSel ? (flowOn || s.layer === 'lungs' ? 0.6 : 0.95) : baseOpacity(s.layer, flowOn, !!selected);
      mat.opacity = opacity;
      mat.depthWrite = opacity > 0.9;
      mat.color.copy(base);
      mat.emissive.set(isSel ? COLORS.selected : stepMeshes.has(mesh.name) ? COLORS.stepGlow : '#000000');
      mat.emissiveIntensity = isSel ? 0.28 : s.layer === 'lungs' ? 0.15 : 0.3;
      mesh.renderOrder = isSel ? 2 : s.layer === 'lungs' ? 4 : s.layer === 'heart' ? 1 : 0;
    }
  }, [meshes, selected, layers, flowOn, flowStep]);

  const pick = (e: ThreeEvent<MouseEvent>) => {
    const name = pickFrom(e.intersections);
    if (!name) return;
    e.stopPropagation();
    select(name);
  };
  const hover = (e: ThreeEvent<PointerEvent>) => {
    const name = pickFrom(e.intersections);
    if (!name) return;
    e.stopPropagation();
    setHovered(name);
    document.body.style.cursor = 'pointer';
  };
  const out = () => { setHovered(null); document.body.style.cursor = ''; };

  return <primitive object={scene} onClick={pick} onPointerMove={hover} onPointerOut={out} />;
}

export function HeartModels() {
  return <>{manifest.models.map((m) => <Model key={m.file} file={m.file} />)}</>;
}

manifest.models.forEach((m) => useGLTF.preload(url(m.file)));
