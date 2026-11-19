import type { RefValue } from './types';
import { REST_HR, REST_SV, EXERCISE_HR, EXERCISE_SV } from './constants';

/** Scenario IDs available in the app. Walking is not listed: no cited source yet (docs/PHYSIOLOGY_MODEL.md, Q3). */
export type ScenarioId = 'rest' | 'running';

export interface ScenarioInputs {
  readonly id: ScenarioId;
  readonly hr: RefValue;
  readonly sv: RefValue;
}

export const SCENARIOS: Readonly<Record<ScenarioId, ScenarioInputs>> = {
  rest: { id: 'rest', hr: REST_HR, sv: REST_SV },
  // "Koşu (yoğun egzersiz) / Running (vigorous exercise)" — OpenStax "exercise" values (owner decision Q7).
  running: { id: 'running', hr: EXERCISE_HR, sv: EXERCISE_SV },
};

export const SCENARIO_ORDER: readonly ScenarioId[] = ['rest', 'running'];

export function isScenarioId(x: unknown): x is ScenarioId {
  return typeof x === 'string' && Object.prototype.hasOwnProperty.call(SCENARIOS, x);
}
