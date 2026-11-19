import { describe, expect, it } from 'vitest';
import { isClipped, sectionPlane } from './section';

const B = { min: [-1, 0, -2], max: [1, 10, 2] };

describe('cross-section plane', () => {
  it('moves through the bounds with the slider and clamps', () => {
    expect(sectionPlane('transverse', 0.5, B)).toEqual({ normal: [0, -1, 0], constant: 5 });
    expect(sectionPlane('transverse', 2, B).constant).toBe(10);
    expect(sectionPlane('sagittal', 0, B)).toEqual({ normal: [-1, 0, 0], constant: -1 });
    expect(sectionPlane('coronal', 0.25, B).constant).toBe(-1);
  });
  it('keeps the lower part for a transverse cut and removes what lies above', () => {
    const p = sectionPlane('transverse', 0.5, B);
    expect(isClipped([0, 4, 0], p)).toBe(false);
    expect(isClipped([0, 6, 0], p)).toBe(true);
  });
  it('coronal cut keeps the posterior side so the cut face looks toward a front viewer', () => {
    const p = sectionPlane('coronal', 0.5, B); // z = 0
    expect(isClipped([0, 0, -0.5], p)).toBe(false);
    expect(isClipped([0, 0, 0.5], p)).toBe(true);
  });
});
