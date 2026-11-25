// Which GLB files a set of layers needs (pure, unit-tested). Used to lazy-load models whose layers start hidden.
import { manifest, type Layer } from '@atlas/anatomy-manifest';

/** Layers that have at least one mesh in each model file. */
export const MODEL_LAYERS: Record<string, Layer[]> = Object.fromEntries(
  manifest.models.map((m) => [m.file, [...new Set(Object.values(manifest.structures).filter((s) => s.model === m.file && s.isMesh).map((s) => s.layer))]]),
);

/** Files with at least one mesh in a visible layer, in manifest order. */
export function modelsFor(layers: Partial<Record<Layer, boolean>>): string[] {
  return manifest.models.map((m) => m.file).filter((f) => MODEL_LAYERS[f].some((l) => layers[l]));
}
