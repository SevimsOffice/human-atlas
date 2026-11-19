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

export interface RespiratoryState {
  readonly scenario: ScenarioId;
  readonly breathingRate: RefValue | null;
  readonly tidalVolume: RefValue | null;
  /** VE [L/min] = RR × VT / 1000; null when either input is missing. */
  readonly minuteVentilation: DerivedValue | null;
  readonly breathCycle: DerivedValue | null;
  readonly oxygenUptake: RefValue;
  /** O2 extracted per litre of blood [mL/L] = VO2 / CO (mass balance). Links the lungs to the heart. */
  readonly oxygenExtraction: DerivedValue;
  readonly missing: readonly ('breathingRate' | 'tidalVolume')[];
}

export function minuteVentilation(rrPerMin: number, vtMl: number): number {
  if (!(rrPerMin > 0) || !(vtMl > 0)) throw new RangeError('RR and VT must be positive');
  return clean((rrPerMin * vtMl) / 1000);
}

/** mL O2 per L blood = VO2 [L/min] / CO [L/min] × 1000. */
export function oxygenExtraction(vo2LMin: number, coLMin: number): number {
  if (!(vo2LMin > 0) || !(coLMin > 0)) throw new RangeError('VO2 and CO must be positive');
  return Math.round((vo2LMin / coLMin) * 1000 * 10) / 10;
}

export function computeRespiratory(id: ScenarioId): RespiratoryState {
  const s = SCENARIOS[id];
  if (!s) throw new RangeError(`unknown scenario: ${String(id)}`);
  const co = computeCardiac(id).cardiacOutput.value;
  const missing: ('breathingRate' | 'tidalVolume')[] = [];
  if (!s.rr) missing.push('breathingRate');
  if (!s.vt) missing.push('tidalVolume');
  return {
    scenario: id,
    breathingRate: s.rr,
    tidalVolume: s.vt,
    minuteVentilation: s.rr && s.vt ? { value: minuteVentilation(s.rr.value, s.vt.value), unit: 'L/min', formula: 'VE=RR*VT' } : null,
    breathCycle: s.rr ? { value: Math.round((60 / s.rr.value) * 100) / 100, unit: 's', formula: 'Tb=60/RR' } : null,
    oxygenUptake: s.vo2,
    oxygenExtraction: { value: oxygenExtraction(s.vo2.value, co), unit: 'mL O2/L', formula: 'avO2=VO2/CO' },
    missing,
  };
}
