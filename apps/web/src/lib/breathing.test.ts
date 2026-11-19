import { describe, expect, it } from 'vitest';
import { breathScale } from './breathing';

describe('breathScale', () => {
  it('starts and ends each breath at rest size', () => {
    expect(breathScale(0)).toBeCloseTo(1, 9);
    expect(breathScale(1)).toBeCloseTo(1, 9);
  });
  it('peaks at end of inhalation and stays within the amplitude', () => {
    expect(breathScale(0.4)).toBeCloseTo(1.03, 9);
    for (let p = 0; p <= 1; p += 0.05) { expect(breathScale(p)).toBeGreaterThanOrEqual(1 - 1e-9); expect(breathScale(p)).toBeLessThanOrEqual(1.03 + 1e-9); }
  });
});
