// Builds the optimized GLBs shipped in apps/web/public/models from the raw HRA files in data/raw/hubmap.
//  heart.glb         <- VH_M_Heart.glb (all nodes)
//  heart-vessels.glb <- VH_M_Blood_Vasculature.glb, subtree "VH_M_blood_vasculature_of_heart" only
//  lungs.glb         <- VH_M_Lung.glb (all nodes: lungs + tracheobronchial tree)
//  …and every other model listed in scripts/models.config.json (M4: urinary, digestive, lymphatic, nervous, skeletal)
// Changes (recorded in docs/SOURCES.md): subtree extraction, dedup, weld, Meshopt compression (quantization).
// Node names are preserved: they are the join key to the anatomy manifest.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, weld, prune, meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import { mkdir, stat } from 'node:fs/promises';

const RAW = 'data/raw/hubmap';
const OUT = 'apps/web/public/models';
await mkdir(OUT, { recursive: true });
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });

async function build(src, dest, keepSubtree) {
  const doc = await io.read(`${RAW}/${src}`);
  if (keepSubtree) {
    const keep = doc.getRoot().listNodes().find((n) => n.getName() === keepSubtree);
    if (!keep) throw new Error(`node ${keepSubtree} not found in ${src}`);
    const scene = doc.getRoot().getDefaultScene();
    // keep transforms of ancestors (all identity in HRA files; asserted here)
    for (let p = keep.getParentNode(); p; p = p.getParentNode()) {
      const m = p.getMatrix(); const id = [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
      if (m.some((v, i) => Math.abs(v - id[i]) > 1e-9)) throw new Error(`non-identity ancestor ${p.getName()}`);
    }
    for (const c of scene.listChildren()) scene.removeChild(c);
    keep.getParentNode()?.removeChild(keep);
    scene.addChild(keep);
  }
  await doc.transform(prune(), dedup(), weld(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  await io.write(`${OUT}/${dest}`, doc);
  const { size } = await stat(`${OUT}/${dest}`);
  console.log(`${dest}: ${(size / 1024).toFixed(0)} KiB`);
}

import { readFileSync } from 'node:fs';
const cfg = JSON.parse(readFileSync('scripts/models.config.json', 'utf8'));
for (const m of cfg.models) await build(m.raw, m.file, m.subtree ?? undefined);
