# HUMAN ATLAS

An interactive, sourced, browser-based exploration of the human body — anatomy (structure) and physiology (function).
Educational only: not medical advice, not a diagnostic tool, no patient data.

**Live:** https://sevimsoffice.github.io/human-atlas/ · Status: **Milestone 1 — heart vertical slice** (see `docs/ROADMAP.md`).

## Run locally
```bash
npm ci
npm run dev            # http://localhost:5173
npm test               # Vitest: physiology engine, manifest integrity, animation timing
npm run e2e -- --trace off   # Playwright main journey (builds + previews under /human-atlas/)
```

## Rebuild the data (only needed when sources change)
```bash
npm run data:download  # HuBMAP HRA heart + vasculature, crosswalk, Uberon → data/raw (git-ignored)
npm run data:build     # → apps/web/public/models/*.glb + packages/anatomy-manifest/src/manifest.json
```

## Where things are
- `packages/physiology` — pure engine (HR, SV, CO, cycle duration) with cited reference values
- `packages/anatomy-manifest` — generated mesh ↔ Uberon ↔ source manifest, labels, texts, blood path
- `apps/web` — React + R3F app · `content/` — own texts, TR terms (needs expert review), blood path
- Docs: `docs/SPEC.md`, `ARCHITECTURE.md`, `DATA_SOURCES.md`, `SOURCES.md` (asset register), `PHYSIOLOGY_MODEL.md`, `adr/`
