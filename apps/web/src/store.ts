import { create } from 'zustand';
import type { ScenarioId } from '@atlas/physiology';
import type { Layer } from '@atlas/anatomy-manifest';
import { resolveSelectable } from '@atlas/anatomy-manifest';

export type View = 'atlas' | 'credits';

interface AtlasState {
  scenario: ScenarioId;
  selected: string | null;
  layers: Record<Layer, boolean>;
  flowOn: boolean;
  flowStep: number;
  flowBeats: number;
  breaths: number;
  hovered: string | null;
  loadedModels: string[];
  view: View;
  cameraRequest: { kind: 'reset' } | { kind: 'focus'; name: string } | null;
  leftOpen: boolean;
  rightOpen: boolean;
  bottomOpen: boolean;
  requestCamera: (r: { kind: 'reset' } | { kind: 'focus'; name: string }) => void;
  togglePanel: (side: 'left' | 'right' | 'bottom') => void;
  setScenario: (s: ScenarioId) => void;
  select: (name: string | null) => void;
  toggleLayer: (l: Layer) => void;
  setFlowOn: (on: boolean) => void;
  setFlowStep: (step: number, beats: number) => void;
  setBreaths: (n: number) => void;
  setHovered: (name: string | null) => void;
  markLoaded: (file: string) => void;
  setView: (v: View) => void;
}

// Physiology values are never stored here: components derive them with computeCardiac(scenario).
export const useAtlas = create<AtlasState>((set) => ({
  scenario: 'rest',
  selected: null,
  layers: { heart: true, greatVessels: true, coronaryVessels: true, lungs: true, airways: true },
  flowOn: true,
  flowStep: 0,
  flowBeats: 0,
  breaths: 0,
  hovered: null,
  loadedModels: [],
  cameraRequest: null,
  leftOpen: true,
  rightOpen: true,
  bottomOpen: false, // exercise panel collapsed by default: the 3D view gets the height
  // a fresh object each time so repeated requests (reset, reset) still trigger
  requestCamera: (r) => set({ cameraRequest: { ...r } }),
  togglePanel: (side) => set((s) => (side === 'left' ? { leftOpen: !s.leftOpen } : side === 'right' ? { rightOpen: !s.rightOpen } : { bottomOpen: !s.bottomOpen })),
  view: location.hash === '#/credits' ? 'credits' : 'atlas',
  setScenario: (scenario) => set({ scenario }),
  select: (name) => set({ selected: name ? resolveSelectable(name) : null }),
  toggleLayer: (l) => set((s) => ({ layers: { ...s.layers, [l]: !s.layers[l] } })),
  setFlowOn: (flowOn) => set({ flowOn }),
  setFlowStep: (flowStep, flowBeats) => set({ flowStep, flowBeats }),
  setBreaths: (breaths) => set({ breaths }),
  setHovered: (name) => set({ hovered: name ? resolveSelectable(name) : null }),
  markLoaded: (file) => set((s) => (s.loadedModels.includes(file) ? s : { loadedModels: [...s.loadedModels, file] })),
  setView: (view) => { location.hash = view === 'credits' ? '#/credits' : ''; set({ view }); },
}));
