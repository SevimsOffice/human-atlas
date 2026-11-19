import { bloodPath } from '@atlas/anatomy-manifest';
import { computeCardiac } from '@atlas/physiology';
import { useAtlas } from '../store';
import { FlowClock, samplePath } from './flow';

/** The one blood-path clock of the app. Kept in sync with the store (scenario → engine cycle, play/pause). */
const initial = useAtlas.getState();
export const flowClock = new FlowClock(computeCardiac(initial.scenario).cycleDuration.value, performance.now());
flowClock.setRunning(initial.flowOn, performance.now());

useAtlas.subscribe((s, prev) => {
  const now = performance.now();
  if (s.scenario !== prev.scenario) flowClock.setCycle(computeCardiac(s.scenario).cycleDuration.value, now);
  if (s.flowOn !== prev.flowOn) flowClock.setRunning(s.flowOn, now);
});

/** Publishes the current step to the store ~10×/s, independent of the render loop. */
export function startFlowTicker(): () => void {
  const id = setInterval(() => {
    const beats = flowClock.beatsAt(performance.now());
    const step = samplePath(beats, bloodPath.length).step;
    const st = useAtlas.getState();
    if (step !== st.flowStep || Math.floor(beats) !== st.flowBeats) st.setFlowStep(step, Math.floor(beats));
  }, 100);
  return () => clearInterval(id);
}
