// How a structure is drawn (pure, unit-tested): opacity, depth writing and draw order.
import type { Layer } from '@atlas/anatomy-manifest';

/** The skin outline: very faint (owner spec 8–12 %), never writes depth, drawn last → cannot hide what is inside. */
export const SKIN_OPACITY = 0.1;
/** Everything that is not the selection while "isolate" is on. */
export const DIMMED_OPACITY = 0.1;

export interface AppearanceInput {
  layer: Layer;
  /** this structure is (part of) the selection */
  isSelected: boolean;
  /** something is selected */
  hasSelection: boolean;
  /** dim everything except the selection */
  isolate: boolean;
  /** blood-path animation running */
  flowOn: boolean;
}
export interface Appearance { opacity: number; depthWrite: boolean; renderOrder: number }

export function appearanceFor({ layer, isSelected, hasSelection, isolate, flowOn }: AppearanceInput): Appearance {
  if (layer === 'skin') return { opacity: isSelected ? 0.2 : SKIN_OPACITY, depthWrite: false, renderOrder: 10 };
  // isolate: the selection stays solid, everything else becomes a faint ghost
  if (hasSelection && isolate && !isSelected) return { opacity: DIMMED_OPACITY, depthWrite: false, renderOrder: 6 };
  // blood path: the heart, its vessels and the lungs turn see-through so the moving cells stay visible
  if (flowOn && !isSelected) {
    if (layer === 'heart') return { opacity: 0.25, depthWrite: false, renderOrder: 1 };
    if (layer === 'greatVessels' || layer === 'coronaryVessels') return { opacity: 0.55, depthWrite: false, renderOrder: 0 };
    if (layer === 'lungs') return { opacity: 0.15, depthWrite: false, renderOrder: 4 };
    if (layer === 'airways') return { opacity: 0.5, depthWrite: false, renderOrder: 0 };
  }
  // default: every organ and bone opaque
  return { opacity: 1, depthWrite: true, renderOrder: 0 };
}
