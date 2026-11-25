import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useProgress } from '@react-three/drei';
import { label, manifest, type Lang } from '@atlas/anatomy-manifest';
import { useAtlas } from './store';
import { AtlasScene } from './scene/AtlasScene';
import { ScenarioPanel } from './ui/ScenarioPanel';
import { LayerPanel } from './ui/LayerPanel';
import { FlowPanel } from './ui/FlowPanel';
import { RespiratoryPanel } from './ui/RespiratoryPanel';
import { SectionPanel } from './ui/SectionPanel';
import { ExercisePanel } from './ui/ExercisePanel';
import { Inspector } from './ui/Inspector';
import { StructureList } from './ui/StructureList';
import { Credits } from './ui/Credits';
import { startFlowTicker } from './lib/flowClock';
import { PoweredBy } from './ui/PoweredBy';
import { MissionCard, MissionList, MissionRunner } from './ui/Missions';
import { sectionPlane } from './lib/section';
import { boundsOf } from './lib/camera';
import { modelsFor } from './lib/models';

function Header() {
  const { t, i18n } = useTranslation();
  const { view, setView } = useAtlas();
  return (
    <header className="flex items-center justify-between border-b border-line bg-white px-4 py-2.5">
      <a href="#main" className="sr-only focus:not-sr-only">{t('app.skip')}</a>
      <div className="flex items-baseline gap-3">
        <span className="text-sm font-semibold tracking-[0.2em]">{t('app.title')}</span>
        <span className="text-xs text-graphite-soft">{t('app.subtitle')}</span>
      </div>
      <nav className="flex items-center gap-4 text-sm">
        <button onClick={() => setView(view === 'credits' ? 'atlas' : 'credits')} className="underline decoration-line underline-offset-4 hover:decoration-graphite" data-testid="nav-credits">
          {view === 'credits' ? t('nav.atlas') : t('nav.credits')}
        </button>
        <div role="group" aria-label={t('lang.label')} className="flex rounded-sm border border-line">
          {(['tr', 'en'] as const).map((l) => (
            <button key={l} onClick={() => i18n.changeLanguage(l)} aria-pressed={i18n.language === l} data-testid={`lang-${l}`}
              className={`px-2 py-0.5 font-mono text-xs ${i18n.language === l ? 'bg-graphite text-white' : ''}`}>{t(`lang.${l}`)}</button>
          ))}
        </div>
      </nav>
    </header>
  );
}

