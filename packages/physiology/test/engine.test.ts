import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as C from '../src/constants';
import { computeCardiac, cardiacOutput, cycleDuration, SCENARIOS, SCENARIO_ORDER, isScenarioId, REFERENCES, type RefValue } from '../src';

const model = readFileSync(new URL('../../../docs/PHYSIOLOGY_MODEL.md', import.meta.url), 'utf8');
const constants = Object.entries(C) as [string, RefValue][];

describe('reference values (docs/PHYSIOLOGY_MODEL.md, OpenStax A&P 2e §19.4)', () => {
  it.each([
    ['REST_HR', 75, 'bpm'], ['REST_SV', 70, 'mL'], ['REST_CO_BOOK', 5.25, 'L/min'],
    ['EXERCISE_HR', 150, 'bpm'], ['EXERCISE_SV', 130, 'mL'], ['EXERCISE_CO_BOOK', 19.5, 'L/min'],
  ])('%s = %s %s', (name, value, unit) => {
    const c = (C as Record<string, RefValue>)[name];
    expect(c.value).toBe(value);
    expect(c.unit).toBe(unit);
    expect(c.ref).toBe('OSX-19.4');
  });

  it('every constant has a known reference documented in PHYSIOLOGY_MODEL.md and a quote found there', () => {
    for (const [, c] of constants) {
      expect(REFERENCES[c.ref]).toBeDefined();
      expect(model).toContain(`[${c.ref}]`);
      expect(model).toContain(c.quote);
    }
  });

  it('ranges contain their mean value', () => {
    for (const [, c] of constants) if (c.range) expect(c.value).toBeGreaterThanOrEqual(c.range[0]), expect(c.value).toBeLessThanOrEqual(c.range[1]);
  });
});

describe('formulas', () => {
  it('CO = HR × SV reproduces the textbook resting and exercise CO exactly', () => {
    expect(cardiacOutput(C.REST_HR.value, C.REST_SV.value)).toBe(C.REST_CO_BOOK.value);
    expect(cardiacOutput(C.EXERCISE_HR.value, C.EXERCISE_SV.value)).toBe(C.EXERCISE_CO_BOOK.value);
  });
  it('cycle duration = 60 / HR', () => {
    expect(cycleDuration(75)).toBe(0.8);
    expect(cycleDuration(150)).toBe(0.4);
  });
  it('rejects non-physical inputs', () => {
    expect(() => cardiacOutput(0, 70)).toThrow(RangeError);
    expect(() => cardiacOutput(75, -1)).toThrow(RangeError);
    expect(() => cycleDuration(NaN)).toThrow(RangeError);
  });
});

describe('scenarios', () => {
  it('offers only sourced scenarios: rest and running (walking awaits a citation)', () => {
    expect(SCENARIO_ORDER).toEqual(['rest', 'running']);
    expect(isScenarioId('walking')).toBe(false);
    expect(isScenarioId('toString')).toBe(false);
  });
  it('rest → HR 75, SV 70, CO 5.25, cycle 0.8 s', () => {
    const s = computeCardiac('rest');
    expect([s.heartRate.value, s.strokeVolume.value, s.cardiacOutput.value, s.cycleDuration.value]).toEqual([75, 70, 5.25, 0.8]);
    expect(s.cardiacOutput.formula).toBe('CO=HR*SV');
  });
  it('running → HR 150, SV 130, CO 19.5, cycle 0.4 s', () => {
    const s = computeCardiac('running');
    expect([s.heartRate.value, s.strokeVolume.value, s.cardiacOutput.value, s.cycleDuration.value]).toEqual([150, 130, 19.5, 0.4]);
  });
  it('switching scenario changes every derived output (and is deterministic)', () => {
    const a = computeCardiac('rest'), b = computeCardiac('running');
    expect(b.cardiacOutput.value).toBeGreaterThan(a.cardiacOutput.value);
    expect(b.cycleDuration.value).toBeLessThan(a.cycleDuration.value);
    expect(computeCardiac('rest')).toEqual(a);
  });
  it('every scenario input is a cited constant', () => {
    for (const s of Object.values(SCENARIOS)) for (const v of [s.hr, s.sv]) expect(constants.map(([, c]) => c)).toContain(v);
  });
  it('rejects unknown scenarios', () => {
    expect(() => computeCardiac('walking' as never)).toThrow(RangeError);
  });
});
