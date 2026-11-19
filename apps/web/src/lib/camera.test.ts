import { describe, expect, it } from 'vitest';
import { CAMERA_LIMITS, DEFAULT_VIEW, focusView, MODEL_CENTRE } from './camera';

describe('camera', () => {
  it('orbits the heart centre by default, not the floor', () => {
    expect(DEFAULT_VIEW.target).toEqual(MODEL_CENTRE);
    expect(MODEL_CENTRE[1]).toBeGreaterThan(0.4); // the stage is at y = 0.16
  });
  it('limits keep the camera above the stage at every allowed angle and distance', () => {
    const lowest = MODEL_CENTRE[1] + CAMERA_LIMITS.maxDistance * Math.cos(CAMERA_LIMITS.maxPolar);
    expect(lowest).toBeGreaterThan(0.16);
    expect(CAMERA_LIMITS.minPolar).toBeGreaterThan(0);
  });
  it('focuses on a structure centre at a size-based, clamped distance in the current direction', () => {
    const f = focusView('VH_M_heart_left_ventricle', DEFAULT_VIEW.position, DEFAULT_VIEW.target)!;
    expect(f.target).toEqual([0.0427, 0.4643, 0.0415]);
    const d = Math.hypot(...f.position.map((p, i) => p - f.target[i]));
    expect(d).toBeGreaterThanOrEqual(CAMERA_LIMITS.minDistance);
    expect(d).toBeLessThanOrEqual(CAMERA_LIMITS.maxDistance);
    expect(f.position[2]).toBeGreaterThan(f.target[2]); // still viewed from the front
    expect(focusView('nope', DEFAULT_VIEW.position, DEFAULT_VIEW.target)).toBeNull();
  });
});
