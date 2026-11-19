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
| 6 | AI tutor (Phase 0: design in review) | Grounded tutor over our own content + engine values, citations, "Bu konu henüz içeriğimizde yok", medical-advice refusal, serverless proxy (Vercel), cost caps — see `docs/AI_TUTOR_DESIGN.md` | own content (`content/`), SOURCES.md, engine | ~30-question automated eval |
| 7 | Camera mode (optional) | Hand cursor, dwell-select, palm-rotate → same actions as mouse | — | works fully without camera |
| 8 | Deployment | Static hosting, CDN for models, credits/licence review | — | prod smoke test |
| 9 | Male/female switch (later) | Female HRA heart/lung/vasculature (+ organs) via a male↔female node mapping built from Uberon IDs, with a reviewed override list; female TR terms/texts; switch in the header | VH_F_* models (same CC BY 4.0 source) | switch e2e, mapping tests |

Notes:
- **Walking scenario (owner decision, M5 review):** do not combine studies with different intensities or populations. Walking is added only when ONE source gives both heart (HR/SV or CO) and breathing (RR/VT or VE) values for healthy adults at the same walking intensity. Keep searching occasionally (candidates checked so far: Lee et al. 2025 — breathing only; Liu et al. 2021 PLoS ONE — heart only, 6-min walk).
- **Skeleton (owner decision, M5 review):** the NIH 3D CT skeleton (3DPX-016838) is skipped — one unlabelled mesh in another frame. Keep the HRA partial skeleton; revisit only if a segmented (per-bone) CC BY skeleton is found.
- Muscles stay chart-only (no CC BY/CC0 muscle model; share-alike not used, owner decision 2026-11-19).
