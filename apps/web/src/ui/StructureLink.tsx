import { useTranslation } from 'react-i18next';
import { label, type Lang } from '@atlas/anatomy-manifest';
import { useAtlas } from '../store';

export function StructureLink({ name }: { name: string }) {
  const { i18n } = useTranslation();
  const select = useAtlas((s) => s.select);
  return (
    <button onClick={() => select(name)} className="text-left underline decoration-line underline-offset-2 hover:decoration-graphite">
      {label(name, i18n.language as Lang).text}
    </button>
  );
}
