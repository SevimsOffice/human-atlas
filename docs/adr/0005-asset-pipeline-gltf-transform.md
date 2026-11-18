# ADR-0005: Asset pipeline with gltf-transform + generated manifest
Status: Proposed · Date: 2026-11-18

**Decision.** Node scripts using `@gltf-transform/cli|functions`: dedup → weld → (optional simplify, recorded) → Meshopt compression (Draco as fallback; choose by measured size/decode time in M1). Node names are preserved for selection. A generated `manifest.json` links each mesh to Uberon ID, labels (EN/TR), system, and SOURCES.md ID; CI test fails on unmapped meshes.
**Consequences.** No hand-edited model files; every change reproducible and recorded.
