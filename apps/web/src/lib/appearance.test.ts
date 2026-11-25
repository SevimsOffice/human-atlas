import { describe, expect, it } from 'vitest';
import { appearanceFor, DIMMED_OPACITY, SKIN_OPACITY } from './appearance';

const base = { isSelected: false, hasSelection: false, isolate: true, flowOn: false } as const;

describe('appearance', () => {
  it('organs and bones are opaque by default; only the skin outline is faint and drawn last', () => {
    for (const layer of ['heart', 'lungs', 'urinary', 'digestive', 'lymphatic', 'nervous', 'greatVessels'] as const) {
      expect(appearanceFor({ ...base, layer })).toEqual({ opacity: 1, depthWrite: true, renderOrder: 0 });
    }
    const skin = appearanceFor({ ...base, layer: 'skin' });
    expect(skin.opacity).toBe(SKIN_OPACITY);
    expect(SKIN_OPACITY).toBeGreaterThanOrEqual(0.08);
    expect(SKIN_OPACITY).toBeLessThanOrEqual(0.12);
    expect(skin.depthWrite).toBe(false);
    expect(skin.renderOrder).toBeGreaterThan(6);
  });
  it('isolate: the selection stays solid, the rest is dimmed; "show all" turns isolate off', () => {
    const sel = appearanceFor({ ...base, layer: 'urinary', isSelected: true, hasSelection: true });
    const other = appearanceFor({ ...base, layer: 'digestive', hasSelection: true });
    expect(sel.opacity).toBe(1);
    expect(other.opacity).toBe(DIMMED_OPACITY);
    expect(other.depthWrite).toBe(false);
    expect(appearanceFor({ ...base, layer: 'digestive', hasSelection: true, isolate: false }).opacity).toBe(1);
  });
  it('blood path makes only the heart, vessels and lungs see-through', () => {
    expect(appearanceFor({ ...base, layer: 'heart', flowOn: true }).opacity).toBeLessThan(0.5);
    expect(appearanceFor({ ...base, layer: 'lungs', flowOn: true }).opacity).toBeLessThan(0.5);
    expect(appearanceFor({ ...base, layer: 'digestive', flowOn: true }).opacity).toBe(1);
  });
});
