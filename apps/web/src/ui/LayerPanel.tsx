import { useTranslation } from 'react-i18next';
import { SYSTEM_LAYERS } from '@atlas/anatomy-manifest';
import { useAtlas } from '../store';
import { Panel } from './Panel';

export function LayerPanel() {
  const { t } = useTranslation();
  const { layers, toggleLayer, flowOn, setFlowOn } = useAtlas();
  const box = 'h-3.5 w-3.5 accent-[#2b2e33]';
  return (
    <Panel title={t('layers.title')} id="layers-h">
      <div className="space-y-1.5">
        {SYSTEM_LAYERS.map((g) => (
          <div key={g.system}>
            <div className="text-[11px] text-graphite-soft">{t(`systems.${g.system}`)}</div>
            <ul className="text-[13px]">
              {g.layers.map((l) => (
                <li key={l}><label className="flex items-center gap-2 py-px">
                  <input type="checkbox" className={box} checked={layers[l]} onChange={() => toggleLayer(l)} data-testid={`layer-${l}`} />
                  {t(`layers.${l}`)}
                </label></li>
              ))}
            </ul>
          </div>
        ))}
        <label className="flex items-center gap-2 pt-1 text-[13px]">
          <input type="checkbox" className={box} checked={flowOn} onChange={() => setFlowOn(!flowOn)} data-testid="layer-flow" />
          {t('layers.flow')}
        </label>
      </div>
    </Panel>
  );
}
