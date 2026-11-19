/** Schematic breathing: smooth expansion during the first ~40 % of the cycle (inhalation), relaxation after. */
export const BREATH_AMPLITUDE = 0.03; // visual only, not to scale (documented in PHYSIOLOGY_MODEL.md)

export function breathScale(phase: number, amplitude = BREATH_AMPLITUDE): number {
  const p = ((phase % 1) + 1) % 1;
  const inhale = 0.4;
  const v = p < inhale ? 0.5 - 0.5 * Math.cos((Math.PI * p) / inhale) : 0.5 + 0.5 * Math.cos((Math.PI * (p - inhale)) / (1 - inhale));
  return 1 + amplitude * v;
}
