import { useTranslation } from 'react-i18next';
import type { Layer } from '@atlas/anatomy-manifest';
import { useAtlas } from '../store';
import { Panel } from './Panel';

const LAYERS: Layer[] = ['heart', 'greatVessels', 'coronaryVessels', 'lungs', 'airways'];

export function LayerPanel() {
  const { t } = useTranslation();
  const { layers, toggleLayer, flowOn, setFlowOn } = useAtlas();
  const box = 'h-4 w-4 accent-[#2b2e33]';
  return (
    <Panel title={t('layers.title')} id="layers-h">
      <ul className="space-y-1.5 text-sm">
        {LAYERS.map((l) => (
          <li key={l}><label className="flex items-center gap-2">
            <input type="checkbox" className={box} checked={layers[l]} onChange={() => toggleLayer(l)} data-testid={`layer-${l}`} />
            {t(`layers.${l}`)}
          </label></li>
        ))}
        <li><label className="flex items-center gap-2">
          <input type="checkbox" className={box} checked={flowOn} onChange={() => setFlowOn(!flowOn)} data-testid="layer-flow" />
          {t('layers.flow')}
        </label></li>
      </ul>
    </Panel>
  );
}
