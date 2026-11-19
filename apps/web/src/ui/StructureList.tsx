import { useTranslation } from 'react-i18next';
import { label, LIST_GROUPS, type Lang } from '@atlas/anatomy-manifest';
import { useAtlas } from '../store';
import { Panel } from './Panel';

/** "Sağ kulakçık (atrium dextrum)" → normal-weight name + smaller grey Latin, on one line. */
function NameParts({ text, selected }: { text: string; selected: boolean }) {
  const m = text.match(/^(.*?)\s*\((.+)\)$/);
  if (!m) return <span className="truncate">{text}</span>;
  return (
    <>
      <span className="shrink-0">{m[1]}</span>
      <span className={`truncate text-[11px] ${selected ? 'text-white/70' : 'text-graphite-soft'}`}>{m[2]}</span>
    </>
  );
}

export function StructureList() {
  const { t, i18n } = useTranslation();
  const { selected, select, hovered, layers } = useAtlas();
  return (
    <Panel title={t('list.title')} id="list-h">
      <nav aria-labelledby="list-h" className="space-y-2">
        {LIST_GROUPS.map((g) => (
          <div key={g.id} className={layers[g.layer] ? '' : 'opacity-40'}>
            <h3 className="mb-0.5 text-[11px] font-medium text-graphite-soft">{t(`list.${g.id}`)}</h3>
            <ul className="space-y-px">
              {g.items.map((n) => (
                <li key={n}>
                  <button onClick={() => select(n)} aria-current={selected === n}
                    title={label(n, i18n.language as Lang).text}
                    className={`flex w-full items-baseline gap-1.5 truncate whitespace-nowrap rounded-sm px-2 py-[3px] text-left text-[13px] leading-tight ${selected === n ? 'bg-graphite text-white' : hovered === n ? 'bg-white' : 'hover:bg-white'}`}>
                    <NameParts text={label(n, i18n.language as Lang).text} selected={selected === n} />
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
