import { useTranslation } from 'react-i18next';
import { useAtlas } from '../store';
import type { SectionAxis } from '../lib/section';
import { Panel } from './Panel';

const AXES: SectionAxis[] = ['transverse', 'sagittal', 'coronal'];

export function SectionPanel() {
  const { t } = useTranslation();
  const { section, setSection } = useAtlas();
  return (
    <Panel title={t('section.title')} id="section-h">
      <label className="flex items-center gap-2 text-[13px]">
        <input type="checkbox" className="h-4 w-4 accent-[#2b2e33]" checked={section.enabled} onChange={() => setSection({ enabled: !section.enabled })} data-testid="section-toggle" />
        {t('section.enable')}
      </label>
      <div role="radiogroup" aria-label={t('section.axis')} className={`mt-1.5 grid h-7 grid-cols-3 rounded-sm border border-line bg-white p-0.5 ${section.enabled ? '' : 'opacity-50'}`}>
        {AXES.map((a) => (
          <button key={a} role="radio" aria-checked={section.axis === a} disabled={!section.enabled} onClick={() => setSection({ axis: a })} data-testid={`section-axis-${a}`}
            className={`truncate rounded-[2px] px-1 text-[11px] ${section.axis === a ? 'bg-graphite text-white' : 'hover:bg-paper'}`}>{t(`section.axes.${a}`)}</button>
        ))}
      </div>
      <input type="range" min={0} max={100} step={1} value={Math.round(section.t * 100)} disabled={!section.enabled}
        onChange={(e) => setSection({ t: Number(e.target.value) / 100 })} aria-label={t('section.position')} data-testid="section-slider"
        className="mt-2 w-full accent-[#2b2e33]" />
      <p className="text-[11px] leading-snug text-graphite-soft">{t(`section.hint.${section.axis}`)}</p>
    </Panel>
  );
}
