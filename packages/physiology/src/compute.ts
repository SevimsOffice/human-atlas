import type { DerivedValue, RefValue } from './types';
import { SCENARIOS, type ScenarioId } from './scenarios';
import { BLOOD_FLOW_TABLE, CARDIAC_REFERENCE_MASS, VO2_REFERENCE_MASS, type OrganId } from './constants';

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
  /** VO2 as cited (College Physics, 76-kg reference body). */
  readonly oxygenUptake: RefValue;
  /** VO2 per kg body mass = VO2 / 76 kg. */
  readonly oxygenUptakePerKg: DerivedValue;
  /** VO2 scaled to the 70-kg body of the cardiac values = VO2/kg × 70 kg. Used for the heart–lung link. */
  readonly oxygenUptake70kg: DerivedValue;
  /** O2 extracted per litre of blood [mL/L] = VO2(70 kg) / CO — Fick principle. Links the lungs to the heart. */
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
  const perKg = (s.vo2.value * 1000) / VO2_REFERENCE_MASS.value; // mL/kg/min
  const vo2At70 = (perKg * CARDIAC_REFERENCE_MASS.value) / 1000; // L/min
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
    oxygenUptakePerKg: { value: Math.round(perKg * 100) / 100, unit: 'mL/kg/min', formula: 'VO2/kg=VO2/m' },
    oxygenUptake70kg: { value: Math.round(vo2At70 * 1000) / 1000, unit: 'L/min', formula: 'VO2@70kg=VO2/kg*70' },
    oxygenExtraction: { value: oxygenExtraction(vo2At70, co), unit: 'mL O2/L', formula: 'avO2=VO2/CO' },
    missing,
  };
}

export interface OrganFlow {
  readonly organ: OrganId;
  /** The cited table value for this scenario's column [mL/min]. */
  readonly tableValue: number;
  readonly share: DerivedValue; // fraction 0–1 of the column total
  readonly flow: DerivedValue; // L/min = engine CO × share
}

export interface FlowDistribution {
  readonly scenario: ScenarioId;
  readonly column: 'rest' | 'mild' | 'maximal';
  readonly ref: 'OSX-20.4';
  readonly cardiacOutput: number;
  readonly organs: readonly OrganFlow[];
}

/**
 * Distribution of the engine's cardiac output over organs, using each organ's share of the cited
 * A&P §20.4 column (the table's own totals differ from the engine CO, so shares are used, not raw mL/min).
 */
export function computeFlowDistribution(id: ScenarioId): FlowDistribution {
  const s = SCENARIOS[id];
  if (!s) throw new RangeError(`unknown scenario: ${String(id)}`);
  const col = s.flowColumn;
  const total = BLOOD_FLOW_TABLE.totals[col];
  const co = computeCardiac(id).cardiacOutput.value;
  return {
    scenario: id, column: col, ref: BLOOD_FLOW_TABLE.ref, cardiacOutput: co,
    organs: BLOOD_FLOW_TABLE.rows.map((r) => {
      const share = r[col] / total;
      return {
        organ: r.organ, tableValue: r[col],
        share: { value: Math.round(share * 1000) / 1000, unit: '', formula: 'share=organ/total' as const },
        flow: { value: Math.round(co * share * 100) / 100, unit: 'L/min', formula: 'flow=CO*share' as const },
      };
    }),
  };
}

export interface ExerciseComparison {
  readonly key: 'heartRate' | 'strokeVolume' | 'cardiacOutput' | 'oxygenUptake70kg' | 'oxygenExtraction' | 'muscleFlow';
  readonly rest: number;
  readonly running: number;
  readonly unit: string;
  readonly ratio: DerivedValue;
}

/** Rest → running across systems: every number comes from the engine; ratios are derived. */
export function compareExercise(): readonly ExerciseComparison[] {
  const [cr, cx] = [computeCardiac('rest'), computeCardiac('running')];
  const [rr, rx] = [computeRespiratory('rest'), computeRespiratory('running')];
  const muscle = (id: ScenarioId) => computeFlowDistribution(id).organs.find((o) => o.organ === 'skeletalMuscle')!.flow.value;
  const row = (key: ExerciseComparison['key'], a: number, b: number, unit: string): ExerciseComparison =>
    ({ key, rest: a, running: b, unit, ratio: { value: Math.round((b / a) * 10) / 10, unit: '×', formula: 'ratio=run/rest' } });
  return [
    row('heartRate', cr.heartRate.value, cx.heartRate.value, 'bpm'),
    row('strokeVolume', cr.strokeVolume.value, cx.strokeVolume.value, 'mL'),
    row('cardiacOutput', cr.cardiacOutput.value, cx.cardiacOutput.value, 'L/min'),
    row('oxygenUptake70kg', rr.oxygenUptake70kg.value, rx.oxygenUptake70kg.value, 'L/min'),
    row('oxygenExtraction', rr.oxygenExtraction.value, rx.oxygenExtraction.value, 'mL O2/L'),
    row('muscleFlow', muscle('rest'), muscle('running'), 'L/min'),
  ];
}
