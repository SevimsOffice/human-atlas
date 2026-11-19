import type { DerivedValue, RefValue } from './types';
import { SCENARIOS, type ScenarioId } from './scenarios';

export interface CardiacState {
  readonly scenario: ScenarioId;
  readonly heartRate: RefValue;
  readonly strokeVolume: RefValue;
  readonly cardiacOutput: DerivedValue;
  readonly cycleDuration: DerivedValue;
}

/** Rounds away binary floating-point noise (e.g. 5.250000000001) without changing meaningful digits. */
const clean = (x: number) => Math.round(x * 1e9) / 1e9;

/** CO [L/min] = HR [beats/min] × SV [mL/beat] / 1000 — OpenStax A&P 2e §19.4. */
export function cardiacOutput(hrBpm: number, svMl: number): number {
  if (!(hrBpm > 0) || !(svMl > 0)) throw new RangeError('HR and SV must be positive');
  return clean((hrBpm * svMl) / 1000);
}

/** Duration of one cardiac cycle [s] = 60 / HR. */
export function cycleDuration(hrBpm: number): number {
  if (!(hrBpm > 0)) throw new RangeError('HR must be positive');
  return clean(60 / hrBpm);
}

/** Pure, deterministic: same scenario in, same state out. */
export function computeCardiac(id: ScenarioId): CardiacState {
  const s = SCENARIOS[id];
  if (!s) throw new RangeError(`unknown scenario: ${String(id)}`);
  return {
    scenario: id,
    heartRate: s.hr,
    strokeVolume: s.sv,
    cardiacOutput: { value: cardiacOutput(s.hr.value, s.sv.value), unit: 'L/min', formula: 'CO=HR*SV' },
    cycleDuration: { value: cycleDuration(s.hr.value), unit: 's', formula: 'T=60/HR' },
  };
}
