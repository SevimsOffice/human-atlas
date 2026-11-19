import { useTranslation } from 'react-i18next';
import { computeCardiac, REFERENCES, SCENARIO_ORDER, type DerivedValue, type RefValue } from '@atlas/physiology';
import { useAtlas } from '../store';
import { Panel } from './Panel';

const fmt = (v: number, lang: string, digits = 2) =>
  v.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB', { maximumFractionDigits: digits });

function Row({ label, v, testId, lang }: { label: string; v: RefValue | DerivedValue; testId: string; lang: string }) {
  const { t } = useTranslation();
  const isRef = 'ref' in v;
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="shrink-0 text-sm">{label}</dt>
      <dd className="text-right">
        <span data-testid={testId} className="font-mono text-base tabular-nums">{fmt(v.value, lang)}</span>
        <span className="ml-1 font-mono text-xs text-graphite-soft">{v.unit}</span>
        <div className="font-mono text-[10px] text-graphite-soft">
          {isRef ? (
            <a href={REFERENCES[v.ref].url} target="_blank" rel="noreferrer" title={v.quote} className="underline decoration-line underline-offset-2">
              {t('measure.ref')}: {v.ref}
              {v.range ? ` · ${t('measure.range')} ${fmt(v.range[0], lang)}–${fmt(v.range[1], lang)}` : ''}
            </a>
          ) : (
            <>{t('measure.derived')}: {v.formula.replace('*', ' × ')}</>
          )}
        </div>
      </dd>
    </div>
  );
}

export function ScenarioPanel() {
  const { t, i18n } = useTranslation();
  const scenario = useAtlas((s) => s.scenario);
  const setScenario = useAtlas((s) => s.setScenario);
  const st = computeCardiac(scenario);
  const lang = i18n.language;
  return (
    <>
      <Panel title={t('scenario.title')} id="scenario-h">
        <div role="radiogroup" aria-labelledby="scenario-h" className="grid grid-cols-2 gap-1 rounded-sm border border-line bg-white p-1">
          {SCENARIO_ORDER.map((id) => (
            <button key={id} role="radio" aria-checked={scenario === id} onClick={() => setScenario(id)}
              className={`rounded-sm px-2 py-1.5 text-sm transition-colors ${scenario === id ? 'bg-graphite text-white' : 'hover:bg-paper'}`}>
              {t(`scenario.${id}`)}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-graphite-soft">{t('scenario.walkingNote')}</p>
      </Panel>
      <Panel title={t('measure.title')} id="measure-h">
        <dl className="divide-y divide-line" data-testid="measurements">
          <Row label={t('measure.hr')} v={st.heartRate} testId="hr" lang={lang} />
          <Row label={t('measure.sv')} v={st.strokeVolume} testId="sv" lang={lang} />
          <Row label={t('measure.co')} v={st.cardiacOutput} testId="co" lang={lang} />
          <Row label={t('measure.cycle')} v={st.cycleDuration} testId="cycle" lang={lang} />
        </dl>
        <div className="mt-2 flex items-center gap-2 text-xs text-graphite-soft">
          <span aria-hidden className="beat-dot inline-block h-2.5 w-2.5 rounded-full bg-cardio" style={{ ['--cycle' as string]: `${st.cycleDuration.value}s` }} />
          {t('measure.beat')}
        </div>
      </Panel>
    </>
  );
}
