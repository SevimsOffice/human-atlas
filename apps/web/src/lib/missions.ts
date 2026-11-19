// Missions (M5): guided step sequences. Text comes from content/missions.json; every number is filled in
// here from the physiology engine (placeholders like {hr}), never typed into the content.
import missionsJson from '../../../../content/missions.json';
import { compareExercise, computeCardiac, computeFlowDistribution, computeRespiratory, type ScenarioId } from '@atlas/physiology';
import type { Layer } from '@atlas/anatomy-manifest';

type L10n = { tr: string; en: string };
export interface MissionStep { id: string; focus: string; scenario?: ScenarioId; layers?: Partial<Record<Layer, boolean>>; text: L10n; cites: string[]; status: string }
export interface Mission {
  id: string; title: L10n; steps: MissionStep[];
  question: { prompt: L10n; options: L10n[]; correct: number; explanation: L10n; cites: string[] };
}
export const MISSIONS = (missionsJson as unknown as { missions: Mission[] }).missions;

/** The scenario in force at a step: the latest one set at or before it (default rest). */
export function scenarioAt(m: Mission, step: number): ScenarioId {
  for (let i = Math.min(step, m.steps.length - 1); i >= 0; i--) { const s = m.steps[i].scenario; if (s) return s; }
  return 'rest';
}

const fmt = (v: number, lang: 'tr' | 'en', d = 2) => v.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB', { maximumFractionDigits: d });

/** All values a mission text may use, computed by the engine for the given scenario. */
export function missionValues(scenario: ScenarioId, lang: 'tr' | 'en'): Record<string, string> {
  const c = computeCardiac(scenario), r = computeRespiratory(scenario), f = computeFlowDistribution(scenario);
  const fr = computeFlowDistribution('rest');
  const organ = (d: typeof f, id: string) => d.organs.find((o) => o.organ === id)!;
  const cmp = Object.fromEntries(compareExercise().map((x) => [x.key, x.ratio.value]));
  return {
    hr: fmt(c.heartRate.value, lang), sv: fmt(c.strokeVolume.value, lang), co: fmt(c.cardiacOutput.value, lang),
    rr: r.breathingRate ? fmt(r.breathingRate.value, lang) : '—', vt: r.tidalVolume ? fmt(r.tidalVolume.value, lang) : '—',
    ve: r.minuteVentilation ? fmt(r.minuteVentilation.value, lang) : '—',
    vo2: fmt(r.oxygenUptake70kg.value, lang), extraction: fmt(r.oxygenExtraction.value, lang, 1),
    extractionRest: fmt(computeRespiratory('rest').oxygenExtraction.value, lang, 1),
    muscleShare: fmt(organ(f, 'skeletalMuscle').share.value * 100, lang, 0), muscleFlow: fmt(organ(f, 'skeletalMuscle').flow.value, lang),
    kidneyFlow: fmt(organ(f, 'kidney').flow.value, lang), kidneyFlowRest: fmt(organ(fr, 'kidney').flow.value, lang),
    coRatio: fmt(cmp.cardiacOutput, lang, 1), muscleRatio: fmt(cmp.muscleFlow, lang, 1),
  };
}

/** Replaces {placeholders}; throws on an unknown one so content can never show a made-up number. */
export function fillText(text: string, values: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => {
    if (!(k in values)) throw new Error(`unknown mission placeholder {${k}}`);
    return values[k];
  });
}
