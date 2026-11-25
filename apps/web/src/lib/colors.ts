import { textFor, type Structure } from '@atlas/anatomy-manifest';

// Visual direction: calm lab palette, but every organ clearly distinguishable from its neighbours.
// Colours are a didactic convention (like an anatomy atlas), not measured tissue colours.
export const COLORS = {
  tissue: '#a8423f', // myocardium
  lung: '#e2a3a8', // respiratory: pink
  airway: '#e9e0cc', // cartilage
  urinary: '#d9b143', // ureters, bladder: yellow ochre
  kidney: '#7c3550', // deep maroon-plum
  liver: '#6f3424', // dark red-brown
  pancreas: '#e7b878', // tan
  smallIntestine: '#e39a83', // salmon
  largeIntestine: '#b07a52', // ochre-brown
  digestive: '#b5866a',
  lymphatic: '#6b4589', // spleen: violet
  nervous: '#efce6a', // spinal cord: pale amber
  skin: '#d6c2b2', // neutral translucent outline
  valve: '#efe4cf',
  bloodLow: '#3f6fb0',
  bloodHigh: '#c2352f',
  selected: '#c9a36a',
  stepGlow: '#f1d9b0',
  hover: '#1f6feb',
};

/** Organ colour by source model (one model = one organ, or a closely related group). */
const BY_MODEL: Record<string, string> = {
  'kidney-left.glb': COLORS.kidney, 'kidney-right.glb': COLORS.kidney,
  'ureter-left.glb': COLORS.urinary, 'ureter-right.glb': COLORS.urinary, 'urinary-bladder.glb': COLORS.urinary,
  'liver.glb': COLORS.liver, 'pancreas.glb': COLORS.pancreas,
  'small-intestine.glb': COLORS.smallIntestine, 'large-intestine.glb': COLORS.largeIntestine,
  'spleen.glb': COLORS.lymphatic, 'spinal-cord.glb': COLORS.nervous,
};

/** Colour of a mesh: vessels by the oxygen content of the blood they carry (sourced in content/texts), organs by model. */
export function colorFor(s: Structure): string {
  if (s.layer === 'lungs') return COLORS.lung;
  if (s.layer === 'airways') return COLORS.airway;
  if (s.layer === 'skin') return COLORS.skin;
  if (BY_MODEL[s.model]) return BY_MODEL[s.model];
  if (s.layer === 'urinary' || s.layer === 'digestive' || s.layer === 'lymphatic' || s.layer === 'nervous') return COLORS[s.layer];
  if (/valve/.test(s.name)) return COLORS.valve;
  if (s.layer !== 'heart') {
    const blood = textFor(s.name)?.text.blood;
    if (blood === 'low') return COLORS.bloodLow;
    if (blood === 'high') return COLORS.bloodHigh;
  }
  return COLORS.tissue;
}
