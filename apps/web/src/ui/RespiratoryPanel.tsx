import { useTranslation } from 'react-i18next';
import { computeRespiratory, REFERENCES, type DerivedValue, type RefValue } from '@atlas/physiology';
import { useAtlas } from '../store';
import { Badge, Panel } from './Panel';

const fmt = (v: number, lang: string) => v.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB', { maximumFractionDigits: 2 });

function Row({ label, v, testId, note }: { label: string; v: RefValue | DerivedValue | null; testId: string; note?: string }) {
  const { t, i18n } = useTranslation();
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="shrink-0 text-sm">{label}</dt>
      <dd className="text-right">
        {v ? (
          <>
            <span data-testid={testId} className="font-mono text-base tabular-nums">{fmt(v.value, i18n.language)}</span>
            <span className="ml-1 font-mono text-xs text-graphite-soft">{v.unit === 'mL O2/L' ? t('resp.extractionUnit') : v.unit === 'breaths/min' ? t('resp.perMin') : v.unit}</span>
            <div className="font-mono text-[10px] text-graphite-soft">
              {'ref' in v ? (
                <a href={REFERENCES[v.ref].url} target="_blank" rel="noreferrer" title={v.quote} className="underline decoration-line underline-offset-2">
                  {t('measure.ref')}: {v.ref}{v.range ? ` · ${t('measure.range')} ${fmt(v.range[0], i18n.language)}–${fmt(v.range[1], i18n.language)}` : ''}
                </a>
              ) : <>{t('measure.derived')}: {v.formula.replace('*', ' × ')}</>}
            </div>
            {note && <div className="max-w-[11rem] text-[10px] text-graphite-soft">{note}</div>}
          </>
        ) : (
          <span data-testid={testId} data-missing="true"><Badge tone="warn">{t('resp.pending')}</Badge></span>
        )}
      </dd>
    </div>
  );
}

export function RespiratoryPanel() {
  const { t } = useTranslation();
  const scenario = useAtlas((s) => s.scenario);
  const breaths = useAtlas((s) => s.breaths);
  const r = computeRespiratory(scenario);
  return (
    <Panel title={t('resp.title')} id="resp-h">
      <dl className="divide-y divide-line" data-testid="respiratory" data-breaths={breaths} data-breath-cycle-s={r.breathCycle?.value ?? ''}>
        <Row label={t('resp.rr')} v={r.breathingRate} testId="rr" />
        <Row label={t('resp.vt')} v={r.tidalVolume} testId="vt" />
        <Row label={t('resp.ve')} v={r.minuteVentilation} testId="ve" />
        <Row label={t('resp.vo2')} v={r.oxygenUptake} testId="vo2" />
        <Row label={t('resp.extraction')} v={r.oxygenExtraction} testId="extraction" />
      </dl>
      <p className="mt-1 text-[11px] text-graphite-soft">{t('resp.extraction')} {t('resp.extractionNote')}</p>
      <div className="mt-2 flex items-center gap-2 text-xs text-graphite-soft">
        <span aria-hidden className={`inline-block h-2.5 w-2.5 rounded-full bg-[#9db7cc] ${r.breathCycle ? 'breath-dot' : 'opacity-40'}`}
          style={{ ['--breath' as string]: `${r.breathCycle?.value ?? 0}s` }} />
        {r.breathCycle ? t('resp.breathing', { s: r.breathCycle.value.toLocaleString() }) : t('resp.notBreathing')}
      </div>
      {r.missing.length > 0 && <p className="mt-2 text-xs text-graphite-soft" data-testid="resp-missing">{t('resp.missingNote')}</p>}
    </Panel>
  );
}
