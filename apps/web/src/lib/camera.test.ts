import { describe, expect, it } from 'vitest';
import { BODY_BOUNDS, boundsOf, CAMERA_LIMITS, clampTarget, fitView, focusView, FOV_DEG, STAGE_Y, targetView } from './camera';

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
  it('allows real close-ups: minimum distance a few cm, near plane well inside it', () => {
    expect(CAMERA_LIMITS.minDistance).toBeLessThanOrEqual(0.05);
    expect(CAMERA_LIMITS.near).toBeLessThan(CAMERA_LIMITS.minDistance / 5);
    expect(CAMERA_LIMITS.far).toBeGreaterThan(CAMERA_LIMITS.maxDistance * 2);
    // a small structure is focused closer than the old 12 cm limit
    const v = fitView(ALL, 1.6);
    const f = focusView('VH_M_aortic_valve', v.position, v.target)!;
    expect(Math.hypot(...f.position.map((p, i) => p - f.target[i]))).toBeLessThan(0.12);
  });
  it('click: the structure centre becomes the orbit target and the camera keeps its offset', () => {
    const v = fitView(ALL, 1.6);
    const t = targetView('VH_M_left_kidney', v.position, v.target)!;
    expect(t.target).toEqual(focusView('VH_M_left_kidney', v.position, v.target)!.target);
    const off = (x: { position: number[]; target: number[] }) => x.position.map((p, i) => p - x.target[i]);
    off(t).forEach((d, i) => expect(d).toBeCloseTo(off(v)[i], 9));
    expect(targetView('nope', v.position, v.target)).toBeNull();
  });
  it('panning is clamped: the orbit target cannot leave the body box (+ margin)', () => {
    const m = CAMERA_LIMITS.panMargin;
    expect(clampTarget([0, 0, 0])).toEqual([0, 0, 0]);
    const far = clampTarget([50, -50, 50]);
    expect(far[0]).toBeCloseTo(BODY_BOUNDS.max[0] + m, 9);
    expect(far[1]).toBeCloseTo(BODY_BOUNDS.min[1] - m, 9);
    expect(far[2]).toBeCloseTo(BODY_BOUNDS.max[2] + m, 9);
    // the box is the whole body: about 1.8 m tall
    expect(BODY_BOUNDS.max[1] - BODY_BOUNDS.min[1]).toBeGreaterThan(1.7);
  });
});
