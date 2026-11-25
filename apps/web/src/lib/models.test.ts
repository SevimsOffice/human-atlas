import { describe, expect, it } from 'vitest';
import { manifest } from '@atlas/anatomy-manifest';
import { MODEL_LAYERS, modelsFor } from './models';

describe('model lazy-loading', () => {
  it('maps every model file to the layers it draws', () => {
    for (const m of manifest.models) expect(MODEL_LAYERS[m.file].length, m.file).toBeGreaterThan(0);
    expect(MODEL_LAYERS['skin.glb']).toEqual(['skin']);
  });
  it('needs only the files of visible layers', () => {
    expect(modelsFor({ urinary: true }).sort()).toEqual(['kidney-left.glb', 'kidney-right.glb', 'ureter-left.glb', 'ureter-right.glb', 'urinary-bladder.glb']);
    expect(modelsFor({ heart: true })).toContain('heart.glb');
    expect(modelsFor({})).toEqual([]);
  });
});
