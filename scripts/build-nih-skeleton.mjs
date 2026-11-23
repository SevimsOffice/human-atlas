// Builds apps/web/public/models/skeleton-outline.glb from the NIH 3D full skeleton (3DPX-016838, CC BY).
//
// Input : data/raw/nih3d/Skeleton.stl (git-ignored). Download:
//         https://nih3d-v2-data-cln-media-prod.s3.amazonaws.com/497900/Skeleton.stl  (26,643,984 bytes,
//         S3 ETag 721bf512b82796efb45cb2b64febda27-4, checked below). Binary STL, millimetres, Z up, +Y posterior.
// Output: one unlabelled mesh "NIH_skeleton_outline", fitted to the HuBMAP male pelvis + leg bones.
//
// Fit:
//   1. mm → m, Z-up → Y-up, anterior → +Z (a proper rotation, no mirroring).
//   2. Split the CT mesh into its bones (connected components). Leg bones = bones whose top is below 45 % of body
//      height, without the anterior hand bones lying over the thighs in this CT pose; side by x. Everything else = torso.
//   3. Torso: trimmed ICP with a similarity transform (rotation + uniform scale + translation, Umeyama 1991) from the
//      CT pelvis bones (45–58 % of height) to the HRA pelvis model, started with the CT soles on the HRA skin soles.
//   4. Each leg: the same ICP, rigid (scale fixed to the torso's), from that side's CT leg bones to the HRA femur/patella/tibia/fibula of that side.
//      The CT subject stands with the legs closer together than the Visible Human Male, so one rigid transform
//      for the whole body cannot match both; per-leg transforms can (the hips may show a small step).
//   The 45 % / 58 % / 6 cm values only sort bones into parts; they are not anatomical data and are not shown.
// Then weld, simplify (meshoptimizer), recompute normals, Meshopt-compress. The fit result is printed and
// written to scripts/nih-skeleton-fit.json (committed, so the transform is reviewable).
import { Document, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, simplify, meshopt, prune, dedup } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';

const SRC = 'data/raw/nih3d/Skeleton.stl';
const OUT = 'apps/web/public/models/skeleton-outline.glb';
const EXPECTED_ETAG = '721bf512b82796efb45cb2b64febda27-4';
const SIMPLIFY_RATIO = 0.12;

// ---------- input check ----------
const buf = readFileSync(SRC);
const part = 8 * 1024 * 1024, md5 = (b) => createHash('md5').update(b).digest();
const parts = []; for (let i = 0; i < buf.length; i += part) parts.push(md5(buf.subarray(i, i + part)));
const etag = `${createHash('md5').update(Buffer.concat(parts)).digest('hex')}-${parts.length}`;
if (etag !== EXPECTED_ETAG) throw new Error(`Skeleton.stl does not match the NIH 3D file (ETag ${etag})`);

// ---------- STL → positions in HRA axes (metres, Y up, +Z anterior) ----------
const nTri = buf.readUInt32LE(80);
const pos = new Float32Array(nTri * 9);
for (let t = 0; t < nTri; t++) {
  const o = 84 + t * 50 + 12;
  for (let v = 0; v < 3; v++) {
    const x = buf.readFloatLE(o + v * 12), y = buf.readFloatLE(o + v * 12 + 4), z = buf.readFloatLE(o + v * 12 + 8);
    const i = (t * 3 + v) * 3;
    pos[i] = x / 1000; pos[i + 1] = z / 1000; pos[i + 2] = -y / 1000; // rotation about X by −90°
  }
}

// ---------- HRA target points: pelvis + knee models (raw files, world space) ----------
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
async function worldPoints(file) {
  const doc = await io.read(`data/raw/hubmap/${file}`);
  const out = [];
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh(); if (!mesh) continue;
    const m = node.getWorldMatrix();
    for (const prim of mesh.listPrimitives()) {
      const a = prim.getAttribute('POSITION'); const p = [0, 0, 0];
      for (let i = 0; i < a.getCount(); i++) {
        a.getElement(i, p);
        out.push([m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]]);
      }
    }
  }
  return out;
}
const pelvisPts = await worldPoints('VH_M_Pelvis.glb');
const legPts = { L: await worldPoints('VH_M_Knee_L.glb'), R: await worldPoints('VH_M_Knee_R.glb') }; // femur, patella, tibia, fibula (+x = HRA left)
const skin = await worldPoints('VH_M_Skin.glb');
const bbox = (pts) => pts.reduce((b, p) => { for (let k = 0; k < 3; k++) { b[0][k] = Math.min(b[0][k], p[k]); b[1][k] = Math.max(b[1][k], p[k]); } return b; }, [[Infinity, Infinity, Infinity], [-Infinity, -Infinity, -Infinity]]);
const centre = (pts) => pts.reduce((c, p) => [c[0] + p[0] / pts.length, c[1] + p[1] / pts.length, c[2] + p[2] / pts.length], [0, 0, 0]);

