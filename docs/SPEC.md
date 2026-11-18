# HUMAN ATLAS — An Interactive Exploration of the Human Body

Product spec and source of truth for the `human-atlas` repo. Use Opus for Phase 0 and Milestone 1, Sonnet afterwards.

---

## Role

You are a senior software architect, 3D/graphics engineer, scientific visualization designer and educational product designer. Build HUMAN ATLAS: a modern science laboratory where the user explores the real structure of the human body and how its systems work together.

This is NOT an organ encyclopedia, a set of spinning models with labels, or a medical diagnosis tool. It is an educational exploration of anatomy (structure) and physiology (function), built on real scientific 3D data and sourced content.

## Product principles

1. Real data, never invented. 3D anatomy comes from open scientific datasets. Text comes from openly licensed textbooks. Every structure, fact and number has a recorded source.
2. A deterministic physiology engine owns every number (heart rate, cardiac output, breathing rate, oxygen use, blood-flow distribution). Values and formulas come from cited textbook reference ranges. The LLM never invents physiological values or anatomical facts.
3. The AI tutor (later milestone) only explains from the sourced content, with citations, and says "I don't know" when the content does not cover it.
4. Educational only. Show a clear note: not medical advice, not a diagnostic tool. No real patient data, ever.
5. Licensing is a first-class feature: `docs/SOURCES.md` lists every asset with source URL, license, attribution and any changes made. An in-app "Sources & credits" page shows all attributions.
6. A feature is complete only when its interaction works. No fake buttons or static mockups presented as features.
7. Turkish and English UI (i18n from the start), default TR, with a TR/EN switch.
8. Low token cost: download and convert data with scripts, do not generate data with the LLM, keep edits focused.

## Data sources (verify current availability and licenses in Phase 0)

Primary:
- HuBMAP Human Reference Atlas (HRA), 3D reference organs: GLB/glTF, linked to Uberon ontology IDs, Creative Commons licensed. Preferred for everything it covers.
- OpenStax "Anatomy and Physiology" (CC BY): source for explanatory text and physiology reference values.
- Uberon ontology: stable IDs and part-of relationships for anatomical structures.

Optional, only after review:
- Z-Anatomy / BodyParts3D (full-body skeleton, muscles, vessels, nerves): CC BY-SA, share-alike. Keep these assets in a separate folder, flag the license in SOURCES.md, and ask me before using them, because share-alike affects future commercial use.

Rules: never use stock illustrations or assets with unclear licenses. If a download is blocked by the environment, stop and tell me which files to download manually.

## Visual direction — modern science laboratory

- Clean, precise, museum-quality scientific visualization. Calm and credible, not sci-fi.
- No neon, no glowing hologram clichés, no busy HUD.
- Graphite and soft white surfaces, cool neutral lighting, one accent color per body system (e.g. cardiovascular deep red, respiratory soft blue, nervous amber, skeletal ivory, muscular rose).
- Organs rendered with realistic, slightly translucent materials when layers overlap. Soft shadows, a subtle lab-bench or specimen-stage floor.
- UI as quiet instrument panels: thin lines, generous spacing, a clean sans-serif (e.g. Inter / IBM Plex Sans) and a mono for measurements.
- Readability and scientific clarity beat atmosphere.
- If a Claude Design export is in `design/`, follow it for panels, layout and typography.

## Interaction — mouse first, camera optional

- Primary: mouse/touch/keyboard. Orbit, zoom, click to select a structure, toggle layers, cross-section slider.
- Optional "Camera mode" (off by default, late milestone): hand cursor with dwell-to-select, open palm to rotate. Gestures only trigger the same actions as the mouse. App works fully without a camera.

## Core experiences

1. Body overview: systems as toggleable layers (skeletal, muscular, cardiovascular, respiratory, nervous, digestive, urinary).
2. Structure inspector: select an organ to see its name (TR/EN), Uberon ID, parts, neighbors, function, related systems and source.
3. Process views: animated processes driven by the engine, e.g. the path of blood through the heart and lungs, the electrical conduction of the heartbeat, breathing.
4. "What happens when…?" scenarios: rest → walking → running. The engine computes how heart, lungs, muscles and circulation change together, and the 3D view shows it (heart rate, flow distribution, breathing).
5. Missions (later): short guided explorations ("Follow a red blood cell from the lungs to the leg muscle").
6. AI tutor (later): answers questions using only sourced content, with citations.
7. Sources & credits page.

## Milestone 1 vertical slice — the heart

1. Load the HuBMAP heart (and lungs if available) as optimized GLB in the browser.
2. Select and highlight heart structures (chambers, valves, major vessels) with names, IDs and sources.
3. Animate the blood path: body → right atrium → right ventricle → lungs → left atrium → left ventricle → aorta.
4. Physiology engine computes heart rate, stroke volume and cardiac output for rest, walking and running, with cited reference values.
5. Switching the scenario changes the animation speed and the displayed values.
6. Tests prove the engine values and that scenario changes update state.

## Tech stack

TypeScript. Physiology engine as a pure package (`packages/physiology`) with no UI or LLM dependencies. Frontend: React + Vite + Tailwind + Zustand + Three.js via React Three Fiber and drei. Asset pipeline scripts (`scripts/`) to download, convert and compress models (gltf-transform with Draco/Meshopt), plus a manifest linking each mesh to its Uberon ID and source. Vitest for the engine, Playwright for the main journey. V1 runs fully in the browser; no backend needed.

## Working rules for Claude Code

- Phase 0 (no app code): write `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/DATA_SOURCES.md` (what each dataset provides, format, license, coverage gaps), `docs/SOURCES.md` (asset register, empty template), `docs/PHYSIOLOGY_MODEL.md` (variables, formulas, reference values with citations), `docs/ROADMAP.md`, first ADRs in `docs/adr/`.
- Phase 0 also includes a small data spike: try to download one HuBMAP organ (the heart), load it in a minimal Three.js page, report file size, structure names and license. This proves the data path works.
- Create sub-agents in `.claude/agents/`: `graphics-engineer`, `physiology-engineer`, `test-writer`, `code-reviewer`.
- List open questions and ask before assuming. Then stop and wait for approval.
- Milestones: 1 heart vertical slice; 2 lungs and respiratory engine linked to the heart; 3 exercise scenario across systems; 4 remaining systems as layers + cross-section; 5 missions; 6 AI tutor grounded in OpenStax with citations; 7 optional camera mode; 8 deployment.
- After each milestone: app runs, tests pass, existing behavior preserved, SOURCES.md updated, report done vs outstanding.
