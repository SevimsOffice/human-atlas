// Pure camera helpers (unit-tested). Model space is metres, Y up, +Z anterior.
import { manifest } from '@atlas/anatomy-manifest';

export type V3 = [number, number, number];

/** Orbit limits: never under the specimen stage, never flipped over the top, no panning. */
export const CAMERA_LIMITS = {
  minPolar: 0.2, // rad from straight up (~11°)
  maxPolar: Math.PI * 0.58, // ~104°: at most slightly below the horizon, still above the stage
  minDistance: 0.12,
  maxDistance: 0.9,
  damping: 0.1,
} as const;

const heart = manifest.structures.VH_M_heart.center!;
/** The model centre the camera orbits by default: the heart, which the whole scene is built around. */
export const MODEL_CENTRE: V3 = [heart[0], heart[1] + 0.01, heart[2]];
export const DEFAULT_VIEW = { target: MODEL_CENTRE, position: [MODEL_CENTRE[0], MODEL_CENTRE[1] + 0.03, MODEL_CENTRE[2] + 0.6] as V3 };

export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Focus on a structure: its centre becomes the target; distance from its size, keeping the current viewing direction. */
export function focusView(name: string, currentPosition: V3, currentTarget: V3): { target: V3; position: V3 } | null {
  const s = manifest.structures[name];
  if (!s?.center || !s.size) return null;
  const extent = Math.max(...s.size);
  const distance = clamp(extent * 2.8, CAMERA_LIMITS.minDistance, CAMERA_LIMITS.maxDistance);
  const dir = currentPosition.map((p, i) => p - currentTarget[i]) as V3;
  const len = Math.hypot(...dir) || 1;
  return { target: s.center, position: s.center.map((c, i) => c + (dir[i] / len) * distance) as V3 };
}
