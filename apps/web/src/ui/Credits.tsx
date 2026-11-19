import { useTranslation } from 'react-i18next';
import { manifest, SOURCES } from '@atlas/anatomy-manifest';
import { useAtlas } from '../store';
import { PoweredBy } from './PoweredBy';

export function Credits() {
  const { t } = useTranslation();
  const setView = useAtlas((s) => s.setView);
  return (
    <main id="main" className="mx-auto max-w-3xl px-6 py-8" data-testid="credits">
      <h1 className="text-2xl font-semibold">{t('credits.title')}</h1>
      <p className="mt-2 text-sm text-graphite-soft">{t('credits.intro')}</p>
      <ul className="mt-6 space-y-4">
        {SOURCES.map((s) => (
          <li key={s.id} className="rounded-sm border border-line bg-white p-4" data-testid={`credit-${s.id}`}>
            <h2 className="font-medium"><a href={s.url} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-2">{s.title}</a></h2>
            <dl className="mt-2 grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-graphite-soft">{t('credits.attribution')}</dt><dd>{s.attribution}</dd>
              <dt className="text-graphite-soft">{t('credits.license')}</dt><dd><a href={s.licenseUrl} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-2">{s.license}</a></dd>
              <dt className="text-graphite-soft">{t('credits.changes')}</dt><dd>{s.changes}</dd>
            </dl>
            <p className="mt-1 font-mono text-[10px] text-graphite-soft">{s.id}{s.id === 'UBERON' ? ` · ${manifest.uberonVersion}` : ''}</p>
          </li>
        ))}
      </ul>
      <section className="mt-8 rounded-sm border border-line bg-white p-4" data-testid="credits-derivations">
        <h2 className="font-medium">{t('credits.derivTitle')}</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm">
          <li>{t('credits.derivVo2')}</li>
          <li>{t('credits.derivFick')}</li>
          <li>{t('credits.derivFlow')}</li>
          <li>{t('credits.derivPending')}</li>
        </ul>
      </section>
      <p className="mt-6 text-sm">{t('credits.texts')}</p>
      <p className="mt-2 text-sm">{t('credits.terms')}</p>
      <p className="mt-6 border-t border-line pt-3"><PoweredBy testId="credits-powered-by" /></p>
      <button onClick={() => setView('atlas')} className="mt-6 rounded-sm border border-line bg-white px-3 py-1.5 text-sm hover:bg-paper">← {t('credits.back')}</button>
    </main>
  );
}
