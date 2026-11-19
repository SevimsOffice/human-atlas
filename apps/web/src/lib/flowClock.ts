import { bloodPath } from '@atlas/anatomy-manifest';
import { computeCardiac, computeRespiratory } from '@atlas/physiology';
import { useAtlas } from '../store';
import { FlowClock, samplePath } from './flow';

/** The one blood-path clock of the app. Kept in sync with the store (scenario → engine cycle, play/pause). */
const initial = useAtlas.getState();
export const flowClock = new FlowClock(computeCardiac(initial.scenario).cycleDuration.value, performance.now());
flowClock.setRunning(initial.flowOn, performance.now());

/**
 * Breathing clock: one cycle per breath, from the engine's breath cycle (60/RR). When the engine has no
 * sourced breathing rate for a scenario (running, for now), the clock stops: no breathing at an invented rate.
 */
const breathCycleOf = (scenario: typeof initial.scenario) => computeRespiratory(scenario).breathCycle?.value ?? null;
export const breathClock = new FlowClock(breathCycleOf(initial.scenario) ?? 1, performance.now());
breathClock.setRunning(breathCycleOf(initial.scenario) !== null, performance.now());

useAtlas.subscribe((s, prev) => {
  const now = performance.now();
  if (s.scenario !== prev.scenario) {
    flowClock.setCycle(computeCardiac(s.scenario).cycleDuration.value, now);
    const b = breathCycleOf(s.scenario);
    if (b !== null) breathClock.setCycle(b, now);
    breathClock.setRunning(b !== null, now);
  }
  if (s.flowOn !== prev.flowOn) flowClock.setRunning(s.flowOn, now);
});

/** Publishes the current step to the store ~10×/s, independent of the render loop. */
export function startFlowTicker(): () => void {
  const id = setInterval(() => {
    const beats = flowClock.beatsAt(performance.now());
    const step = samplePath(beats, bloodPath.length).step;
    const st = useAtlas.getState();
    if (step !== st.flowStep || Math.floor(beats) !== st.flowBeats) st.setFlowStep(step, Math.floor(beats));
    const breaths = Math.floor(breathClock.beatsAt(performance.now()));
    if (breaths !== st.breaths) st.setBreaths(breaths);
  }, 100);
  return () => clearInterval(id);
}
