// Generates packages/anatomy-manifest/src/manifest.json: one entry per GLB node, linking
// node name -> HRA crosswalk ID -> Uberon ID/label/definition/part_of, plus geometry facts
// computed from the model itself (bounding-box centre, neighbouring structures).
// Inputs (data/raw, see scripts/download-hubmap.sh). Deterministic: no timestamps, sorted output.
import { NodeIO } from '@gltf-transform/core';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const RAW = 'data/raw';
const NEIGHBOR_MM = 3; // surfaces closer than this (in model space, metres*1000) count as neighbours
const MODELS = [
  { file: 'heart.glb', raw: 'VH_M_Heart.glb', hraId: 'VH_M_Heart', sourceId: 'HRA-HEART-M', subtree: null },
  { file: 'heart-vessels.glb', raw: 'VH_M_Blood_Vasculature.glb', hraId: 'VH_M_Blood_Vasculature', sourceId: 'HRA-VASC-M', subtree: 'VH_M_blood_vasculature_of_heart' },
];

// ---- crosswalk CSV ----
function parseCsv(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
}
// Some rows are filed under another model's ID (e.g. heart vessels under VH_M_Heart), so index by node
// name and prefer the row whose model ID matches the file being processed.
const xwRows = new Map();
for (const r of parseCsv(await readFile(`${RAW}/hubmap/asct-b-3d-models-mapping.v1.3.csv`, 'utf8'))) {
  if (r.length >= 7 && r[2]?.startsWith('VH_M_')) {
    const k = r[2].trim(); (xwRows.get(k) ?? xwRows.set(k, []).get(k)).push({ model: r[6].trim(), label: r[3].trim(), id: r[4].trim() });
  }
}
const xwLookup = (model, node) => { const rs = xwRows.get(node) ?? []; const r = rs.find((x) => x.model === model) ?? rs[0];
  return r ? { label: r.label, id: r.id, filedUnder: r.model } : null; };

// ---- Uberon OBO ----
const obo = await readFile(`${RAW}/uberon/uberon.obo`, 'utf8');
const uberonVersion = obo.match(/^data-version: (.*)$/m)?.[1] ?? 'unknown';
const terms = new Map(); const fmaToUberon = new Map();
for (const st of obo.split('\n[Term]\n').slice(1)) {
  const id = st.match(/^id: (UBERON:\d+)$/m)?.[1]; if (!id) continue;
  if (/^is_obsolete: true$/m.test(st)) continue;
  const name = st.match(/^name: (.*)$/m)?.[1];
  const def = st.match(/^def: "((?:[^"\\]|\\.)*)"/m)?.[1]?.replace(/\\"/g, '"') ?? null;
  const partOf = [...st.matchAll(/^relationship: part_of (UBERON:\d+)/gm)].map((m) => m[1]);
  terms.set(id, { name, def, partOf });
  for (const m of st.matchAll(/^xref: (FMA:\d+)\b/gm)) if (!fmaToUberon.has(m[1])) fmaToUberon.set(m[1], id);
}

// ---- documented corrections of upstream mappings (each with a reason) ----
const overrides = JSON.parse(await readFile('packages/anatomy-manifest/overrides.json', 'utf8'));

// ---- geometry ----
const io = new NodeIO();
function worldVerts(node) {
  const mesh = node.getMesh(); if (!mesh) return null;
  const m = node.getWorldMatrix(); const out = [];
  for (const p of mesh.listPrimitives()) {
    const a = p.getAttribute('POSITION'); const v = [0, 0, 0];
    for (let i = 0; i < a.getCount(); i++) {
      a.getElement(i, v);
      out.push(m[0]*v[0]+m[4]*v[1]+m[8]*v[2]+m[12], m[1]*v[0]+m[5]*v[1]+m[9]*v[2]+m[13], m[2]*v[0]+m[6]*v[1]+m[10]*v[2]+m[14]);
    }
  }
  return Float64Array.from(out);
}
const r4 = (x) => Math.round(x * 1e4) / 1e4;
function bbox(vs) { const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < vs.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], vs[i + k]); mx[k] = Math.max(mx[k], vs[i + k]); }
  return { mn, mx }; }