// ---------- split the CT mesh into bones (connected components of the welded mesh) ----------
const vid = new Map(); const V = []; const T = new Uint32Array(nTri * 3);
for (let i = 0; i < nTri * 3; i++) {
  const k = `${pos[i * 3]},${pos[i * 3 + 1]},${pos[i * 3 + 2]}`; let id = vid.get(k);
  if (id === undefined) { id = V.length; vid.set(k, id); V.push([pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]]); }
  T[i] = id;
}
const par = new Int32Array(V.length).map((_, i) => i); const root = (a) => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
for (let i = 0; i < T.length; i += 3) { const a = root(T[i]); par[root(T[i + 1])] = a; par[root(T[i + 2])] = a; }
const comps = new Map();
V.forEach((p, i) => { const r = root(i); let c = comps.get(r); if (!c) comps.set(r, c = { pts: [] }); c.pts.push(p); });
const sb = bbox(V), H = sb[1][1] - sb[0][1];
// leg bones: everything below the hip joint (top below 45 % of body height: femur, patella, tibia, fibula, foot),
// except the anterior hand bones lying over the thighs in this CT pose (the feet are the only anterior bones that low)
const boneSide = new Map();
for (const [r, c] of comps) {
  const b = bbox(c.pts), top = (b[1][1] - sb[0][1]) / H, bottom = (b[0][1] - sb[0][1]) / H;
  const leg = top < 0.45 && (bottom < 0.06 || b[1][2] < centre(V)[2] + 0.06);
  boneSide.set(r, leg ? (centre(c.pts)[0] > 0 ? 'L' : 'R') : 'torso');
}
const partOf = (i) => boneSide.get(root(i));

// ---------- nearest neighbour: uniform grid ----------
function grid(points, CELL = 0.02) {
  const g = new Map(); const key = (x, y, z) => `${x},${y},${z}`;
  for (const p of points) { const k = key(Math.floor(p[0] / CELL), Math.floor(p[1] / CELL), Math.floor(p[2] / CELL)); (g.get(k) ?? g.set(k, []).get(k)).push(p); }
  return (q, maxR = 3) => {
    const cx = Math.floor(q[0] / CELL), cy = Math.floor(q[1] / CELL), cz = Math.floor(q[2] / CELL);
    let best = null, bd = Infinity;
    for (let r = 0; r <= maxR; r++) {
      for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) for (let dz = -r; dz <= r; dz++) {
        if (Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz)) !== r) continue;
        for (const p of g.get(key(cx + dx, cy + dy, cz + dz)) ?? []) { const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2; if (d < bd) { bd = d; best = p; } }
      }
      if (best && Math.sqrt(bd) <= r * CELL) break;
    }
    return best ? { p: best, d: Math.sqrt(bd) } : null;
  };
}

