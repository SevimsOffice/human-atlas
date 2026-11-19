import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { compareExercise, computeFlowDistribution, REFERENCES } from '@atlas/physiology';
import { useAtlas } from '../store';

// Validated with the dataviz palette script (light surface): categorical pair passes all checks.
const SERIES = { rest: '#3a6ea5', running: '#b0343c' } as const;

const fmt = (v: number, lang: string, d = 2) => v.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB', { maximumFractionDigits: d });

function FlowChart() {
  const { t, i18n } = useTranslation();
  const scenario = useAtlas((s) => s.scenario);
  const [asTable, setAsTable] = useState(false);
  const rest = computeFlowDistribution('rest');
  const run = computeFlowDistribution('running');
  const max = Math.max(...rest.organs.map((o) => o.flow.value), ...run.organs.map((o) => o.flow.value));
  const lang = i18n.language;
  return (
    <section aria-labelledby="flow-dist-h" className="min-w-0 max-w-[680px] flex-1" data-testid="flow-distribution">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 id="flow-dist-h" className="text-[11px] font-medium uppercase tracking-[0.12em] text-graphite-soft">{t('exercise.flowTitle')}</h2>
        <button onClick={() => setAsTable(!asTable)} className="rounded-sm border border-line bg-white px-2 py-0.5 text-[11px] hover:bg-paper" data-testid="flow-table-toggle">
          {asTable ? t('exercise.showChart') : t('exercise.showTable')}
        </button>
      </div>
      <div className="mb-1.5 flex gap-4 text-[11px]" aria-hidden={asTable}>
        {(['rest', 'running'] as const).map((k) => (
          <span key={k} className={`flex items-center gap-1.5 ${scenario === k ? 'font-semibold' : 'text-graphite-soft'}`}>
            <span className="inline-block h-2 w-3 rounded-[2px]" style={{ background: SERIES[k] }} />{t(`scenario.${k}`)}
          </span>
        ))}
      </div>
      {asTable ? (
        <table className="w-full text-xs" data-testid="flow-table">
          <thead><tr className="text-left text-graphite-soft"><th className="font-normal">{t('exercise.organ')}</th><th className="pl-3 text-right font-normal">{t('scenario.rest')}</th><th className="pl-3 text-right font-normal">{t('scenario.running')}</th></tr></thead>
          <tbody>
            {rest.organs.map((o, i) => (
              <tr key={o.organ} className="border-t border-line">
                <td className="py-0.5">{t(`organs.${o.organ}`)}</td>
                <td className="text-right font-mono">{fmt(o.flow.value, lang)} L/min · {fmt(o.share.value * 100, lang, 1)}%</td>
                <td className="text-right font-mono" data-testid={`table-run-${o.organ}`}>{fmt(run.organs[i].flow.value, lang)} L/min · {fmt(run.organs[i].share.value * 100, lang, 1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ul className="space-y-0.5">
          {rest.organs.map((o, i) => {
            const r = run.organs[i];
            return (
              <li key={o.organ} className="grid grid-cols-[6.5rem_1fr] items-center gap-2" data-organ={o.organ}>
                <span className="truncate text-[11px]">{t(`organs.${o.organ}`)}</span>
                <div className="space-y-px">
                  {([['rest', o], ['running', r]] as const).map(([k, v]) => (
                    <div key={k} className="flex h-[11px] items-center gap-1.5" title={`${t(`organs.${o.organ}`)} · ${t(`scenario.${k}`)}: ${fmt(v.flow.value, lang)} L/min (${fmt(v.share.value * 100, lang, 1)}%) · ${t('exercise.tableValue')} ${v.tableValue} mL/min`}>
                      <div className="h-[5px] rounded-r-[4px]" style={{ width: `${Math.max(1, (v.flow.value / max) * 100) * 0.82}%`, background: SERIES[k] }} />
                      <span className="font-mono text-[10px] leading-none tabular-nums text-graphite-soft" data-testid={`bar-${k}-${o.organ}`}>{fmt(v.flow.value, lang)}</span>
                    </div>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-1.5 max-w-[680px] text-[11px] leading-snug text-graphite-soft" data-testid="flow-note">
        {t('exercise.flowNote')}{' '}
        <a href={REFERENCES['OSX-20.4'].url} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-2">{t('measure.ref')}: OSX-20.4</a>
      </p>
    </section>
  );
}

function Comparison() {
  const { t, i18n } = useTranslation();
  const rows = compareExercise();
  return (
    <section aria-labelledby="compare-h" className="w-full shrink-0 lg:w-[20rem]" data-testid="exercise-compare">
      <h2 id="compare-h" className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-graphite-soft">{t('exercise.compareTitle')}</h2>
      <table className="w-full text-xs">
        <thead><tr className="text-left text-graphite-soft"><th className="font-normal" /><th className="pl-3 text-right font-normal">{t('scenario.rest')}</th><th className="pl-3 text-right font-normal">{t('exercise.runShort')}</th><th className="pl-3 text-right font-normal">×</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-t border-line">
              <td className="py-1">{t(`exercise.rows.${r.key}`)} <span className="text-[10px] text-graphite-soft">{r.unit === 'mL O2/L' ? t('resp.extractionUnit') : r.unit}</span></td>
              <td className="pl-3 text-right font-mono tabular-nums">{fmt(r.rest, i18n.language)}</td>
              <td className="pl-3 text-right font-mono tabular-nums">{fmt(r.running, i18n.language)}</td>
              <td className="pl-3 text-right font-mono font-semibold tabular-nums" data-testid={`ratio-${r.key}`}>{fmt(r.ratio.value, i18n.language, 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1.5 max-w-[680px] text-[11px] leading-snug text-graphite-soft">{t('exercise.compareNote')}</p>
    </section>
  );
}

export function ExercisePanel() {
  const { t } = useTranslation();
  const open = useAtlas((s) => s.bottomOpen);
  const toggle = useAtlas((s) => s.togglePanel);
  return (
    <div className="border-t border-line bg-paper px-3 py-1.5" aria-label={t('exercise.title')}>
      <button onClick={() => toggle('bottom')} aria-expanded={open} data-testid="toggle-bottom"
        className="mb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-graphite-soft hover:text-graphite">
        {open ? '▾' : '▸'} {t('exercise.title')}
      </button>
      {open && (
        <div className="flex max-h-[32vh] flex-col gap-4 overflow-auto lg:flex-row" data-testid="panel-bottom">
          <FlowChart />
          <Comparison />
        </div>
      )}
    </div>
  );
}
