# ADR-0005: Asset pipeline with gltf-transform + generated manifest
Status: Accepted (Phase 0 approval) · Date: 2026-11-18

**Decision.** Node scripts using `@gltf-transform/cli|functions`: dedup → weld → (optional simplify, recorded) → Meshopt compression (chosen in M1: decoder ships with three.js, no external decoder download; heart 4.07 MB → 1.04 MB, heart vessels 7.44 MB → 1.03 MB). Node names are preserved for selection. A generated `manifest.json` links each mesh to Uberon ID, labels (EN/TR), system, and SOURCES.md ID; CI test fails on unmapped meshes.
**Consequences.** No hand-edited model files; every change reproducible and recorded.