// ---------- Umeyama similarity estimate (3×3 SVD via Jacobi on AᵀA) ----------
function svd3(A) {
  const AtA = [0, 1, 2].map((i) => [0, 1, 2].map((j) => A[0][i] * A[0][j] + A[1][i] * A[1][j] + A[2][i] * A[2][j]));
  let V = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; const S = AtA.map((r) => r.slice());
  for (let sweep = 0; sweep < 50; sweep++) for (const [p, q] of [[0, 1], [0, 2], [1, 2]]) {
    if (Math.abs(S[p][q]) < 1e-15) continue;
    const th = 0.5 * Math.atan2(2 * S[p][q], S[q][q] - S[p][p]), c = Math.cos(th), sn = Math.sin(th);
    for (let k = 0; k < 3; k++) { const a = S[k][p], b = S[k][q]; S[k][p] = c * a - sn * b; S[k][q] = sn * a + c * b; }
    for (let k = 0; k < 3; k++) { const a = S[p][k], b = S[q][k]; S[p][k] = c * a - sn * b; S[q][k] = sn * a + c * b; }
    for (let k = 0; k < 3; k++) { const a = V[k][p], b = V[k][q]; V[k][p] = c * a - sn * b; V[k][q] = sn * a + c * b; }
  }
  const sig = [0, 1, 2].map((i) => Math.sqrt(Math.max(S[i][i], 0)));
  const U = [0, 1, 2].map((r) => [0, 1, 2].map((c) => (sig[c] > 1e-12 ? (A[r][0] * V[0][c] + A[r][1] * V[1][c] + A[r][2] * V[2][c]) / sig[c] : 0)));
  return { U, sig, V };
}
const det3 = (M) => M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
function umeyama(src, dst, fixedScale = null) {
  const n = src.length, ms = centre(src), md = centre(dst);
  let varS = 0; const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < n; i++) {
    const a = src[i].map((v, k) => v - ms[k]), b = dst[i].map((v, k) => v - md[k]);
    varS += (a[0] ** 2 + a[1] ** 2 + a[2] ** 2) / n;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) C[r][c] += (b[r] * a[c]) / n;
  }
  const { U, sig, V } = svd3(C);
  const D = [1, 1, det3(U) * det3(V) < 0 ? -1 : 1];
  const Rn = [0, 1, 2].map((r) => [0, 1, 2].map((c) => U[r][0] * D[0] * V[c][0] + U[r][1] * D[1] * V[c][1] + U[r][2] * D[2] * V[c][2]));
  const sc = fixedScale ?? (sig[0] * D[0] + sig[1] * D[1] + sig[2] * D[2]) / varS;
  const tn = [0, 1, 2].map((k) => md[k] - sc * (Rn[k][0] * ms[0] + Rn[k][1] * ms[1] + Rn[k][2] * ms[2]));
  return { s: sc, R: Rn, t: tn };
}

const mk = (s, R, t) => ({ s, R, t, apply: (p) => [0, 1, 2].map((k) => s * (R[k][0] * p[0] + R[k][1] * p[1] + R[k][2] * p[2]) + t[k]) });
/** Trimmed ICP with a similarity transform: src points → target point set, starting from `init`. */
function icp(src, targetPts, init, { keepFraction = 0.7, yBand = null, iterations = 60, fixedScale = null } = {}) {
  const nn = grid(targetPts); let tf = init, rms = 0;
  for (let it = 0; it < iterations; it++) {
    const pairs = [];
    for (const p of src) { const q = tf.apply(p); if (yBand && (q[1] < yBand[0] || q[1] > yBand[1])) continue; const m = nn(q); if (m) pairs.push({ p, q: m.p, d: m.d }); }
    pairs.sort((a, b) => a.d - b.d);
    const keep = pairs.slice(0, Math.floor(pairs.length * keepFraction));
    const e = umeyama(keep.map((k) => k.p), keep.map((k) => k.q), fixedScale);
    const prev = rms; tf = mk(e.s, e.R, e.t);
    rms = Math.sqrt(keep.reduce((a, k) => a + k.d * k.d, 0) / keep.length);
    if (it > 5 && Math.abs(prev - rms) < 1e-6) break;
  }
  return { ...tf, rms };
}
const describe = (f) => ({ scale: +f.s.toFixed(5), rotationDeg: +((Math.acos(Math.min(1, (f.R[0][0] + f.R[1][1] + f.R[2][2] - 1) / 2)) * 180) / Math.PI).toFixed(2), translation: f.t.map((v) => +v.toFixed(4)), rotation: f.R.map((r) => r.map((v) => +v.toFixed(5))), trimmedRmsMetres: +f.rms.toFixed(4) });
const sample = (pts, every) => pts.filter((_, i) => i % every === 0);

