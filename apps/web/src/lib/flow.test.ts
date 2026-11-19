import { describe, expect, it } from 'vitest';
import { FlowClock, easeBeat, samplePath, resolveWaypoints } from './flow';
import { computeCardiac } from '@atlas/physiology';

describe('FlowClock', () => {
  const rest = computeCardiac('rest').cycleDuration.value; // 0.8 s
  const run = computeCardiac('running').cycleDuration.value; // 0.4 s
  it('counts one beat per cycle duration from the engine, from wall-clock time', () => {
    const c = new FlowClock(rest, 0);
    c.setRunning(true, 0);
    expect(c.beatsAt(1600)).toBeCloseTo(2, 9);
  });
  it('runs twice as fast in the running scenario, continuing from the current position', () => {
    const c = new FlowClock(rest, 0);
    c.setRunning(true, 0);
    c.setCycle(run, 800); // 1 beat at rest
    expect(c.beatsAt(800)).toBeCloseTo(1, 9);
    expect(c.beatsAt(1600)).toBeCloseTo(3, 9); // +2 beats in 0.8 s
  });
  it('stands still while paused and resumes without a jump', () => {
    const c = new FlowClock(rest, 0);
    c.setRunning(true, 0);
    c.setRunning(false, 400);
    expect(c.beatsAt(5000)).toBeCloseTo(0.5, 9);
    c.setRunning(true, 5000);
    expect(c.beatsAt(5400)).toBeCloseTo(1, 9);
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
