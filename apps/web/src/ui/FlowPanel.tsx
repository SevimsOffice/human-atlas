import { useTranslation } from 'react-i18next';
import { bloodPath } from '@atlas/anatomy-manifest';
import { computeCardiac } from '@atlas/physiology';
import { useAtlas } from '../store';
import { Panel } from './Panel';

export function FlowPanel() {
  const { t, i18n } = useTranslation();
  const { flowStep, flowBeats, flowOn, setFlowOn, scenario } = useAtlas();
  const cycle = computeCardiac(scenario).cycleDuration.value;
  const step = bloodPath[flowStep];
  return (
    <Panel title={t('flow.title')} id="flow-h">
      <div data-testid="flow" data-step={flowStep} data-beats={flowBeats} data-cycle-s={cycle}>
        <div className="flex items-center justify-between gap-2">
          <div aria-live="polite">
            <div className="text-[11px] text-graphite-soft">{t('flow.current')} · <span className="font-mono">{flowStep + 1}/{bloodPath.length}</span></div>
            <div className="text-[13px] font-medium" data-testid="flow-step">{t(`flow.steps.${step.id}`)}</div>
            <div className="text-xs text-graphite-soft">
              {t(step.blood === 'low' ? 'flow.lowO2' : 'flow.highO2')}{!step.modelled && ` · ${t('flow.notModelled')}`}
            </div>
          </div>
          <button onClick={() => setFlowOn(!flowOn)} className="rounded-sm border border-line bg-white px-2.5 py-1 text-xs hover:bg-paper" data-testid="flow-toggle">
            {flowOn ? t('flow.pause') : t('flow.play')}
          </button>
        </div>
        <ol className="mt-3 grid grid-cols-[repeat(17,minmax(0,1fr))] gap-[2px]" aria-hidden>
          {bloodPath.map((s, i) => (
            <li key={s.id} title={t(`flow.steps.${s.id}`)}
              className={`h-1.5 rounded-[1px] ${i === flowStep ? 'bg-graphite' : s.blood === 'low' ? 'bg-blood-low/40' : 'bg-blood-high/40'} ${s.modelled ? '' : 'opacity-40'}`} />
          ))}
        </ol>
        <p className="mt-2 text-xs text-graphite-soft">{t('flow.timing', { s: cycle.toLocaleString(i18n.language) })}</p>
      </div>
    </Panel>
  );
}
