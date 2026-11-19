import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { label, manifest, resolveSelectable, SOURCES, SYSTEM_LAYERS, textFor, type Lang } from '@atlas/anatomy-manifest';
import { useAtlas } from '../store';
import { Badge, Panel } from './Panel';
import { StructureLink } from './StructureLink';

const uberonUrl = (id: string) => `http://purl.obolibrary.org/obo/${id.replace(':', '_')}`;

function Field({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="py-1.5">
      <dt className="mb-0.5 text-[11px] uppercase tracking-[0.08em] text-graphite-soft">{title}</dt>
      <dd className="text-[13px]">{children}</dd>
    </div>
  );
}

export function Inspector() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as Lang;
  const selected = useAtlas((s) => s.selected);
  const select = useAtlas((s) => s.select);
  const s = selected ? manifest.structures[selected] : null;

  if (!s) return (
    <Panel title={t('inspector.title')} id="inspector-h">
      <p className="text-sm text-graphite-soft" data-testid="inspector-empty">{t('inspector.empty')}</p>
    </Panel>
  );

  const name = label(s.name, lang);
  const other = label(s.name, lang === 'tr' ? 'en' : 'tr');
  const txt = textFor(s.name);
  const src = SOURCES.find((x) => x.id === s.sourceId)!;
  const xwalk = SOURCES.find((x) => x.id === 'HRA-XWALK-1.3')!;
  const parts = [...new Set(s.children.map(resolveSelectable))].filter((c) => c !== s.name);
  // distinct structures; two source meshes can share one label (e.g. diagonal branches), list the label once
  const seen = new Set<string>();
  const neighbors = [...new Set((s.neighbors ?? []).map(resolveSelectable))]
    .filter((c) => c !== s.name && c !== s.parent)
    .filter((c) => { const l = label(c, lang).text; if (seen.has(l)) return false; seen.add(l); return true; });
  const via = s.uberon?.via ?? '';

  return (
    <Panel title={t('inspector.title')} id="inspector-h">
      <div data-testid="inspector" data-structure={s.name}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-[15px] font-semibold leading-tight" data-testid="inspector-name">{name.text}</h3>
            <p className="text-xs text-graphite-soft">{other.text}</p>
            {(name.needsReview || other.needsReview) && <div className="mt-1"><Badge tone="warn">{t(name.missingTr || other.missingTr ? 'inspector.termMissing' : 'inspector.termReview')}</Badge></div>}
          </div>
          <button onClick={() => select(null)} aria-label={t('inspector.close')} className="rounded-sm border border-line px-2 text-sm hover:bg-paper">×</button>
        </div>
        <dl className="mt-2 divide-y divide-line">
          <Field title={t('inspector.ontology')}>
            {s.uberon ? (
              <>
                <a data-testid="uberon-id" href={uberonUrl(s.uberon.id)} target="_blank" rel="noreferrer" className="font-mono underline decoration-line underline-offset-2">{s.uberon.id}</a>
                {s.uberon.label && <span className="ml-1 text-graphite-soft">· {s.uberon.label}</span>}
                <div className="text-[11px] text-graphite-soft">
                  {via.startsWith('uberon-xref') ? t('inspector.via.uberon-xref', { x: via.split(':').slice(1).join(':') }) : t(`inspector.via.${via}`)}
                </div>
                {s.override && <p className="mt-1 text-[11px] text-amber-900">{t('inspector.overrideNote', { reason: s.override.reason })}</p>}
              </>
            ) : s.override?.crosswalkRejected ? <span className="text-[11px] text-amber-900">{t('inspector.overrideNote', { reason: s.override.reason })}</span>
            : s.crosswalk ? <span className="font-mono text-graphite-soft">{t('inspector.noUberon', { id: s.crosswalk.id })}</span>
              : <span className="text-graphite-soft">{t('inspector.noId')}</span>}
          </Field>
          <Field title={t('inspector.function')}>
            {txt ? (
              <>
                <p data-testid="inspector-text">{txt.text[lang]}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <Badge tone={txt.text.status === 'reviewed' ? 'neutral' : 'warn'}>{t(`inspector.textStatus.${txt.text.status}`)}</Badge>
                  <Badge>{txt.text.cites.map((c) => `OpenStax A&P 2e ${c.replace('OSX-', '§')}`).join(', ')}</Badge>
                </div>
                {txt.text.blood && <p className="mt-1 text-xs text-graphite-soft">{t('inspector.blood')}: {t(txt.text.blood === 'low' ? 'flow.lowO2' : 'flow.highO2')}</p>}
              </>
            ) : <span className="text-graphite-soft">{t('inspector.noText')}</span>}
          </Field>
          {s.uberon?.definition && (
            <Field title={t('inspector.definition')}><p lang="en" className="text-graphite-soft">{s.uberon.definition}</p></Field>
          )}
          {(s.parent || (s.uberon?.partOf.length ?? 0) > 0) && (
            <Field title={t('inspector.partOf')}>
              <ul className="space-y-0.5">
                {s.parent && <li><StructureLink name={s.parent} /></li>}
                {s.uberon?.partOf.map((p) => <li key={p.id} className="text-graphite-soft"><span className="font-mono text-xs">{p.id}</span> {p.label} <span className="text-[10px]">(Uberon)</span></li>)}
              </ul>
            </Field>
          )}
          {parts.length > 0 && (
            <Field title={t('inspector.parts')}><ul className="space-y-0.5">{parts.map((p) => <li key={p}><StructureLink name={p} /></li>)}</ul></Field>
          )}
          {neighbors.length > 0 && (
            <Field title={t('inspector.neighbors')}>
              <ul className="flex flex-wrap gap-x-3 gap-y-0.5" data-testid="neighbors">{neighbors.map((p) => <li key={p}><StructureLink name={p} /></li>)}</ul>
              <p className="mt-1 text-[11px] text-graphite-soft">{t('inspector.neighborsNote', { mm: manifest.neighborThresholdMm })}</p>
            </Field>
          )}
          <Field title={t('inspector.systems')}><span data-testid="inspector-system">{t(`systems.${SYSTEM_LAYERS.find((g) => g.layers.includes(s.layer))?.system ?? 'cardiovascular'}`)}</span></Field>
          <Field title={t('inspector.source')}>
            <p className="text-xs" data-testid="inspector-source">
              <a href={src.url} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-2">{src.title}</a> — {src.license}
            </p>
            <p className="text-[11px] text-graphite-soft">{src.attribution}</p>
            {s.crosswalk && <p className="mt-1 text-[11px] text-graphite-soft">{xwalk.title}: “{s.crosswalk.label}” <span className="font-mono">{s.crosswalk.id}</span></p>}
          </Field>
        </dl>
      </div>
    </Panel>
  );
}
