# Roadmap

Each milestone ends with: app runs, tests pass, existing behaviour preserved, SOURCES.md updated, done-vs-outstanding report. Model guidance from spec: Opus for Phase 0 + M1, Sonnet afterwards.

| # | Milestone | Key deliverables | Main data needs | Exit test |
|---|---|---|---|---|
| 0 | Foundations ✅ | Docs, ADRs, sub-agents, heart data spike | HRA heart GLB, OSX §19.4 | Spike loads GLB + picking works ✅ |
| 1 | Heart vertical slice ✅ | Monorepo scaffold; pipeline (download → manifest → compress); heart + great vessels (+ lungs if cheap); inspector with TR/EN names, Uberon ID, source; blood-path animation; engine HR/SV/CO for rest/walking/running; scenario switch changes animation + values; credits page; disclaimer | HRA heart, vasculature, lung GLB; Uberon subset; walking values (Q3); TR terms (Q4) | Vitest engine + manifest; Playwright journey |
| 2 | Lungs + respiratory engine (in review) | Lung model; RR, VT, VE, O₂ uptake linked to CO; breathing animation | OSX ch. 22 values | engine coupling tests |
| 3 | Exercise across systems | rest→walk→run drives heart, lungs, muscle blood-flow distribution | cited flow-distribution table | scenario integration tests |
| 4 | Remaining systems + cross-section | Layers: skeletal, muscular, nervous, digestive, urinary; clipping-plane slider | HRA organs; skeleton/muscle source (Q2) | layer toggle e2e |
| 5 | Missions | Guided step sequences (e.g. follow an RBC lungs → leg muscle) | — | mission e2e |
| 6 | AI tutor | Retrieval over sourced content, citations, "I don't know" | licensed text corpus (Q1) | grounding evals |
| 7 | Camera mode (optional) | Hand cursor, dwell-select, palm-rotate → same actions as mouse | — | works fully without camera |
| 8 | Deployment | Static hosting, CDN for models, credits/licence review | — | prod smoke test |
