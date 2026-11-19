# Data sources — verified 2026-11-18

Verification method: files fetched from the primary host where reachable, otherwise from the publisher's own GitHub repository; license read from the publisher's LICENSE / metadata file, not from memory.

## Summary vs. spec

| Source | Spec assumption | Verified | Status |
|---|---|---|---|
| HuBMAP HRA 3D reference organs | GLB/glTF, Uberon-linked, CC licensed | GLB + crosswalk CSV, **CC BY 4.0** | ✅ matches |
| OpenStax *Anatomy and Physiology* | CC BY | *A&P 2e* is **CC BY-NC-SA 4.0** | ⚠️ **differs** |
| Uberon | stable IDs, part-of | OBO/OWL, **CC BY 3.0** | ✅ (license now specified) |
| Z-Anatomy / BodyParts3D | CC BY-SA, optional | not evaluated (gated by owner approval) | ⏸ |

## 1. HuBMAP Human Reference Atlas (HRA) — 3D Reference Object Library

- **Publisher:** HuBMAP / CNS Indiana University (Börner lab). Data from the NLM Visible Human (male + female).
- **Format:** binary glTF 2.0 (`.glb`), one file per organ, metres, Y-up; separate meshes per anatomical structure, node names like `VH_M_left_cardiac_atrium`.
- **Ontology link:** `asct-b-3d-models-mapping.csv` (v1.3) / `asct-b-3d-models-crosswalk.csv` (v1.4, v2.0) maps node name → label → `UBERON:*` (some rows use `FMA:*`, some have no ID).
- **License:** CC BY 4.0 (per organ metadata, e.g. `v2.0/markdown/ref-organs/3d-vh-m-heart.md`).
- **Citation (heart, male):** Kristen Browne; Heidi Schlehlein. 2022. *3D Reference Organ for Heart, Male v1.2.* https://doi.org/10.48539/HBM373.VSTV.568 (HuBMAP ID HBM373.VSTV.568).
- **Hosts:** primary `https://cdn.humanatlas.io/hra-releases/<rel>/models/` (**blocked in this cloud environment**); mirror `https://raw.githubusercontent.com/hubmapconsortium/ccf-releases/main/<rel>/models/` (works).
- **Relevant files (release v1.3 folder):**

| File | Size | Notes |
|---|---|---|
| `VH_M_Heart.glb` | 4.07 MB | 14 meshes / 18 nodes, 164,119 triangles, 1 shared material. Chambers, valves, septum, papillary muscles. |
| `VH_M_Blood_Vasculature.glb` | 7.44 MB | 153 nodes / 104 meshes. Subtree `VH_M_blood_vasculature_of_heart` (used in M1): aorta (ascending, arch, branches, descending), pulmonary trunk + L/R pulmonary arteries, 4 pulmonary veins, venae cavae, brachiocephalic veins, coronary arteries and cardiac veins. Same coordinate frame as the heart file (verified: no placement transform needed). |
| `VH_M_Lung.glb` | 6.36 MB | Lungs, lobes, bronchi (102 crosswalk rows). Not yet inspected. |
| Female equivalents | — | `VH_F_Heart`, `VH_F_Lungs`, `VH_F_Blood_Vasculature` exist. |

- **Coverage gaps / issues found**
  - (Resolved in M1 by adding the vasculature subtree.) The heart GLB contains **no great vessels** (no aorta, pulmonary trunk, venae cavae, pulmonary veins) and **no coronary arteries**, although the crosswalk lists ~50 such rows under `VH_M_Heart`. They must come from `VH_M_Blood_Vasculature.glb` (to inspect in M1).
  - Heart model is v1.2 (2022); newer HRA releases (v1.4, v2.0) re-reference the same heart model.
  - Chamber meshes are closed solids, not hollow lumens — the blood-path animation must run along a curve through chamber centroids, not inside a modelled lumen.
  - Crosswalk rows for heart vessels are filed under model ID `VH_M_Heart` although the meshes live in `VH_M_Blood_Vasculature`; the manifest builder matches by node name.
  - FMA-only rows are resolved to Uberon through Uberon's own `xref: FMA:` lines (10 structures, e.g. SVC → UBERON:0001585); no hand mapping.
  - Crosswalk quality: papillary muscles use FMA IDs; `VH_M_left_anterior_descending_artery` is labelled "Anterior descending branch of left *pulmonary* artery" (FMA:8636) — apparent error, still present in v1.4 and v2.0 (male and female). Corrected in our manifest via `packages/anatomy-manifest/overrides.json` → UBERON:8600102; issue text for upstream in `docs/upstream/hubmap-crosswalk-lad-issue.md`.
  - Single material for all meshes → we assign our own materials (allowed; recorded as a change in SOURCES.md).
  - Organ coverage: ~30 organs, no full skeleton/muscle system (only vertebrae, pelvis, knees, ligaments). Skeletal/muscular layers (M4) will need another source (see §4).

## 2. OpenStax *Anatomy and Physiology 2e*

- **Publisher:** OpenStax, Rice University. Collection `col11496`, slug `anatomy-and-physiology-2e`.
- **Format:** CNXML (XML) modules in `github.com/openstax/osbooks-anatomy-physiology` (`modules/mNNNNN/index.cnxml`); HTML/PDF on openstax.org (**openstax.org blocked here**; GitHub works).
- **License:** **CC BY-NC-SA 4.0** — verified in `LICENSE` and in `collections/anatomy-and-physiology-2e.collection.xml` (`<md:license url="http://creativecommons.org/licenses/by-nc-sa/4.0/">`). The spec says CC BY; this is wrong for the current edition.
- **Implications:** quoting/adapting text → our derived text must be CC BY-NC-SA and the app must be non-commercial while it contains it. Numeric reference values and facts are cited (facts are not copyrightable), so the physiology engine is unaffected. See ADR-0004 and open questions.
- Also checked: `osbooks-biology-bundle` (Biology 2e) LICENSE is also CC BY-NC-SA 4.0 in the repo — not a CC BY escape hatch. The 1st edition of A&P (2013) was published CC BY 4.0 but is archived; not verified here.
- Cardiac reference values extracted from module `m46672` "Cardiac Physiology" (§19.4) — see PHYSIOLOGY_MODEL.md.

## 3. Uberon (multi-species anatomy ontology)

- **Format:** OBO / OWL / JSON releases. `purl.obolibrary.org` blocked here; `raw.githubusercontent.com/obophenotype/uberon/master/uberon.obo` reachable (HTTP 200).
- **License:** CC BY 3.0 Unported (repo `LICENSE`).
- **Use:** IDs, labels, synonyms and `part_of` edges for the structures in our manifest. We extract only the subset we need via a script (no full ontology in the bundle). Turkish labels are **not** in Uberon → TR names need a separate sourced terminology (open question).

## 4. Optional, gated: Z-Anatomy / BodyParts3D

CC BY-SA (share-alike). Not downloaded. Requires owner approval (spec). If approved, assets live in `assets/share-alike/` and are flagged in SOURCES.md.
