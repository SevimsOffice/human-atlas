import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { manifest } from '@atlas/anatomy-manifest';
import { REFERENCES } from '@atlas/physiology';
import { fillText, MISSIONS, missionValues, scenarioAt } from './missions';

const sources = readFileSync(new URL('../../../../docs/SOURCES.md', import.meta.url), 'utf8') + readFileSync(new URL('../../../../docs/PHYSIOLOGY_MODEL.md', import.meta.url), 'utf8');

describe('missions content', () => {
  it('has the two required missions with 4–6 steps each', () => {
    expect(MISSIONS.map((m) => m.id)).toEqual(['rbc-lungs-to-leg', 'start-running']);
    for (const m of MISSIONS) { expect(m.steps.length).toBeGreaterThanOrEqual(4); expect(m.steps.length).toBeLessThanOrEqual(6); }
  });
  it('every step focuses a real structure, is bilingual, cites a documented reference and is marked for review', () => {
    for (const m of MISSIONS) for (const s of m.steps) {
      expect(manifest.structures[s.focus], s.focus).toBeDefined();
      expect(s.text.tr && s.text.en).toBeTruthy();
      expect(s.status).toBe('unreviewed');
      for (const c of s.cites) expect(sources.includes(c) || c in REFERENCES, c).toBe(true);
    }
  });
  it('every placeholder resolves to an engine value in both languages and every scenario', () => {
    for (const m of MISSIONS) m.steps.forEach((s, i) => {
      for (const lang of ['tr', 'en'] as const) {
        const out = fillText(s.text[lang], missionValues(scenarioAt(m, i), lang));
        expect(out).not.toMatch(/[{}]/);
      }
    });
    for (const m of MISSIONS) for (const lang of ['tr', 'en'] as const) expect(() => fillText(m.question.explanation[lang], missionValues('running', lang))).not.toThrow();
  });
  it('unknown placeholders are rejected instead of shown', () => {
    expect(() => fillText('HR {madeUp}', missionValues('rest', 'en'))).toThrow(/unknown mission placeholder/);
  });
  it('questions have one valid correct option', () => {
    for (const m of MISSIONS) { expect(m.question.options.length).toBeGreaterThanOrEqual(3); expect(m.question.options[m.question.correct]).toBeDefined(); }
  });
});

describe('mission values come from the engine', () => {
  it('rest and running numbers match the engine', () => {
    expect(missionValues('rest', 'en')).toMatchObject({ hr: '75', sv: '70', co: '5.25' });
    expect(missionValues('running', 'en')).toMatchObject({ hr: '150', co: '19.5', rr: '39.9', vt: '1,500', ve: '55.2', muscleFlow: '13.93', muscleRatio: '12.8' });
    expect(missionValues('running', 'tr').co).toBe('19,5');
  });
  it('the running mission switches scenario at step 2 and keeps it after', () => {
    const m = MISSIONS[1];
    expect([0, 1, 2, 3, 4].map((i) => scenarioAt(m, i))).toEqual(['rest', 'running', 'running', 'running', 'running']);
  });
});
