// Pure camera helpers (unit-tested). Model space is metres, Y up, +Z anterior.
import { manifest, type Layer } from '@atlas/anatomy-manifest';

export type V3 = [number, number, number];

export const FOV_DEG = 35;

/** Orbit limits: never under the specimen stage, never flipped over the top, no panning. */
export const CAMERA_LIMITS = {
  minPolar: 0.2, // rad from straight up (~11°)
  maxPolar: Math.PI * 0.54, // ~97°: at most slightly below the horizon, still above the stage
  minDistance: 0.12,
  maxDistance: 3.5, // the whole model incl. legs (≈1.6 m tall) must fit
  damping: 0.1,
} as const;

export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Axis-aligned box of every mesh in the given layers (from manifest geometry facts). */
export function boundsOf(layers: Partial<Record<Layer, boolean>>): { min: V3; max: V3 } | null {
  const min: V3 = [Infinity, Infinity, Infinity], max: V3 = [-Infinity, -Infinity, -Infinity];
  let any = false;
  for (const s of Object.values(manifest.structures)) {
    if (!s.isMesh || !s.center || !s.size || !layers[s.layer]) continue;
    any = true;
    for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], s.center[k] - s.size[k] / 2); max[k] = Math.max(max[k], s.center[k] + s.size[k] / 2); }
  }
  return any ? { min, max } : null;
}

/**
 * Camera that frames the box with a margin, looking from the front and slightly above.
 * Fits both the vertical and the horizontal field of view (aspect = width / height).
 */
export function fitView(layers: Partial<Record<Layer, boolean>>, aspect: number, margin = 1.12): { target: V3; position: V3 } {
  const b = boundsOf(layers) ?? boundsOf({ heart: true })!;
  const target = b.min.map((v, k) => (v + b.max[k]) / 2) as V3;
  const half = b.min.map((v, k) => (b.max[k] - v) / 2);
  const vHalf = (FOV_DEG * Math.PI) / 360;
  const hHalf = Math.atan(Math.tan(vHalf) * aspect);
  const d = Math.max(half[1] / Math.tan(vHalf), half[0] / Math.tan(hHalf)) * margin + half[2];
  const distance = clamp(d, CAMERA_LIMITS.minDistance, CAMERA_LIMITS.maxDistance);
  const dir = [0, 0.08, 1], n = Math.hypot(...dir);
  return { target, position: target.map((t, k) => t + (dir[k] / n) * distance) as V3 };
}

export const ALL_LAYERS: Record<Layer, boolean> = { heart: true, greatVessels: true, coronaryVessels: true, lungs: true, airways: true, urinary: true, digestive: true, lymphatic: true, nervous: true, skeletal: true };
const ALL = ALL_LAYERS;
/** Specimen stage (floor) just below the lowest structure of every model, so nothing sinks into it. */
export const STAGE_Y = boundsOf(ALL_LAYERS)!.min[1] - 0.02;
/** Initial view before the canvas size is known (16:10), with the default layers (skeleton hidden). */
export const DEFAULT_VIEW = fitView({ ...ALL, skeletal: false }, 1.6);
export const MODEL_CENTRE = DEFAULT_VIEW.target;

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
