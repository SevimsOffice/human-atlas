# Architecture

## Overview
Browser-only SPA (no backend in V1). Three layers with one-way data flow:

```
scripts/ (offline pipeline)          packages/                         apps/web
download → inspect → map → compress  physiology  (pure TS engine)  →  Zustand store → R3F scene + panels
            ↓                        anatomy-manifest (generated)  →  inspector, credits page
     public/models/*.glb  ────────────────────────────────────────→  GLTF loader (drei useGLTF + Draco/Meshopt)
```

## Modules

### `scripts/` — asset pipeline (Node, run manually / in CI)
1. `download-*.sh|ts`: fetch originals into `data/raw/` (git-ignored) with SHA-256 pinning; primary host → GitHub mirror fallback.
2. `build-manifest.ts`: read GLB node names + HRA crosswalk (+ Uberon subset) → `packages/anatomy-manifest/manifest.json`: `{ meshName, uberonId, labelEn, labelTr, system, sourceId, partOf[] }`. Unknown/incorrect crosswalk rows go to an explicit `overrides.json` with a reason.
3. `optimize-models.ts`: gltf-transform (dedup, weld, simplify only if needed, Meshopt or Draco) → `apps/web/public/models/`. Each output gets a SOURCES.md "Changes made" note.

### `packages/physiology` — engine
- Pure functions, no DOM/React/network. `compute(scenario: ScenarioId, params?) → PhysiologyState`.
- Constants are `RefValue = { value, unit, ref, range? }`; derived values are `{ value, unit, derivedFrom: formulaId }`.
- 100% unit-tested with Vitest; tests assert each constant against PHYSIOLOGY_MODEL.md values.

### `packages/anatomy-manifest`
- Generated JSON + TS types. Single place linking mesh ↔ Uberon ↔ source ↔ i18n labels.

### `apps/web`
- React + Vite + Tailwind + Zustand + React Three Fiber + drei; i18n via `i18next` (TR default, EN).
- Store slices: `scene` (layers, selection, camera), `scenario` (current id), `physiology` (derived via engine; never set directly).
- Scene: specimen-stage floor, neutral lighting, per-system accent material, translucency when layers overlap.
- Panels: Structure inspector, Scenario switcher + measurements (mono font), Sources & credits, educational disclaimer.
- Camera (`scene/CameraRig.tsx`, limits in `lib/camera.ts`): orbits the heart centre, polar angle 0.2 rad–0.58π (never under the stage or over the top), no panning, distance 0.12–0.9 m, damping 0.1; "reset view" and double-click-to-focus animate target and position.
- Models: one config, `scripts/models.config.json`, drives download (SHA-256 pinned), compression, manifest and in-app credits for every HRA model.
- Cross-section (`lib/section.ts`, `scene/clipPlane.ts`): one shared THREE.Plane on every material (transverse / sagittal / coronal, slider 0–100 % of the visible bounds); picking ignores hits on the removed side.
- Interaction: orbit/zoom, click select (raycast on manifest meshes), keyboard navigation, layer toggles; camera mode (M7) only emits the same actions.

## Testing
- Vitest: engine values, scenario switching, manifest integrity (every mesh has a source; every source in SOURCES.md).
- Playwright: main journey (load → select left ventricle → see Uberon ID → switch scenario → HR and animation speed change). `--trace off` by default.

## Performance budget (initial)
Heart+vessels+lungs ≤ 8 MB compressed total, first interaction < 3 s on a mid laptop, 60 fps target.

## Licensing architecture
- `assets/share-alike/` (CC BY-SA, gated) and `content/nc-sa/` (CC BY-NC-SA text) are physically separated so they can be dropped for a commercial build.
