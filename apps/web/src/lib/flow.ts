// Pure helpers for the schematic blood-path animation. No React, no three.js — unit-tested.
// Timing rule (docs/PHYSIOLOGY_MODEL.md "Animation coupling"): one path step per heartbeat,
// where the beat duration comes from the physiology engine.

export type Vec3 = readonly [number, number, number];

/**
 * Counts heartbeats from wall-clock time (not from rendered frames), so the animation speed is
 * correct even when rendering is slow. Changing the cycle duration or pausing re-anchors the
 * count, so the position never jumps.
 */
export class FlowClock {
  private anchorBeats = 0;
  private anchorMs = 0;
  private running = false;
  constructor(private cycleSeconds: number, nowMs: number) {
    if (!(cycleSeconds > 0)) throw new RangeError('cycle must be positive');
    this.anchorMs = nowMs;
  }
  beatsAt(nowMs: number): number {
    return this.running ? this.anchorBeats + Math.max(0, nowMs - this.anchorMs) / 1000 / this.cycleSeconds : this.anchorBeats;
  }
  private reanchor(nowMs: number) { this.anchorBeats = this.beatsAt(nowMs); this.anchorMs = nowMs; }
  setCycle(cycleSeconds: number, nowMs: number) {
    if (!(cycleSeconds > 0)) throw new RangeError('cycle must be positive');
    this.reanchor(nowMs); this.cycleSeconds = cycleSeconds;
  }
  setRunning(running: boolean, nowMs: number) { this.reanchor(nowMs); this.running = running; }
}

/** Ejection-like easing: most of the movement happens early in each beat. */
export function easeBeat(phase: number): number {
  const p = Math.min(Math.max(phase, 0), 1);
  return 1 - Math.pow(1 - p, 3);
}

export interface PathSample { step: number; next: number; t: number }

/** Where a particle that is `offsetBeats` behind the head is, on a closed path of `stepCount` steps. */
export function samplePath(beats: number, stepCount: number, offsetBeats = 0): PathSample {
  if (stepCount < 2) throw new RangeError('need at least two steps');
  const b = beats - offsetBeats;
  const whole = Math.floor(b);
  const step = ((whole % stepCount) + stepCount) % stepCount;
  return { step, next: (step + 1) % stepCount, t: easeBeat(b - whole) };
}

export const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Waypoints for each step: modelled steps use their structure's centre; unmodelled ones the midpoint of their neighbours. */
export function resolveWaypoints(steps: readonly { at: string | null }[], centerOf: (name: string) => Vec3 | null): Vec3[] {
  const raw = steps.map((s) => (s.at ? centerOf(s.at) : null));
  return raw.map((p, i) => {
    if (p) return p;
    const n = steps.length;
    const prev = raw[(i - 1 + n) % n], next = raw[(i + 1) % n];
    if (!prev || !next) throw new Error(`step ${i} has no modelled neighbours`);
    return lerp3(prev, next, 0.5);
  });
}
