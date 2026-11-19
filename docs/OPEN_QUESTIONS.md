# Open questions

## Decided 2026-11-19 (Phase 0 approval)
Q1 option B (own texts, OpenStax cited for facts only; commercial use is a goal) · Q2 M4: look for CC BY/CC0 first, Z-Anatomy/BodyParts3D only as fallback with share-alike impact report · Q3 search for a second source, else rest + running only (→ rest + running shipped in M1, see PHYSIOLOGY_MODEL.md) · Q4 official TR terminology if citable, else translations marked needs-expert-review in one file (→ content/terms/anatomy-terms.tr.json) · Q5 male in M1, switch in M4 · Q6 lungs in M2; vasculature in M1 · Q7 "Koşu (yoğun egzersiz) / Running (vigorous exercise)" · Q8 Claude Design export will arrive in design/; M1 uses a minimal UI · Q9 feature branch + PR per milestone; owner reviews, Claude merges.

## Phase 0 questions (original text)

1. **Q1 OpenStax licence.** A&P 2e is CC BY-NC-SA 4.0, not CC BY. Choose: (B, proposed) cite for facts/values only and write our own reviewed short texts; (A) use book text, app stays non-commercial; (C) look for a CC BY source (archived A&P 1e). Is future commercial use a goal?
2. **Q2 Skeleton & muscles (M4).** HRA has no full skeleton/muscular system. Approve evaluating Z-Anatomy/BodyParts3D (CC BY-SA, share-alike), or drop/limit those layers?
3. **Q3 Walking values.** OpenStax §19.4 gives rest (HR 75, SV 70) and exercise (HR 150, SV 130) but no walking. Approve finding a second cited source (e.g. an openly licensed exercise-physiology text or ACSM-style intensity tables), or ship M1 with rest + running only?
4. **Q4 Turkish anatomical names.** Uberon has no Turkish labels. Source for TR terms: Terminologia Anatomica TR edition / Türk Anatomi ve Klinik Anatomi Derneği terms (licence to check), or owner-reviewed translations marked as such?
5. **Q5 Model sex.** Use male (VH_M) models by default, female, or offer a switch?
6. **Q6 Lungs in M1.** Include `VH_M_Lung.glb` (+6.4 MB raw) in M1 for the pulmonary leg of the blood path, or show lungs as a simple sourced placeholder until M2?
7. **Q7 "Running" mapping.** OpenStax describes generic "exercise" (HR 150). OK to label this scenario "running (vigorous exercise)"?
8. **Q8 Design export.** No `design/` folder exists yet. Will a Claude Design export come, or should M1 follow the spec's visual direction directly?
9. **Q9 Git workflow.** Phase 0 pushed to `main` as requested. For milestones: feature branch + PR, or direct to `main`?
