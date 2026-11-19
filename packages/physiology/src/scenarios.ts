import type { RefValue } from './types';
import { REST_HR, REST_SV, EXERCISE_HR, EXERCISE_SV, REST_RR, REST_VT, REST_VO2, RUNNING_VO2, RUNNING_RR, RUNNING_VT, RUNNING_VE } from './constants';

/** Scenario IDs available in the app. Walking is not listed: no cited source yet (docs/PHYSIOLOGY_MODEL.md, Q3). */
export type ScenarioId = 'rest' | 'running';

export interface ScenarioInputs {
  readonly id: ScenarioId;
  readonly hr: RefValue;
  readonly sv: RefValue;
  /** Breathing rate and tidal volume; null where no verified source exists yet (shown as "source pending"). */
  readonly rr: RefValue | null;
  readonly vt: RefValue | null;
  readonly vo2: RefValue;
  /** Minute ventilation measured directly in the source (used instead of RR × VT of group means when present). */
  readonly ve?: RefValue;
  /** Which column of the A&P §20.4 blood-flow table describes this scenario's distribution. */
  readonly flowColumn: 'rest' | 'mild' | 'maximal';
}

export const SCENARIOS: Readonly<Record<ScenarioId, ScenarioInputs>> = {
  rest: { id: 'rest', hr: REST_HR, sv: REST_SV, rr: REST_RR, vt: REST_VT, vo2: REST_VO2, flowColumn: 'rest' },
  // "Koşu (yoğun egzersiz) / Running (vigorous exercise)" — OpenStax "exercise" values (owner decision Q7).
  // Breathing during running: Lee et al. 2025, 9 km/h oronasal (docs/PHYSIOLOGY_MODEL.md).
  running: { id: 'running', hr: EXERCISE_HR, sv: EXERCISE_SV, rr: RUNNING_RR, vt: RUNNING_VT, ve: RUNNING_VE, vo2: RUNNING_VO2, flowColumn: 'maximal' }, // closest column: vigorous exercise (documented)
};

export const SCENARIO_ORDER: readonly ScenarioId[] = ['rest', 'running'];

export function isScenarioId(x: unknown): x is ScenarioId {
  return typeof x === 'string' && Object.prototype.hasOwnProperty.call(SCENARIOS, x);
}