// ---------- 1. torso: pelvis bones of the CT onto the HRA pelvis ----------
// start: scale 1, CT soles on the skin soles (+1 cm soft tissue), CT pelvis centre on the HRA pelvis centre (x, z)
const torsoPts = V.filter((_, i) => partOf(i) === 'torso');
const pb = bbox(pelvisPts);
const ctPelvis = torsoPts.filter((p) => { const h = (p[1] - sb[0][1]) / H; return h > 0.45 && h < 0.58 && p[2] < centre(V)[2] + 0.06; });
const cP = centre(ctPelvis), hP = centre(pelvisPts);
const start = mk(1, [[1, 0, 0], [0, 1, 0], [0, 0, 1]], [hP[0] - cP[0], bbox(skin)[0][1] + 0.01 - sb[0][1], hP[2] - cP[2]]);
const torso = icp(sample(ctPelvis, 3), pelvisPts, start, { keepFraction: 0.7 });
// ---------- 2. each leg: its CT leg bones onto the HRA femur/tibia/fibula of the same side ----------
const legFit = {};
for (const side of ['L', 'R']) {
  const src = V.filter((_, i) => partOf(i) === side);
  const lb = bbox(legPts[side]);
  legFit[side] = icp(sample(src, 3), legPts[side], torso, { keepFraction: 0.8, yBand: [lb[0][1] - 0.03, lb[1][1] + 0.03], fixedScale: torso.s }); // rigid: same scale as the torso
}
const fit = {
  source: 'NIH 3D 3DPX-016838 Skeleton.stl', etag, method: 'per-part trimmed ICP, similarity transform (Umeyama 1991); parts = connected components of the CT mesh',
  bones: comps.size, torso: describe(torso), leftLeg: describe(legFit.L), rightLeg: describe(legFit.R),
};
console.log('fit', JSON.stringify({ torso: fit.torso.trimmedRmsMetres, L: fit.leftLeg.trimmedRmsMetres, R: fit.rightLeg.trimmedRmsMetres, scale: [fit.torso.scale, fit.leftLeg.scale, fit.rightLeg.scale] }));
writeFileSync('scripts/nih-skeleton-fit.json', `${JSON.stringify(fit, null, 1)}\n`);

// apply per part (on the welded vertex list, then rebuild the indexed mesh)
const tfOf = { torso, L: legFit.L, R: legFit.R };
const outPos = new Float32Array(V.length * 3);
V.forEach((p, i) => { const q = tfOf[partOf(i)].apply(p); outPos[i * 3] = q[0]; outPos[i * 3 + 1] = q[1]; outPos[i * 3 + 2] = q[2]; });

// ---------- build, simplify, compress ----------
await MeshoptEncoder.ready; await MeshoptSimplifier.ready;
const doc = new Document(); const buffer = doc.createBuffer();
const prim = doc.createPrimitive().setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(outPos).setBuffer(buffer))
  .setIndices(doc.createAccessor().setType('SCALAR').setArray(T).setBuffer(buffer));
const mesh = doc.createMesh('NIH_skeleton_outline').addPrimitive(prim);
doc.createScene().addChild(doc.createNode('NIH_skeleton_outline').setMesh(mesh));
await doc.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: SIMPLIFY_RATIO, error: 0.001 }), prune());
// smooth vertex normals (area-weighted face normals) on the welded mesh
{
  const pr = doc.getRoot().listMeshes()[0].listPrimitives()[0];
  const P = pr.getAttribute('POSITION').getArray(), I = pr.getIndices().getArray(), N = new Float32Array(P.length);
  for (let f = 0; f < I.length; f += 3) {
    const [a, b, c] = [I[f] * 3, I[f + 1] * 3, I[f + 2] * 3];
    const u = [P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2]], v = [P[c] - P[a], P[c + 1] - P[a + 1], P[c + 2] - P[a + 2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    for (const k of [a, b, c]) { N[k] += n[0]; N[k + 1] += n[1]; N[k + 2] += n[2]; }
  }
  for (let i = 0; i < N.length; i += 3) { const l = Math.hypot(N[i], N[i + 1], N[i + 2]) || 1; N[i] /= l; N[i + 1] /= l; N[i + 2] /= l; }
  pr.setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(N).setBuffer(buffer));
}
const tris = doc.getRoot().listMeshes()[0].listPrimitives()[0].getIndices().getCount() / 3;
await doc.transform(dedup(), meshopt({ encoder: MeshoptEncoder, level: 'high' }));
const outIo = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
await outIo.write(OUT, doc);
console.log(`${OUT}: ${(statSync(OUT).size / 1024).toFixed(0)} KiB, ${tris} triangles (from ${nTri})`);
