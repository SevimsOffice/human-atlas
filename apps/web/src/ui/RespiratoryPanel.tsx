import { useTranslation } from 'react-i18next';
import { computeRespiratory, REFERENCES, type DerivedValue, type RefValue } from '@atlas/physiology';
import { useAtlas } from '../store';
import { Badge, Panel } from './Panel';

const fmt = (v: number, lang: string) => v.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB', { maximumFractionDigits: 2 });

function Row({ label, v, testId, note }: { label: string; v: RefValue | DerivedValue | null; testId: string; note?: string }) {
  const { t, i18n } = useTranslation();
  return (
    <div className="py-1">
      <div className="flex items-baseline justify-between gap-2">
        <dt className="min-w-0 text-[13px] leading-tight">{label}</dt>
        <dd className="shrink-0 whitespace-nowrap">
          {v ? (
            <>
              <span data-testid={testId} className="font-mono text-[14px] tabular-nums">{fmt(v.value, i18n.language)}</span>
              <span className="ml-1 font-mono text-[11px] text-graphite-soft">{v.unit === 'mL O2/L' ? t('resp.extractionUnit') : v.unit === 'breaths/min' ? t('resp.perMin') : v.unit}</span>
            </>
          ) : (
            <span data-testid={testId} data-missing="true"><Badge tone="warn">{t('resp.pending')}</Badge></span>
          )}
        </dd>
      </div>
      {v && (
        <dd className="truncate whitespace-nowrap text-right font-mono text-[9.5px] leading-tight text-graphite-soft">
          {'ref' in v ? (
            <a href={REFERENCES[v.ref].url} target="_blank" rel="noreferrer" title={v.quote} className="underline decoration-line underline-offset-2">
              {t('measure.ref')}: {v.ref}{v.range ? ` · ${t('measure.range')} ${fmt(v.range[0], i18n.language)}–${fmt(v.range[1], i18n.language)}` : ''}
            </a>
          ) : v.formula === 'avO2=VO2/CO' ? <>{t('resp.fick')}</> : <>{t('measure.derived')}: {v.formula.replace(/\*/g, ' × ')}</>}
        </dd>
      )}
      {v && note && <dd className="text-right text-[10px] text-graphite-soft">{note}</dd>}
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
        <Row label={t('resp.vo2kg')} v={r.oxygenUptakePerKg} testId="vo2kg" />
        <Row label={t('resp.vo270')} v={r.oxygenUptake70kg} testId="vo270" />
        <Row label={t('resp.extraction')} v={r.oxygenExtraction} testId="extraction" />
      </dl>
      <p className="mt-1 text-[11px] leading-snug text-graphite-soft">{t('resp.extractionNote')}</p>
      <div className="mt-2 flex items-center gap-2 text-xs text-graphite-soft">
        <span aria-hidden className={`inline-block h-2.5 w-2.5 rounded-full bg-[#9db7cc] ${r.breathCycle ? 'breath-dot' : 'opacity-40'}`}
          style={{ ['--breath' as string]: `${r.breathCycle?.value ?? 0}s` }} />
        {r.breathCycle ? t('resp.breathing', { s: r.breathCycle.value.toLocaleString() }) : t('resp.notBreathing')}
      </div>
      {r.missing.length > 0 && <p className="mt-2 text-xs text-graphite-soft" data-testid="resp-missing">{t('resp.missingNote')}</p>}
    </Panel>
  );
}
