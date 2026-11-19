# Physiology model (v1 — Milestone 1 scope: heart)

The engine (`packages/physiology`) is a pure, deterministic function of a scenario: `compute(scenario) → state`. Every constant below has a reference ID; the code stores the ID next to the value and tests assert both. Values marked **derived** are computed by a stated formula, never typed in.

## References
- **[OSX-19.1]** Betts J.G. et al., *Anatomy and Physiology 2e*, OpenStax 2022, §19.1 "Heart Anatomy" (module m46676). CC BY-NC-SA 4.0. Used for the order of the blood path and which structures carry oxygen-poor/oxygen-rich blood (content/blood-path.json) and the facts in content/texts.
- **[OSX-19.4]** Betts J.G. et al., *Anatomy and Physiology 2e*, OpenStax 2022, §19.4 "Cardiac Physiology" (module m46672). CC BY-NC-SA 4.0. Values verified from the CNXML source on 2026-11-18.

## Variables (M1)

| Symbol | Meaning | Unit |
|---|---|---|
| HR | heart rate | beats/min (bpm) |
| SV | stroke volume | mL/beat |
| CO | cardiac output | L/min |
| EF | ejection fraction | % |
| EDV | end-diastolic volume | mL |
| T_cycle | cardiac cycle duration | s |

## Formulas
- `CO = HR × SV / 1000` — [OSX-19.4] ("CO = HR × SV").
- `EF = SV / EDV` — [OSX-19.4].
- `T_cycle = 60 / HR` — definition of rate (derived).
- `EDV = SV / EF` — rearrangement (derived).

## Reference values — [OSX-19.4]

| Quantity | Value | Range | Quote anchor |
|---|---|---|---|
| Resting SV (70 kg adult) | 70 mL | 55–100 mL | "A mean SV for a resting 70-kg (150-lb) individual would be approximately 70 mL." |
| Resting HR | 75 bpm | 60–100 bpm | "An average resting HR would be approximately 75 bpm but could range from 60–100" |
| Resting CO | 5.25 L/min | 4.0–8.0 L/min | "the mean CO is 5.25 L/min, with a range of 4.0–8.0 L/min" |
| EF | 58 % | 55–70 % | "Ejection fractions range from approximately 55–70 percent, with a mean of 58 percent." |
| Exercise HR (healthy young) | 150 bpm | — | "In healthy young individuals, HR may increase to 150 bpm during exercise." |
| Exercise SV | 130 mL | — | "SV can also increase from 70 to approximately 130 mL" |
| Exercise CO | 19.5 L/min | 4–5 × rest | "This would increase CO to approximately 19.5 L/min" |
| Max HR | — | 200–220 bpm | "Maximum HRs are normally in the range of 200–220 bpm" |
| HR–CO relation | CO rises to ~120 bpm, plateaus 120–160, falls >160 | — | §19.4 text |

## Scenarios (M1)

| Scenario | HR | SV | CO (derived) | T_cycle (derived) | Source status |
|---|---|---|---|---|---|
| rest | 75 | 70 | 5.25 | 0.80 s | ✅ [OSX-19.4] |
| Koşu (yoğun egzersiz) / Running (vigorous exercise) | 150 | 130 | 19.5 | 0.40 s | ✅ [OSX-19.4] "exercise" values; label approved by owner (Q7) |
| walking | — | — | — | — | ❌ **not shipped.** No second source could be verified (see below). |

### Walking — search log (M1)
Owner decision Q3: use a second reliable cited source, else ship rest + running only. Candidates found but **not verifiable from the dev environment** (ncbi.nlm.nih.gov blocked), so nothing was used:
- *Cardiodynamic variables measured by impedance cardiography during a 6-minute walk test…*, young healthy adults — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8148309/
- *Differential kinetics of the cardiac, ventilatory, and gas exchange variables during walking under moderate hypoxia* — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6059434/ (normoxia arm)
- *Acute effect of uphill and downhill treadmill walk on cardiovascular response…* (ResearchGate)
Next step: owner or a session with PMC access reads one full text and records HR and SV (mean ± SD, protocol, n) here; then the engine adds `walking`.

Consistency check (test): `75 × 70 / 1000 = 5.25` and `150 × 130 / 1000 = 19.5` reproduce the book's CO values exactly.

## Animation coupling
- **Schematic timing:** blood-path particles advance one path step per heartbeat, i.e. one step per `T_cycle` (rest 0.80 s, running 0.40 s). This is a didactic mapping, shown as such in the UI; it is not a claim about real transit times. The path is the fixed sequence: venae cavae → right atrium → tricuspid → right ventricle → pulmonary valve → pulmonary trunk → lungs → pulmonary veins → left atrium → mitral → left ventricle → aortic valve → aorta. The sequence is anatomy (cited from OSX §19.1/19.3 in M1), not a number.
- The UI displays only engine output; it never computes physiology itself.

## Out of scope for M1 (later milestones)
Respiratory rate, tidal volume, minute ventilation, O₂ consumption, regional blood-flow distribution (M2–M3). Each needs its own cited reference rows here before implementation.
