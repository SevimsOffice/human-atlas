import { useTranslation } from 'react-i18next';
import { label, LIST_GROUPS, type Lang } from '@atlas/anatomy-manifest';
import { useAtlas } from '../store';
import { Panel } from './Panel';

export function StructureList() {
  const { t, i18n } = useTranslation();
  const { selected, select, hovered, layers } = useAtlas();
  return (
    <Panel title={t('list.title')} id="list-h">
      <nav aria-labelledby="list-h" className="space-y-3">
        {LIST_GROUPS.map((g) => (
          <div key={g.id} className={layers[g.layer] ? '' : 'opacity-40'}>
            <h3 className="mb-1 text-xs font-medium text-graphite-soft">{t(`list.${g.id}`)}</h3>
            <ul className="space-y-px">
              {g.items.map((n) => (
                <li key={n}>
                  <button onClick={() => select(n)} aria-current={selected === n}
                    className={`w-full rounded-sm px-2 py-1 text-left text-sm ${selected === n ? 'bg-graphite text-white' : hovered === n ? 'bg-white' : 'hover:bg-white'}`}>
                    {label(n, i18n.language as Lang).text}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </Panel>
  );
}
