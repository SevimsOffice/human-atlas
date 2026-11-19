import { textFor, type Structure } from '@atlas/anatomy-manifest';

// Visual direction (CLAUDE.md): calm lab palette, one accent per system. Cardiovascular = deep red.
export const COLORS = {
  tissue: '#8e3b3f',
  valve: '#d8d0bf',
  bloodLow: '#4b6a8c',
  bloodHigh: '#a8323a',
  selected: '#c9a36a',
  stepGlow: '#f1d9b0',
};

/** Colour of a mesh: vessels by the oxygen content of the blood they carry (sourced in content/texts), heart tissue neutral. */
export function colorFor(s: Structure): string {
  if (/valve/.test(s.name)) return COLORS.valve;
  if (s.layer !== 'heart') {
    const blood = textFor(s.name)?.text.blood;
    if (blood === 'low') return COLORS.bloodLow;
    if (blood === 'high') return COLORS.bloodHigh;
  }
  return COLORS.tissue;
}
