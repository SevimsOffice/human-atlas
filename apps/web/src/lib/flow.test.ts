import { describe, expect, it } from 'vitest';
import { BeatClock, easeBeat, samplePath, resolveWaypoints } from './flow';
import { computeCardiac } from '@atlas/physiology';

describe('BeatClock', () => {
  it('advances one beat per cycle duration from the engine', () => {
    const c = new BeatClock();
    const rest = computeCardiac('rest').cycleDuration.value; // 0.8 s
    for (let i = 0; i < 16; i++) c.advance(0.1, rest);
    expect(c.beats).toBeCloseTo(2, 9);
  });
  it('runs twice as fast in the running scenario, continuing from the current position', () => {
    const c = new BeatClock();
    for (let i = 0; i < 8; i++) c.advance(0.1, computeCardiac('rest').cycleDuration.value);
    const before = c.beats;
    for (let i = 0; i < 8; i++) c.advance(0.1, computeCardiac('running').cycleDuration.value);
    expect(before).toBeCloseTo(1, 9);
    expect(c.beats - before).toBeCloseTo(2, 9);
  });
  it('clamps long frame gaps', () => {
    const c = new BeatClock();
    c.advance(10, 0.8);
    expect(c.beats).toBeCloseTo(0.25 / 0.8, 9);
  });
});

describe('samplePath', () => {
  it('maps beats to steps on a closed loop', () => {
    expect(samplePath(0, 17)).toEqual({ step: 0, next: 1, t: 0 });
    expect(samplePath(16.999, 17).next).toBe(0);
    expect(samplePath(18, 17).step).toBe(1);
    expect(samplePath(1, 17, 2).step).toBe(16);
  });
  it('eases monotonically from 0 to 1 within a beat', () => {
    expect(easeBeat(0)).toBe(0);
    expect(easeBeat(1)).toBe(1);
    expect(easeBeat(0.5)).toBeGreaterThan(0.5);
  });
});

describe('resolveWaypoints', () => {
  it('places unmodelled steps between their neighbours', () => {
    const pts = resolveWaypoints([{ at: 'a' }, { at: null }, { at: 'c' }], (n) => (n === 'a' ? [0, 0, 0] : [2, 4, 6]));
    expect(pts[1]).toEqual([1, 2, 3]);
  });
});
