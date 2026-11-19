# CLAUDE.md — HUMAN ATLAS

Educational, browser-only 3D exploration of human anatomy (structure) and physiology (function).
Product spec: `docs/SPEC.md` (source of truth). Not medical advice, not a diagnostic tool, no patient data.

## Non-negotiables
1. **No invented data.** Meshes come from open datasets (HuBMAP HRA first). Text and numbers come from sourced references. Every asset is registered in `docs/SOURCES.md` (URL, license, attribution, changes) before it is used.
2. **The physiology engine owns every number.** `packages/physiology` is pure TypeScript (no UI, no LLM, no I/O). Every constant carries a `ref` to an entry in `docs/PHYSIOLOGY_MODEL.md`. Derived values are labelled "derived" with their formula. No unsourced constant may ship.
3. **The LLM never generates physiology values or anatomical facts.** Data is downloaded and converted by scripts in `scripts/`, never typed in by hand from memory.
4. **A feature is done only when its interaction works** and is covered by tests. No mock buttons.
5. **i18n from day one**: TR (default) + EN. No hard-coded UI strings.
6. **License gates:** CC BY-SA assets (Z-Anatomy / BodyParts3D) need explicit owner approval and live under `assets/share-alike/`. NC-licensed text (OpenStax A&P 2e is CC BY-NC-SA 4.0) lives under `content/nc-sa/` — see ADR-0004.

## Layout (target)
```
apps/web/               React + Vite + Tailwind + Zustand + R3F/drei
packages/physiology/    pure engine + Vitest
packages/anatomy-manifest/  generated mesh → Uberon/source manifest (JSON + types)
scripts/                download / convert / compress (gltf-transform, Draco/Meshopt)
data/raw/               downloaded originals (git-ignored, re-creatable by scripts)
spikes/                 throwaway experiments (not shipped)
docs/                   ARCHITECTURE, DATA_SOURCES, SOURCES, PHYSIOLOGY_MODEL, ROADMAP, adr/
```

## Commands
- `npm ci` · `npm run dev` · `npm test` (Vitest) · `npm run e2e -- --trace off` (Playwright) · `npm run typecheck`
- Data: `npm run data:download` then `npm run data:build` (regenerates models + manifest; commit both)
- Deploy: push to `main` or a `claude/**` branch → `.github/workflows/ci-pages.yml` → https://sevimsoffice.github.io/human-atlas/
- Content to review: `content/texts/structures.json` (status unreviewed/reviewed), `content/terms/anatomy-terms.tr.json` (needs-expert-review)

## Working rules
- Keep edits focused; prefer scripts over hand-written data; keep token use low.
- After each milestone: app runs, tests pass, existing behaviour preserved, `docs/SOURCES.md` updated, report done vs outstanding.
- Ask before: adding any new data source, using share-alike assets, adding a backend, changing a reference value.
- Git: one feature branch + PR per milestone; owner reviews, then Claude merges.
- Sub-agents: `.claude/agents/` (graphics-engineer, physiology-engineer, test-writer, code-reviewer).
- Network note (cloud sessions): `cdn.humanatlas.io`, `openstax.org`, `purl.obolibrary.org` are blocked; scripts fall back to the GitHub mirrors (`raw.githubusercontent.com`).
