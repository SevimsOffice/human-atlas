import { describe, expect, it } from 'vitest';
import { boundsOf, CAMERA_LIMITS, fitView, focusView, FOV_DEG, STAGE_Y } from './camera';

import { ALL_LAYERS as ALL } from './camera';

/** Does the box fit inside the view frustum from this camera (simple pinhole check)? */
function fits(view: { target: number[]; position: number[] }, aspect: number) {
  const b = boundsOf(ALL)!;
  const d = view.position[2] - b.max[2]; // nearest face distance
  const vHalf = (FOV_DEG * Math.PI) / 360;
  const visH = Math.tan(vHalf) * d, visW = visH * aspect;
  return (b.max[1] - b.min[1]) / 2 <= visH * 1.01 && (b.max[0] - b.min[0]) / 2 <= visW * 1.01;
}

describe('camera', () => {
  it('fits every visible model (incl. trachea top) with a margin, for wide and narrow screens', () => {
    for (const aspect of [1920 / 900, 1440 / 760, 1.0, 0.6]) {
      const v = fitView(ALL, aspect);
      expect(fits(v, aspect), `aspect ${aspect}`).toBe(true);
    }
  });
  it('targets the centre of the visible models, not the floor', () => {
    const v = fitView(ALL, 1.6), b = boundsOf(ALL)!;
    expect(v.target[1]).toBeCloseTo((b.min[1] + b.max[1]) / 2, 6);
    expect(v.target[1]).toBeGreaterThan(STAGE_Y + 0.1);
  });
  it('re-frames to the visible layers only', () => {
    const heartOnly = fitView({ heart: true }, 1.6), all = fitView(ALL, 1.6);
    const dist = (v: typeof all) => Math.hypot(...v.position.map((p, k) => p - v.target[k]));
    expect(dist(heartOnly)).toBeLessThan(dist(all));
  });
  it('limits keep the camera above the stage at every allowed angle and distance', () => {
    const lowest = fitView(ALL, 1.6).target[1] + CAMERA_LIMITS.maxDistance * Math.cos(CAMERA_LIMITS.maxPolar);
    expect(lowest).toBeGreaterThan(STAGE_Y);
  });
  it('focuses on a structure centre at a clamped distance in the current direction', () => {
    const v = fitView(ALL, 1.6);
    const f = focusView('VH_M_heart_left_ventricle', v.position, v.target)!;
    expect(f.target).toEqual([0.0427, 0.4643, 0.0415]);
    const d = Math.hypot(...f.position.map((p, i) => p - f.target[i]));
    expect(d).toBeGreaterThanOrEqual(CAMERA_LIMITS.minDistance);
    expect(focusView('nope', v.position, v.target)).toBeNull();
  });
});
