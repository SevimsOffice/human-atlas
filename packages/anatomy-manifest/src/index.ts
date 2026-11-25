import manifestJson from './manifest.json';
import termsJson from '../../../content/terms/anatomy-terms.tr.json';
import textsJson from '../../../content/texts/structures.json';
import bloodPathJson from '../../../content/blood-path.json';

export * from './sources';

export type Layer = 'heart' | 'greatVessels' | 'coronaryVessels' | 'lungs' | 'airways' | 'urinary' | 'digestive' | 'lymphatic' | 'nervous' | 'skin';

/** Layers grouped by body system (Milestone 4 overview). */
export const SYSTEM_LAYERS: { system: 'cardiovascular' | 'respiratory' | 'urinary' | 'digestive' | 'lymphatic' | 'nervous' | 'integumentary'; layers: Layer[] }[] = [
  { system: 'cardiovascular', layers: ['heart', 'greatVessels', 'coronaryVessels'] },
  { system: 'respiratory', layers: ['lungs', 'airways'] },
  { system: 'urinary', layers: ['urinary'] },
  { system: 'digestive', layers: ['digestive'] },
  { system: 'lymphatic', layers: ['lymphatic'] },
  { system: 'nervous', layers: ['nervous'] },
  { system: 'integumentary', layers: ['skin'] },
];
export type Lang = 'tr' | 'en';
export type Blood = 'low' | 'high';

export interface Structure {
  name: string;
  model: string;
  sourceId: string;
  layer: Layer;
  parent: string | null;
  children: string[];
  isMesh: boolean;
  crosswalk: { label: string; id: string } | null;
  override: { reason: string; displayLabel: string; crosswalkRejected: boolean } | null;
  uberon: { id: string; via: string; label: string | null; definition: string | null; partOf: { id: string; label: string | null }[] } | null;
  center: [number, number, number] | null;
  size?: [number, number, number];
  neighbors?: string[];
}

export interface Manifest {
  generator: string;
  uberonVersion: string;
  neighborThresholdMm: number;
  models: { file: string; sourceId: string; hraId: string; layer: string }[];
  structures: Record<string, Structure>;
}

export interface StructureText { status: 'unreviewed' | 'reviewed'; cites: string[]; en: string; tr: string; blood?: Blood }
export interface BloodPathStep { id: string; at: string | null; highlight: string[]; blood: Blood; modelled: boolean }

export const manifest = manifestJson as unknown as Manifest;
export const trTerms = (termsJson as { terms: Record<string, { tr: string; status: string }> }).terms;
export const texts = (textsJson as unknown as { texts: Record<string, StructureText> }).texts;
export const bloodPath = (bloodPathJson as unknown as { steps: BloodPathStep[] }).steps;

const short = (name: string) => name.replace(/^VH_M_/, '');
const SEGMENT = /_[ab]$/;

export function getStructure(name: string): Structure | undefined {
  return manifest.structures[name];
}

/** Segment meshes (`…_a`, `…_b`) are parts of one anatomical structure: selecting one selects the parent. */
export function resolveSelectable(name: string): string {
  const s = manifest.structures[name];
  if (s?.parent && SEGMENT.test(name) && name.replace(SEGMENT, '') === s.parent) return s.parent;
  return name;
}

/** Sentence case: source labels mix 'Left Main Bronchus' and 'left main bronchus'. */
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

/** Display label. EN comes from the sources (override > HRA crosswalk > Uberon > node name); TR from the terms file. */
export function label(name: string, lang: Lang): { text: string; needsReview: boolean; missingTr?: boolean } {
  const key = short(resolveSelectable(name));
  if (lang === 'tr') {
    const t = trTerms[key];
    if (t) return { text: t.tr, needsReview: t.status !== 'expert-reviewed' };
  }
  const missingTr = lang === 'tr';
  const s = manifest.structures[resolveSelectable(name)];
  const en = s?.override?.displayLabel ?? s?.crosswalk?.label ?? s?.uberon?.label ?? key.replace(/_/g, ' ');
  return { text: capitalize(en), needsReview: lang === 'tr', ...(missingTr ? { missingTr } : {}) };
}

/** Our short explanatory text for a structure, inherited from the nearest ancestor that has one. */
export function textFor(name: string): { key: string; text: StructureText } | null {
  for (let n: string | null = name; n; n = manifest.structures[n]?.parent ?? null) {
    const t = texts[short(n)];
    if (t) return { key: short(n), text: t };
  }
  return null;
}

/** All mesh node names under a structure (itself included when it is a mesh). */
export function meshesUnder(name: string): string[] {
  const s = manifest.structures[name];
  if (!s) return [];
  return (s.isMesh ? [name] : []).concat(...s.children.map(meshesUnder));
}

/** Structures offered in the inspector list: the meaningful anatomical units, in model order. */
export const LIST_GROUPS: { id: string; layer: Layer; items: string[] }[] = [
  { id: 'chambers', layer: 'heart', items: ['VH_M_right_cardiac_atrium', 'VH_M_heart_right_ventricle', 'VH_M_left_cardiac_atrium', 'VH_M_heart_left_ventricle', 'VH_M_interventricular_septum'] },
  { id: 'valves', layer: 'heart', items: ['VH_M_tricuspid_valve', 'VH_M_pulmonary_valve', 'VH_M_mitral_valve', 'VH_M_aortic_valve', 'VH_M_papillary_muscle_of_heart'] },
  { id: 'greatVessels', layer: 'greatVessels', items: ['VH_M_superior_vena_cava', 'VH_M_inferior_vena_cava', 'VH_M_pulmonary_trunk', 'VH_M_pulmonary_artery_R', 'VH_M_pulmonary_artery_L', 'VH_M_pulmonary_vein', 'VH_M_ascending_aorta', 'VH_M_aortic_arch', 'VH_M_descending_aorta'] },
  { id: 'coronaryVessels', layer: 'coronaryVessels', items: ['VH_M_left_coronary_artery', 'VH_M_right_coronary_artery', 'VH_M_left_anterior_descending_artery', 'VH_M_coronary_sinus', 'VH_M_great_cardiac_vein'] },
  { id: 'lungs', layer: 'lungs', items: ['VH_M_lungs_R', 'VH_M_lungs_R_upper_lobe', 'VH_M_lungs_R_middle_lobe', 'VH_M_lungs_R_lower_lobe', 'VH_M_lungs_L', 'VH_M_lungs_L_upper_lobe', 'VH_M_lungs_L_lower_lobe'] },
  { id: 'airways', layer: 'airways', items: ['VH_M_trachea', 'VH_M_carina', 'VH_M_right_main_bronchus', 'VH_M_left_main_bronchus', 'VH_M_bronchi'] },
  { id: 'urinary', layer: 'urinary', items: ['VH_M_right_kidney', 'VH_M_left_kidney', 'VH_M_ureter_R', 'VH_M_ureter_L', 'VH_M_urinary_bladder'] },
  { id: 'digestive', layer: 'digestive', items: ['VH_M_liver', 'VH_M_pancreas', 'VH_M_duodenum', 'VH_M_jejunum', 'VH_M_ileum', 'VH_M_colon', 'VH_M_rectum'] },
  { id: 'lymphatic', layer: 'lymphatic', items: ['VH_M_spleen'] },
  { id: 'nervous', layer: 'nervous', items: ['VH_M_spinal_cord'] },
  { id: 'skin', layer: 'skin', items: ['VH_M_skin'] },
];
