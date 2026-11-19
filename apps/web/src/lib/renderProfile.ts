/**
 * Detects software WebGL (no GPU: SwiftShader, llvmpipe, Microsoft Basic Render Driver).
 * There each frame is expensive, so the scene renders without MSAA, at pixel ratio 1, and with
 * frames paced so the page (timers, input, the blood-path clock) stays responsive.
 */
export const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software|basic render/i;

export function isSoftwareRenderer(rendererName: string): boolean {
  return SOFTWARE_RENDERER.test(rendererName);
}

export function detectRendererName(): string {
  try {
    const gl = document.createElement('canvas').getContext('webgl2') ?? document.createElement('canvas').getContext('webgl');
    if (!gl) return '';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return name;
  } catch {
    return '';
  }
}

export const softwareRendering = typeof document !== 'undefined' && isSoftwareRenderer(detectRendererName());

/** Minimum gap between frames in software mode (ms): leaves the main thread time for everything else. */
export const SOFTWARE_FRAME_GAP_MS = 150;
