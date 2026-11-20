# Roadmap

Each milestone ends with: app runs, tests pass, existing behaviour preserved, SOURCES.md updated, done-vs-outstanding report. Model guidance from spec: Opus for Phase 0 + M1, Sonnet afterwards.

| # | Milestone | Key deliverables | Main data needs | Exit test |
|---|---|---|---|---|
| 0 | Foundations ✅ | Docs, ADRs, sub-agents, heart data spike | HRA heart GLB, OSX §19.4 | Spike loads GLB + picking works ✅ |
| 1 | Heart vertical slice ✅ | Monorepo scaffold; pipeline (download → manifest → compress); heart + great vessels (+ lungs if cheap); inspector with TR/EN names, Uberon ID, source; blood-path animation; engine HR/SV/CO for rest/walking/running; scenario switch changes animation + values; credits page; disclaimer | HRA heart, vasculature, lung GLB; Uberon subset; walking values (Q3); TR terms (Q4) | Vitest engine + manifest; Playwright journey |
| 2 | Lungs + respiratory engine ✅ | Lung model; RR, VT, VE, O₂ uptake linked to CO; breathing animation | OSX ch. 22 values | engine coupling tests |
| 3 | Exercise across systems ✅ | rest→walk→run drives heart, lungs, muscle blood-flow distribution | cited flow-distribution table | scenario integration tests |
| 4 | Remaining systems + cross-section ✅ | Layers: skeletal, muscular, nervous, digestive, urinary; clipping-plane slider | HRA organs; skeleton/muscle source (Q2) | layer toggle e2e |
| 5 | Missions ✅ | Guided step sequences (e.g. follow an RBC lungs → leg muscle) | — | mission e2e |
| 6 | AI tutor — **postponed** (owner decision 2026-11-20) | Not built in v1.0: no API keys, no paid services. Design kept as a future option: `docs/AI_TUTOR_DESIGN.md` | — | — |
| 7 | ~~Camera mode~~ — **dropped** (owner decision 2026-11-20) | — | — | — |
| 8 | v1.0: full body + release (in review) | HRA whole-body skin outline (CC BY) as the default view → intro close-up of heart and lungs; reset frames the full body; lazy-loading of hidden layers; stronger Meshopt compression (−29 %); UI fixes; portfolio README; tag `v1.0` | HRA skin (HRA-SKIN-M); NIH 3D skeleton outline (pending owner upload) | full-body + lazy-load e2e |
| 9 | Male/female switch (later) | Female HRA heart/lung/vasculature (+ organs) via a male↔female node mapping built from Uberon IDs, with a reviewed override list; female TR terms/texts; switch in the header | VH_F_* models (same CC BY 4.0 source) | switch e2e, mapping tests |

Notes:
- **Walking scenario (owner decision, M5 review):** do not combine studies with different intensities or populations. Walking is added only when ONE source gives both heart (HR/SV or CO) and breathing (RR/VT or VE) values for healthy adults at the same walking intensity. Keep searching occasionally (candidates checked so far: Lee et al. 2025 — breathing only; Liu et al. 2021 PLoS ONE — heart only, 6-min walk).
- **Skeleton:** M5 review skipped the NIH 3D CT skeleton (3DPX-016838); the v1.0 brief (2026-11-20) asks for it as a non-clickable outline fitted to the HRA pelvis and leg bones. The file could not be downloaded in the build environment; it is added once the owner uploads it (see `docs/OPEN_QUESTIONS.md` Q20).
- Muscles stay chart-only (no CC BY/CC0 muscle model; share-alike not used, owner decision 2026-11-19).
