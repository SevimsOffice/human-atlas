import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { manifest, trTerms, texts, bloodPath, label, textFor, resolveSelectable, meshesUnder, LIST_GROUPS, SOURCES } from '../src';

const sourcesMd = readFileSync(new URL('../../../docs/SOURCES.md', import.meta.url), 'utf8');
const model = readFileSync(new URL('../../../docs/PHYSIOLOGY_MODEL.md', import.meta.url), 'utf8');
const all = Object.values(manifest.structures);

describe('anatomy manifest integrity', () => {
  it('has the heart chambers, valves and the great vessels needed for the blood path', () => {
    for (const n of ['VH_M_right_cardiac_atrium', 'VH_M_heart_left_ventricle', 'VH_M_mitral_valve', 'VH_M_aorta', 'VH_M_pulmonary_trunk', 'VH_M_superior_vena_cava', 'VH_M_pulmonary_vein'])
      expect(manifest.structures[n], n).toBeDefined();
  });
  it('every structure comes from a model registered in docs/SOURCES.md', () => {
    for (const s of all) {
      expect(manifest.models.map((m) => m.file)).toContain(s.model);
      expect(sourcesMd).toContain(`| ${s.sourceId} |`);
    }
  });
  it('every credited source is registered in docs/SOURCES.md', () => {
    for (const s of SOURCES) expect(sourcesMd, s.id).toContain(`| ${s.id} |`);
  });
  it('key structures carry the expected Uberon IDs (from the HRA crosswalk)', () => {
    expect(manifest.structures.VH_M_heart_left_ventricle.uberon?.id).toBe('UBERON:0002084');
    expect(manifest.structures.VH_M_right_cardiac_atrium.uberon?.id).toBe('UBERON:0002078');
    expect(manifest.structures.VH_M_aortic_valve.uberon?.id).toBe('UBERON:0002137');
    expect(manifest.structures.VH_M_superior_vena_cava.uberon).toMatchObject({ id: 'UBERON:0001585', via: 'uberon-xref:FMA:4720' });
  });
  it('the LAD mapping error is corrected only through a documented override', () => {
    const lad = manifest.structures.VH_M_left_anterior_descending_artery;
    expect(lad.crosswalk?.id).toBe('FMA:8636');
    expect(lad.uberon).toMatchObject({ id: 'UBERON:8600102', via: 'override' });
    expect(lad.override?.reason).toMatch(/pulmonary artery/);
    expect(all.filter((s) => s.uberon?.via === 'override').map((s) => s.name)).toEqual(['VH_M_left_anterior_descending_artery']);
  });
  it('mesh nodes have geometry facts; neighbour relations are symmetric', () => {
    for (const s of all.filter((x) => x.isMesh)) {
      expect(s.center).toHaveLength(3);
      for (const n of s.neighbors ?? []) expect(manifest.structures[n].neighbors).toContain(s.name);
    }
  });
});

describe('lungs (Milestone 2)', () => {
  it('adds the HRA lung model with lungs and airway layers', () => {
    expect(manifest.models.map((m) => m.file).slice(0, 3)).toEqual(['heart.glb', 'heart-vessels.glb', 'lungs.glb']);
    expect(manifest.structures.VH_M_lungs_R).toMatchObject({ layer: 'lungs', sourceId: 'HRA-LUNG-M' });
    expect(manifest.structures.VH_M_lungs_R.uberon?.id).toBe('UBERON:0002167');
    expect(manifest.structures.VH_M_left_main_bronchus.layer).toBe('airways');
  });
  it('the right lung has three lobes and the left two (matches OpenStax §22.2)', () => {
    expect(manifest.structures.VH_M_lungs_R.children.filter((c) => c.includes('lobe'))).toHaveLength(3);
    expect(manifest.structures.VH_M_lungs_L.children.filter((c) => c.includes('lobe'))).toHaveLength(2);
  });
  it('the trachea (no crosswalk ID) is resolved only by exact Uberon label', () => {
    expect(manifest.structures.VH_M_trachea.crosswalk).toBeNull();
    expect(manifest.structures.VH_M_trachea.uberon).toMatchObject({ id: 'UBERON:0003126', via: 'uberon-label' });
  });
  it('crosswalk rows that contradict their node are rejected with a reason, not remapped', () => {
    for (const n of ['VH_M_right_apical_bronchus', 'VH_M_right_anterior_basal_bronchus', 'VH_M_left_posetrior_basal_bronchopulmonary_segment']) {
      const s = manifest.structures[n];
      expect(s.override?.crosswalkRejected, n).toBe(true);
      expect(s.crosswalk).toBeNull();
      expect(s.uberon).toBeNull();
    }
    expect(label('VH_M_right_apical_bronchus', 'en').text).toBe('Right apical segmental bronchus');
  });
  it('the blood path passes through the modelled lungs', () => {
    expect(bloodPath.find((s) => s.id === 'lungs')).toMatchObject({ at: 'VH_M_lungs_R', modelled: true });
  });
});