function Stage() {
  const { t } = useTranslation();
  const { active } = useProgress();
  // ready when every model of the visible layers is in the scene (hidden layers are lazy-loaded)
  const loaded = useAtlas((s) => modelsFor(s.layers).every((f) => s.loadedModels.includes(f)));
  const progress = useAtlas((s) => { const need = modelsFor(s.layers); return `${need.filter((f) => s.loadedModels.includes(f)).length}/${need.length}`; });
  const hovered = useAtlas((s) => s.hovered);
  const section = useAtlas((s) => s.section);
  const layers = useAtlas((s) => s.layers);
  const sectionPos = sectionPlane(section.axis, section.t, boundsOf(layers) ?? boundsOf({ heart: true })!).constant;
  return (
    <div className="relative min-h-[300px] flex-1" data-testid="stage" data-ready={loaded && !active}
      data-section={section.enabled ? `${section.axis}:${section.t.toFixed(2)}` : 'off'} data-section-pos={sectionPos.toFixed(4)}>
      <AtlasScene />
      {(!loaded || active) && <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-graphite-soft" data-testid="loading">{t('loading')} {progress}</div>}
      {hovered && <HoverLabel name={hovered} />}
      <StageControls />
      <MissionCard />
      <p className="pointer-events-none absolute bottom-2 left-1/2 hidden -translate-x-1/2 rounded-sm bg-white/80 px-2 py-0.5 text-[11px] text-graphite-soft lg:block" data-testid="muscle-note">{t('stage.muscleNote')}</p>
    </div>
  );
}

function StageControls() {
  const { t } = useTranslation();
  const { leftOpen, rightOpen, togglePanel, requestCamera, selected, isolate, setIsolate } = useAtlas();
  const btn = 'pointer-events-auto rounded-sm border border-line bg-white/90 px-2 py-1 text-[11px] hover:bg-white';
  return (
    <>
      <div className="pointer-events-none absolute right-2 top-2 flex gap-1">
        {selected && (
          <button className={btn} onClick={() => setIsolate(!isolate)} aria-pressed={!isolate} data-testid="show-all">
            {isolate ? t('stage.showAll') : t('stage.isolate')}
          </button>
        )}
        <button className={btn} onClick={() => requestCamera({ kind: 'reset' })} data-testid="reset-view">{t('stage.reset')}</button>
      </div>
      <div className="pointer-events-none absolute bottom-2 left-2 hidden gap-1 lg:flex">
        <button className={btn} onClick={() => togglePanel('left')} aria-expanded={leftOpen} aria-controls="panel-left" data-testid="toggle-left">
          {leftOpen ? '◂ ' : '▸ '}{t('stage.leftPanel')}
        </button>
      </div>
      <div className="pointer-events-none absolute bottom-2 right-2 hidden gap-1 lg:flex">
        <button className={btn} onClick={() => togglePanel('right')} aria-expanded={rightOpen} aria-controls="panel-right" data-testid="toggle-right">
          {t('stage.rightPanel')}{rightOpen ? ' ▸' : ' ◂'}
        </button>
      </div>
      <p className="pointer-events-none absolute left-2 top-2 hidden text-[10px] text-graphite-soft lg:block" style={{ marginTop: 28 }}>{t('stage.hint')}</p>
    </>
  );
}

function HoverLabel({ name }: { name: string }) {
  const { i18n } = useTranslation();
  return <div data-testid="hover-label" className="pointer-events-none absolute left-3 top-3 rounded-sm border border-line bg-white/90 px-2 py-1 text-xs">{label(name, i18n.language as Lang).text}</div>;
}

export default function App() {
  const { t } = useTranslation();
  const view = useAtlas((s) => s.view);
  const select = useAtlas((s) => s.select);
  const leftOpen = useAtlas((s) => s.leftOpen);
  const rightOpen = useAtlas((s) => s.rightOpen);
  useEffect(() => startFlowTicker(), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') select(null); };
    const onHash = () => useAtlas.setState({ view: location.hash === '#/credits' ? 'credits' : 'atlas' });
    addEventListener('keydown', onKey); addEventListener('hashchange', onHash);
    return () => { removeEventListener('keydown', onKey); removeEventListener('hashchange', onHash); };
  }, [select]);

  return (
    <div className="flex h-full flex-col">
      <MissionRunner />
      <Header />
      {view === 'credits' ? <div className="flex-1 overflow-auto"><Credits /></div> : (
        <main id="main" className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {leftOpen && (
            <aside className="order-2 w-full overflow-auto border-line bg-paper lg:order-1 lg:w-60 lg:shrink-0 lg:border-r" data-testid="panel-left">
              <MissionList />
              <ScenarioPanel />
              <RespiratoryPanel />
              <FlowPanel />
              <LayerPanel />
              <SectionPanel />
            </aside>
          )}
          <div className="order-1 flex min-h-[55vh] min-w-0 flex-1 flex-col lg:order-2"><Stage /><ExercisePanel /></div>
          {rightOpen && (
            <aside className="order-3 w-full overflow-auto border-line bg-paper lg:w-64 lg:shrink-0 lg:border-l" data-testid="panel-right">
              <Inspector />
              <StructureList />
            </aside>
          )}
        </main>
      )}
      <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-line bg-white px-3 py-1.5 text-[11px] text-graphite-soft">
        <span data-testid="disclaimer">{t('disclaimer')}</span>
        <PoweredBy />
      </footer>
    </div>
  );
}
