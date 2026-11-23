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
import { appearanceFor } from '../lib/appearance';
import { softwareRendering } from '../lib/renderProfile';

/** Inverted-hull hover outline: a back-face copy of the mesh pushed out along its normals, in the accent colour. */
export const outlineThickness = { value: 0.002 };
const outlineMaterial = new THREE.MeshBasicMaterial({ color: COLORS.hover, side: THREE.BackSide });
outlineMaterial.onBeforeCompile = (shader) => {
  shader.uniforms.uThickness = outlineThickness;
  shader.vertexShader = `uniform float uThickness;\n${shader.vertexShader}`.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normalize(objectNormal) * uThickness;');
};
const noRaycast = () => {};

/** Realistic, slightly wet organ surface (clear coat) on GPUs; plain PBR on software renderers to stay fast. */
function organMaterial(color: THREE.Color): THREE.MeshStandardMaterial {
  return softwareRendering
    ? new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, transparent: true })
    : new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.45, transparent: true });
}

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
  const { selected, hovered, isolate, layers, flowOn, flowStep, select, setHovered, markLoaded, requestCamera, section } = useAtlas();
  useBreathing(scene);

  // One material per mesh so each structure can be highlighted independently.
  const meshes = useMemo(() => {
    const list: { mesh: THREE.Mesh; name: string; mat: THREE.MeshStandardMaterial; base: THREE.Color; outline: THREE.Mesh | null }[] = [];
    const found: THREE.Object3D[] = [];
    scene.traverse((o) => { if ((o as THREE.Mesh).isMesh && !o.userData.outline) found.push(o); }); // collect first: outlines are added below
    found.forEach((o) => {
      const name = structureOf(o);
      const s = name ? manifest.structures[name] : null;
      if (!s || !name) return;
      const base = new THREE.Color(colorFor(s));
      const mat = organMaterial(base);
      const mesh = o as THREE.Mesh;
      mesh.material = mat;
      let outline = (mesh.children.find((c) => c.userData.outline) as THREE.Mesh | undefined) ?? null;
      if (!outline && s.layer !== 'skin' && mesh.geometry.attributes.normal) {
        outline = new THREE.Mesh(mesh.geometry, outlineMaterial);
        outline.visible = false; outline.raycast = noRaycast; outline.userData.outline = true;
        mesh.add(outline);
      }
      list.push({ mesh, name, mat, base, outline });
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
      const a = appearanceFor({ layer: s.layer, isSelected: isSel, hasSelection: !!selected, isolate, flowOn });
      mat.opacity = a.opacity;
      mat.depthWrite = a.depthWrite;
      mesh.renderOrder = a.renderOrder;
      mat.color.copy(base);
      mat.emissive.set(isSel ? COLORS.selected : stepMeshes.has(name) ? COLORS.stepGlow : '#000000');
      mat.emissiveIntensity = isSel ? 0.22 : 0.3;
      // cross-section: clip with the shared plane and show inner faces of cut organs
      const clip = section.enabled ? [clipPlane] : null;
      if ((mat.clippingPlanes?.length ?? 0) !== (clip?.length ?? 0)) { mat.clippingPlanes = clip; mat.side = clip ? THREE.DoubleSide : THREE.FrontSide; mat.needsUpdate = true; }
    }
  }, [meshes, selected, isolate, layers, flowOn, flowStep, section.enabled]);

  // hover: outline the structure under the cursor
  useEffect(() => {
    const hov = new Set(hovered ? meshesUnder(hovered) : []);
    for (const { name, outline } of meshes) if (outline) outline.visible = hov.has(name);
  }, [meshes, hovered]);

  const pick = (e: ThreeEvent<MouseEvent>) => {
    const name = pickFrom(e.intersections);
    if (!name) return;
    e.stopPropagation();
    select(name);
    // orbit around what was clicked (distance kept; double-click flies close)
    requestCamera({ kind: 'target', name: useAtlas.getState().selected ?? name });
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
  // the skin outline joins only after every other requested model is in the scene,
  // so a slow connection never shows an empty outline while the organs are still downloading
  const organsIn = useAtlas((s) => [...wanted].every((f) => f === SKIN_FILE || s.loadedModels.includes(f)));
  return <>{manifest.models.filter((m) => wanted.has(m.file) && (m.file !== SKIN_FILE || organsIn)).map((m) => <Suspense key={m.file} fallback={null}><Model file={m.file} /></Suspense>)}</>;
}

const SKIN_FILE = 'skin.glb';
// start fetching the default-visible models right away (the small skin outline last)
modelsFor(useAtlas.getState().layers).filter((f) => f !== SKIN_FILE).forEach((f) => useGLTF.preload(url(f)));