const entries = {}; const meshVerts = new Map();
for (const M of MODELS) {
  const doc = await io.read(`${RAW}/hubmap/${M.raw}`);
  const roots = M.subtree ? [doc.getRoot().listNodes().find((n) => n.getName() === M.subtree)] : doc.getRoot().getDefaultScene().listChildren();
  const visit = (node, parent, coronary) => {
    const name = node.getName();
    const isCoronary = coronary || name === 'VH_M_cardiac_artery' || name === 'VH_M_cardiac_vein';
    const cw = xwLookup(M.hraId, name);
    let uberonId = null, uberonVia = null;
    if (cw?.id?.startsWith('UBERON:')) { uberonId = cw.id; uberonVia = 'hra-crosswalk'; }
    else if (cw?.id?.startsWith('FMA:') && fmaToUberon.has(cw.id)) { uberonId = fmaToUberon.get(cw.id); uberonVia = `uberon-xref:${cw.id}`; }
    const ov = overrides[name];
    if (ov) { uberonId = ov.uberonId; uberonVia = 'override'; }
    const t = uberonId ? terms.get(uberonId) : null;
    entries[name] = {
      name, model: M.file, sourceId: M.sourceId,
      layer: M.file === 'heart.glb' ? 'heart' : isCoronary ? 'coronaryVessels' : 'greatVessels',
      parent: parent?.getName() ?? null,
      children: node.listChildren().map((c) => c.getName()),
      isMesh: !!node.getMesh(),
      crosswalk: cw && cw.id !== '-' ? { label: cw.label, id: cw.id } : null,
      override: ov ? { reason: ov.reason, displayLabel: ov.crosswalkLabel } : null,
      uberon: uberonId ? { id: uberonId, via: uberonVia, label: t?.name ?? null, definition: t?.def ?? null,
        partOf: (t?.partOf ?? []).map((id) => ({ id, label: terms.get(id)?.name ?? null })) } : null,
    };
    const vs = worldVerts(node); if (vs) meshVerts.set(name, vs);
    node.listChildren().forEach((c) => visit(c, node, isCoronary));
  };
  roots.forEach((r) => visit(r, null, false));
}

// centres: bbox centre of all descendant mesh vertices
function descMeshes(n) { const e = entries[n]; return (e.isMesh ? [n] : []).concat(...e.children.map(descMeshes)); }
for (const [n, e] of Object.entries(entries)) {
  const ms = descMeshes(n); if (!ms.length) { e.center = null; continue; }
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (const m of ms) { const b = bbox(meshVerts.get(m)); for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], b.mn[k]); mx[k] = Math.max(mx[k], b.mx[k]); } }
  e.center = mn.map((v, k) => r4((v + mx[k]) / 2));
  e.size = mn.map((v, k) => r4(mx[k] - v));
}

// neighbours: min vertex distance below threshold, via spatial hash
const d = NEIGHBOR_MM / 1000; const names = [...meshVerts.keys()].sort();
const boxes = new Map(names.map((n) => [n, bbox(meshVerts.get(n))]));
const grids = new Map();
function grid(n) { if (grids.has(n)) return grids.get(n); const g = new Map(); const vs = meshVerts.get(n);
  for (let i = 0; i < vs.length; i += 3) { const k = `${Math.floor(vs[i]/d)},${Math.floor(vs[i+1]/d)},${Math.floor(vs[i+2]/d)}`; (g.get(k) ?? g.set(k, []).get(k)).push(i); }
  grids.set(n, g); return g; }
function near(a, b) { const vs = meshVerts.get(a), vb = meshVerts.get(b), g = grid(b); const step = Math.max(1, Math.floor(vs.length / 3 / 4000)) * 3;
  for (let i = 0; i < vs.length; i += step) { const cx = Math.floor(vs[i]/d), cy = Math.floor(vs[i+1]/d), cz = Math.floor(vs[i+2]/d);
    for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) for (const j of g.get(`${cx+x},${cy+y},${cz+z}`) ?? [])
      if ((vs[i]-vb[j])**2 + (vs[i+1]-vb[j+1])**2 + (vs[i+2]-vb[j+2])**2 < d*d) return true; }
  return false; }
for (const n of names) entries[n].neighbors = [];
for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
  const A = boxes.get(names[i]), B = boxes.get(names[j]);
  if ([0, 1, 2].some((k) => A.mn[k] - d > B.mx[k] || B.mn[k] - d > A.mx[k])) continue;
  if (near(names[i], names[j]) || near(names[j], names[i])) { entries[names[i]].neighbors.push(names[j]); entries[names[j]].neighbors.push(names[i]); }
}

const sorted = Object.fromEntries(Object.keys(entries).sort().map((k) => [k, entries[k]]));
const manifest = {
  generator: 'scripts/build-manifest.mjs', uberonVersion, neighborThresholdMm: NEIGHBOR_MM,
  models: MODELS.map(({ file, sourceId, hraId }) => ({ file, sourceId, hraId })), structures: sorted,
};
await mkdir('packages/anatomy-manifest/src', { recursive: true });
await writeFile('packages/anatomy-manifest/src/manifest.json', JSON.stringify(manifest, null, 1) + '\n');
const vals = Object.values(sorted);
console.log(`structures ${vals.length}, meshes ${vals.filter((e) => e.isMesh).length}, uberon ${vals.filter((e) => e.uberon).length} (via xref ${vals.filter((e) => e.uberon?.via.startsWith('uberon-xref')).length}), no id ${vals.filter((e) => !e.uberon).map((e) => e.name).join(' ')}`);
