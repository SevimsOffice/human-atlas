import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { REFERENCES } from '@atlas/physiology';
import { fillText, MISSIONS, missionValues, scenarioAt } from '../lib/missions';
import { useAtlas } from '../store';
import { Badge, Panel } from './Panel';

type Lang = 'tr' | 'en';
const citeLabel = (c: string) => (c.startsWith('OSX-') ? `OpenStax A&P 2e §${c.slice(4)}` : c in REFERENCES ? c : c);

/** Left-panel list of missions. */
export function MissionList() {
  const { t, i18n } = useTranslation();
  const { mission, startMission } = useAtlas();
  return (
    <Panel title={t('missions.title')} id="missions-h">
      <ul className="space-y-1">
        {MISSIONS.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-2">
            <span className="text-[13px] leading-tight">{m.title[i18n.language as Lang]}</span>
            <button onClick={() => startMission(m.id)} data-testid={`mission-start-${m.id}`} disabled={mission?.id === m.id}
              className="shrink-0 rounded-sm border border-line bg-white px-2 py-0.5 text-[11px] hover:bg-paper disabled:opacity-50">{t('missions.start')}</button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** Applies the current step to the app: scenario, layers, selection and camera focus. */
export function MissionRunner() {
  const mission = useAtlas((s) => s.mission);
  useEffect(() => {
    if (!mission) return;
    const m = MISSIONS.find((x) => x.id === mission.id);
    const step = m?.steps[mission.step];
    if (!m || !step) return;
    const st = useAtlas.getState();
    st.setScenario(scenarioAt(m, mission.step));
    if (step.layers) useAtlas.setState({ layers: { ...st.layers, ...step.layers } });
    st.select(step.focus);
    st.requestCamera({ kind: 'focus', name: step.focus });
  }, [mission?.id, mission?.step]);
  return null;
}

/** Step card shown over the 3D view while a mission runs. */
export function MissionCard() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as Lang;
  const { mission, missionStep, answerMission, exitMission } = useAtlas();
  if (!mission) return null;
  const m = MISSIONS.find((x) => x.id === mission.id)!;
  const total = m.steps.length;
  const atQuestion = mission.step >= total;
  const scenario = scenarioAt(m, Math.min(mission.step, total - 1));
  const values = missionValues(scenario, lang);
  const step = m.steps[Math.min(mission.step, total - 1)];
  return (
    <section className="pointer-events-auto absolute bottom-12 left-1/2 w-[min(440px,calc(100%-1.5rem))] -translate-x-1/2 rounded-sm border border-line bg-white/95 p-3 shadow-sm"
      data-testid="mission-card" data-step={mission.step} aria-live="polite">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-[0.1em] text-graphite-soft">{t('missions.title')} · <span className="font-mono">{atQuestion ? t('missions.question') : `${mission.step + 1}/${total}`}</span></div>
          <h2 className="text-[14px] font-semibold leading-tight">{m.title[lang]}</h2>
        </div>
        <button onClick={exitMission} aria-label={t('missions.exit')} data-testid="mission-exit" className="rounded-sm border border-line px-2 text-[12px] hover:bg-paper">×</button>
      </div>
      {!atQuestion ? (
        <>
          <p className="mt-2 max-w-[680px] text-[13px] leading-snug" data-testid="mission-text">{fillText(step.text[lang], values)}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <Badge tone="warn">{t('inspector.textStatus.unreviewed')}</Badge>
            {step.cites.map((c) => <Badge key={c}>{citeLabel(c)}</Badge>)}
          </div>
        </>
      ) : (
        <div className="mt-2" data-testid="mission-question">
          <p className="text-[13px] font-medium">{m.question.prompt[lang]}</p>
          <ul className="mt-1.5 grid grid-cols-2 gap-1">
            {m.question.options.map((o, i) => {
              const chosen = mission.answer === i, correct = i === m.question.correct, done = mission.answer !== null;
              return (
                <li key={i}><button onClick={() => answerMission(i)} disabled={done} data-testid={`mission-option-${i}`}
                  className={`w-full rounded-sm border px-2 py-1 text-left text-[12px] ${done && correct ? 'border-emerald-700 bg-emerald-50' : chosen ? 'border-amber-700 bg-amber-50' : 'border-line bg-white hover:bg-paper'}`}>{o[lang]}</button></li>
              );
            })}
          </ul>
          {mission.answer !== null && (
            <p className="mt-2 text-[12px] leading-snug" data-testid="mission-feedback">
              <strong>{mission.answer === m.question.correct ? t('missions.correct') : t('missions.incorrect')}</strong>{' '}
              {fillText(m.question.explanation[lang], missionValues('running', lang))}
              <span className="ml-1 text-graphite-soft">({m.question.cites.map(citeLabel).join(', ')})</span>
            </p>
          )}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <button onClick={() => missionStep(-1)} disabled={mission.step === 0} data-testid="mission-back" className="rounded-sm border border-line px-2 py-0.5 text-[12px] hover:bg-paper disabled:opacity-40">← {t('missions.back')}</button>
        <ol className="flex gap-1" aria-hidden>{[...m.steps, null].map((_, i) => <li key={i} className={`h-1.5 w-4 rounded-[1px] ${i === mission.step ? 'bg-graphite' : 'bg-line'}`} />)}</ol>
        {atQuestion
          ? <button onClick={exitMission} data-testid="mission-finish" className="rounded-sm bg-graphite px-2 py-0.5 text-[12px] text-white">{t('missions.finish')}</button>
          : <button onClick={() => missionStep(1)} data-testid="mission-next" className="rounded-sm bg-graphite px-2 py-0.5 text-[12px] text-white">{mission.step === total - 1 ? t('missions.toQuestion') : t('missions.next')} →</button>}
      </div>
    </section>
  );
}
