import type { RefValue } from './types';
import { REST_HR, REST_SV, EXERCISE_HR, EXERCISE_SV, REST_RR, REST_VT, REST_VO2, RUNNING_VO2 } from './constants';

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
}

export const SCENARIOS: Readonly<Record<ScenarioId, ScenarioInputs>> = {
  rest: { id: 'rest', hr: REST_HR, sv: REST_SV, rr: REST_RR, vt: REST_VT, vo2: REST_VO2 },
  // "Koşu (yoğun egzersiz) / Running (vigorous exercise)" — OpenStax "exercise" values (owner decision Q7).
  // Breathing rate / tidal volume during running: no verifiable source yet (docs/PHYSIOLOGY_MODEL.md, M2 search log).
  running: { id: 'running', hr: EXERCISE_HR, sv: EXERCISE_SV, rr: null, vt: null, vo2: RUNNING_VO2 },
};

export const SCENARIO_ORDER: readonly ScenarioId[] = ['rest', 'running'];

export function isScenarioId(x: unknown): x is ScenarioId {
  return typeof x === 'string' && Object.prototype.hasOwnProperty.call(SCENARIOS, x);
}
