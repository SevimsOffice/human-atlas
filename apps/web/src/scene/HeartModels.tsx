import { Suspense, useEffect, useMemo, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { bloodPath, manifest, meshesUnder, type Layer } from '@atlas/anatomy-manifest';
import { useAtlas } from '../store';
import { COLORS, colorFor } from '../lib/colors';
import { breathClock } from '../lib/flowClock';
import { breathScale } from '../lib/breathing';
import { clipPlane, clippedAway } from './clipPlane';
import { modelsFor } from '../lib/models';

const url = (file: string) => `${import.meta.env.BASE_URL}models/${file}`;

function shownInScene(o: THREE.Object3D | null): boolean {
  for (; o; o = o.parent) if (!o.visible) return false;
  return true;
}

/** Translucent wrappers that should not catch clicks meant for what lies inside them. */
const isWrapper = (name: string) => { const l = manifest.structures[name]?.layer; return l === 'lungs' || l === 'skin'; };
const isSkin = (name: string) => manifest.structures[name]?.layer === 'skin';

/**
 * The manifest structure an object belongs to. A glTF mesh with several primitives is loaded by three.js as a
 * group of child meshes with suffixed names, so walk up to the nearest ancestor that is in the manifest.
 */
function structureOf(o: THREE.Object3D | null): string | null {
  for (; o; o = o.parent) if (manifest.structures[o.name]) return o.name;
  return null;
}

/**
 * Picks the structure the user meant: the nearest visible structure, but looking *through* the
 * translucent lungs and skin outline when something else lies behind them (the lungs wrap the heart, the skin wraps everything).
 */
function pickFrom(intersections: THREE.Intersection[]): string | null {
  // ignore hits on geometry removed by the cross-section: the user can only click what they can see
  const hits = intersections.filter((i) => !clippedAway(i.point) && shownInScene(i.object))
    .map((i) => structureOf(i.object)).filter((n): n is string => !!n);
  return hits.find((n) => !isWrapper(n)) ?? hits.find((n) => !isSkin(n)) ?? hits[0] ?? null;
}

/** Resting opacity per layer: lungs stay translucent so the heart remains visible inside. */
function baseOpacity(layer: Layer, flowOn: boolean, somethingSelected: boolean): number {
  if (layer === 'skin') return flowOn ? 0.06 : 0.13;
  if (layer === 'lungs') return flowOn ? 0.12 : 0.2;
  if (layer === 'airways') return flowOn ? 0.45 : 0.75;
  if (layer === 'urinary' || layer === 'digestive' || layer === 'lymphatic' || layer === 'nervous') return flowOn ? 0.4 : 0.85;
  if (layer === 'skeletal') return flowOn ? 0.5 : 0.95;
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
  const { selected, layers, flowOn, flowStep, select, setHovered, markLoaded, requestCamera, section } = useAtlas();
  useBreathing(scene);

  // One material per mesh so each structure can be highlighted independently.
  const meshes = useMemo(() => {
    const list: { mesh: THREE.Mesh; name: string; mat: THREE.MeshStandardMaterial; base: THREE.Color }[] = [];
    scene.traverse((o) => {
      const name = (o as THREE.Mesh).isMesh ? structureOf(o) : null;
      const s = name ? manifest.structures[name] : null;
      if (!s || !name) return;
      const base = new THREE.Color(colorFor(s));
      const mat = new THREE.MeshStandardMaterial({ color: base, roughness: 0.62, metalness: 0.0, transparent: true });
      (o as THREE.Mesh).material = mat;
      list.push({ mesh: o as THREE.Mesh, name, mat, base });
    });
    return list;
  }, [scene]);

  useEffect(() => markLoaded(file), [file, markLoaded]);

  useEffect(() => {
    const sel = new Set(selected ? meshesUnder(selected) : []);
    const step = bloodPath[flowStep];
    const stepMeshes = new Set(flowOn && step ? step.highlight.flatMap(meshesUnder) : []);
    for (const { mesh, name, mat, base } of meshes) {
      const s = manifest.structures[name];
      mesh.visible = layers[s.layer];
      const isSel = sel.has(name);
      const opacity = isSel ? (s.layer === 'skin' ? 0.3 : flowOn || s.layer === 'lungs' ? 0.6 : 0.95) : baseOpacity(s.layer, flowOn, !!selected);
      mat.opacity = opacity;
      mat.depthWrite = opacity > 0.9;
      mat.color.copy(base);
      mat.emissive.set(isSel ? COLORS.selected : stepMeshes.has(name) ? COLORS.stepGlow : '#000000');
      mat.emissiveIntensity = isSel ? 0.28 : s.layer === 'lungs' ? 0.15 : 0.3;
      mesh.renderOrder = s.layer === 'skin' ? 5 : isSel ? 2 : s.layer === 'lungs' ? 4 : s.layer === 'heart' ? 1 : 0;
      // cross-section: clip with the shared plane and show inner faces of cut organs
      const clip = section.enabled ? [clipPlane] : null;
      if ((mat.clippingPlanes?.length ?? 0) !== (clip?.length ?? 0)) { mat.clippingPlanes = clip; mat.side = clip ? THREE.DoubleSide : THREE.FrontSide; mat.needsUpdate = true; }
    }
  }, [meshes, selected, layers, flowOn, flowStep, section.enabled]);

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
  const focus = (e: ThreeEvent<MouseEvent>) => {
    const name = pickFrom(e.intersections);
    if (!name) return;
    e.stopPropagation();
    select(name);
    requestCamera({ kind: 'focus', name: useAtlas.getState().selected ?? name });
  };
  const out = () => { setHovered(null); document.body.style.cursor = ''; };

  return <primitive object={scene} onClick={pick} onDoubleClick={focus} onPointerMove={hover} onPointerOut={out} />;
}

/**
 * Every model in its own Suspense boundary, so each appears as soon as it has loaded.
 * Models whose layers are hidden are not fetched until the layer is first switched on (then kept).
 */
export function HeartModels() {
  const layers = useAtlas((s) => s.layers);
  const [wanted, setWanted] = useState<Set<string>>(() => new Set(modelsFor(layers)));
  useEffect(() => {
    const need = modelsFor(layers).filter((f) => !wanted.has(f));
    if (need.length) setWanted(new Set([...wanted, ...need]));
  }, [layers, wanted]);
  return <>{manifest.models.filter((m) => wanted.has(m.file)).map((m) => <Suspense key={m.file} fallback={null}><Model file={m.file} /></Suspense>)}</>;
}

// start fetching the default-visible models right away
modelsFor(useAtlas.getState().layers).forEach((f) => useGLTF.preload(url(f)));
