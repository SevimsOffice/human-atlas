// Cross-section (clipping) maths, pure and unit-tested. A section keeps one side of an axis-aligned plane:
//  transverse (y): keeps everything below the cut, viewed from above
//  sagittal  (x): keeps the patient's right side (−x), cut face toward the left
//  coronal   (z): keeps the posterior part, so the cut face looks toward the viewer (front view)
export type SectionAxis = 'transverse' | 'sagittal' | 'coronal';
export interface PlaneSpec { normal: [number, number, number]; constant: number }

const AXIS_INDEX: Record<SectionAxis, 0 | 1 | 2> = { sagittal: 0, transverse: 1, coronal: 2 };

/** Plane at fraction t (0–1) of the bounds along the axis. Three.js keeps points with normal·p + constant ≥ 0. */
export function sectionPlane(axis: SectionAxis, t: number, bounds: { min: number[]; max: number[] }): PlaneSpec {
  const k = AXIS_INDEX[axis];
  const pos = bounds.min[k] + Math.min(1, Math.max(0, t)) * (bounds.max[k] - bounds.min[k]);
  const normal: [number, number, number] = [0, 0, 0];
  normal[k] = -1; // keep coordinates ≤ pos
  return { normal, constant: pos };
}

/** True when a point is removed by the plane (used to ignore clipped geometry when picking). */
export function isClipped(p: readonly number[], plane: PlaneSpec): boolean {
  return plane.normal[0] * p[0] + plane.normal[1] * p[1] + plane.normal[2] * p[2] + plane.constant < 0;
}