describe('remaining systems (Milestone 4)', () => {
  it('adds HuBMAP urinary, digestive, lymphatic, nervous and skeletal models, all CC BY sources', () => {
    const layers = new Set(all.map((s) => s.layer));
    for (const l of ['urinary', 'digestive', 'lymphatic', 'nervous', 'skeletal']) expect(layers.has(l as never), l).toBe(true);
    for (const m of manifest.models) expect(SOURCES.find((s) => s.id === m.sourceId)?.license, m.sourceId).toBe('CC BY 4.0');
  });
  it('key organs carry Uberon IDs from the crosswalk', () => {
    expect(manifest.structures.VH_M_left_kidney.uberon?.id).toBe('UBERON:0004538');
    expect(manifest.structures.VH_M_liver.uberon?.id).toBe('UBERON:0002107');
    expect(manifest.structures.VH_M_spinal_cord.uberon?.id).toBe('UBERON:0002240');
    expect(manifest.structures.VH_M_pelvis.uberon?.id).toBe('UBERON:0001270');
  });
  it('no node name is reused across models', () => {
    expect(new Set(all.map((s) => s.name)).size).toBe(all.length);
  });
});

describe('labels and texts', () => {
  it('heart, vessel and lung structures (M1–M3) all have a Turkish term; new organs have one for every root and listed structure', () => {
    const roots = all.filter((x) => x.parent === null).map((x) => x.name);
    const listed = LIST_GROUPS.flatMap((g) => g.items);
    const needTr = all.filter((x) => ['heart', 'greatVessels', 'coronaryVessels', 'lungs', 'airways'].includes(x.layer) || roots.includes(x.name) || listed.includes(x.name));
    for (const s of needTr) {
      const tr = label(s.name, 'tr');
      expect(tr.text.length, s.name).toBeGreaterThan(2);
      expect(trTerms[resolveSelectable(s.name).replace('VH_M_', '')], s.name).toBeDefined();
      expect(label(s.name, 'en').text.length).toBeGreaterThan(2);
    }
    expect(Object.values(trTerms).every((t) => t.status === 'needs-expert-review')).toBe(true);
  });
  it('every structure of every model now has a Turkish term (all needs-expert-review)', () => {
    for (const s of all) expect(label(s.name, 'tr').missingTr, s.name).toBeUndefined();
    expect(label('VH_M_cortex_of_kidney_L', 'tr').text).toBe('Sol böbrek korteksi');
  });
  it('an unknown structure would still fall back to an English label, flagged', () => {
    const l = label('VH_M_not_in_terms', 'tr');
    expect(l.missingTr).toBe(true);
  });
  it('no orphan terms or texts (every key is a real node)', () => {
    const keys = new Set(all.map((s) => s.name.replace('VH_M_', '')));
    for (const k of [...Object.keys(trTerms), ...Object.keys(texts)]) expect(keys.has(k), k).toBe(true);
  });
  it('texts are bilingual, carry a status and cite a documented reference', () => {
    for (const [k, t] of Object.entries(texts)) {
      expect(t.en && t.tr, k).toBeTruthy();
      expect(['unreviewed', 'reviewed']).toContain(t.status);
      for (const c of t.cites) expect(model + sourcesMd).toContain(c);
    }
  });
  it('segments resolve to their parent; texts inherit from ancestors', () => {
    expect(resolveSelectable('VH_M_descending_aorta_a')).toBe('VH_M_descending_aorta');
    expect(resolveSelectable('VH_M_pulmonary_artery_L')).toBe('VH_M_pulmonary_artery_L');
    expect(textFor('VH_M_ascending_aorta')?.key).toBe('aorta');
    expect(label('VH_M_left_anterior_descending_artery', 'en').text).toBe('Left anterior descending artery');
    expect(label('VH_M_left_main_bronchus', 'en').text).toBe('Left main bronchus');
  });
  it('inspector list items exist', () => {
    for (const g of LIST_GROUPS) for (const i of g.items) expect(manifest.structures[i], i).toBeDefined();
  });
});

describe('blood path', () => {
  it('follows body → right heart → lungs → left heart → aorta', () => {
    expect(bloodPath.map((s) => s.id)).toEqual(['venaeCavae', 'rightAtrium', 'tricuspidValve', 'rightVentricle', 'pulmonaryValve', 'pulmonaryTrunk', 'pulmonaryArteries', 'lungs', 'pulmonaryVeins', 'leftAtrium', 'mitralValve', 'leftVentricle', 'aorticValve', 'ascendingAorta', 'aorticArch', 'descendingAorta', 'body']);
  });
  it('blood is oxygen-poor until the lungs and oxygen-rich after', () => {
    const i = bloodPath.findIndex((s) => s.id === 'lungs');
    expect(bloodPath.slice(0, i + 1).every((s) => s.blood === 'low')).toBe(true);
    expect(bloodPath.slice(i + 1).every((s) => s.blood === 'high')).toBe(true);
  });
  it('every modelled step points at real meshes', () => {
    for (const s of bloodPath) {
      if (!s.modelled) { expect(s.at).toBeNull(); continue; }
      expect(manifest.structures[s.at!]?.center, s.id).toBeTruthy();
      for (const h of s.highlight) expect(meshesUnder(h).length, h).toBeGreaterThan(0);
    }
  });
});
