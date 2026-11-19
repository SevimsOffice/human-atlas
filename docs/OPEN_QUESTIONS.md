# Open questions

## Decided 2026-11-19 (Phase 0 approval)
Q1 option B (own texts, OpenStax cited for facts only; commercial use is a goal) · Q2 M4: look for CC BY/CC0 first, Z-Anatomy/BodyParts3D only as fallback with share-alike impact report · Q3 search for a second source, else rest + running only (→ rest + running shipped in M1, see PHYSIOLOGY_MODEL.md) · Q4 official TR terminology if citable, else translations marked needs-expert-review in one file (→ content/terms/anatomy-terms.tr.json) · Q5 male in M1, switch in M4 · Q6 lungs in M2; vasculature in M1 · Q7 "Koşu (yoğun egzersiz) / Running (vigorous exercise)" · Q8 Claude Design export will arrive in design/; M1 uses a minimal UI · Q9 feature branch + PR per milestone; owner reviews, Claude merges.

## Decided 2026-11-19 (M2 approval)
Q10: keep "source pending"; owner will allow www.ncbi.nlm.nih.gov, then find a peer-reviewed (open-access preferred) source for RR/VT during running and walking (**host still unreachable at M3 start**) · Q11: keep O2 extraction, labelled "derived (Fick principle)" · Q12: normalise VO2 to mL/kg/min and scale to the 70-kg body, explained on the Sources page (done in M3).

## Decided (M3 review)
Q13: running uses the "maximal exercise" column, labelled "based on the maximal exercise column of OpenStax A&P 2e §20.4" (owner decision). Review fixes: 3D view ≥ 60 % width, collapsible panels, constrained orbit camera with reset and double-click focus, notes ≤ 680 px, footer credit.

## Open (Milestone 3)
- ~~**Q13 Running ↔ "maximal exercise" column.**~~ (decided above) The A&P §20.4 table has rest / mild / maximal columns; running (HR 150, CO 19.5 L/min) is mapped to "maximal" (17.5 L/min) as the closest. Alternative: show only rest until a running-specific distribution is found.
- **Q14 Muscles in 3D.** HRA has no skeletal-muscle model, so muscle blood flow is shown in the chart only. M4 will search CC BY/CC0 muscle models first.

## Previously open (Milestone 2)
- **Q10 Blocked sources.** Running breathing values (RR, VT) and walking cardiac values need a source that this cloud environment cannot open (med.libretexts.org, www.ncbi.nlm.nih.gov are blocked). Options: (a) allow those hosts for this environment, (b) owner provides the pages/PDFs, (c) owner names another accessible textbook.
- **Q11 Fick principle citation.** O2 extraction = VO2 / CO is shown as a derived link between heart and lungs; the formula still needs a citable textbook statement (OpenStax does not state it). Keep, or hide until cited?
- **Q12 Mixed reference bodies.** VO2 (College Physics, 76-kg male) and cardiac values (A&P, 70-kg adult) come from different books; the derived extraction is labelled illustrative. Acceptable?

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
