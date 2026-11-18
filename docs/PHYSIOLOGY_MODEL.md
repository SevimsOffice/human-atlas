# Physiology model (v0 — Milestone 1 scope: heart)

The engine (`packages/physiology`) is a pure, deterministic function of a scenario: `compute(scenario) → state`. Every constant below has a reference ID; the code stores the ID next to the value and tests assert both. Values marked **derived** are computed by a stated formula, never typed in.

## References
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
| Exercise HR (healthy young) | 150 bpm | — | "HR may increase to 150 bpm during exercise." |
| Exercise SV | 130 mL | — | "SV can also increase from 70 to approximately 130 mL" |
| Exercise CO | 19.5 L/min | 4–5 × rest | "This would increase CO to approximately 19.5 L/min" |
| Max HR | — | 200–220 bpm | "Maximum HRs are normally in the range of 200–220 bpm" |
| HR–CO relation | CO rises to ~120 bpm, plateaus 120–160, falls >160 | — | §19.4 text |

## Scenarios (M1)

| Scenario | HR | SV | CO (derived) | T_cycle (derived) | Source status |
|---|---|---|---|---|---|
| rest | 75 | 70 | 5.25 | 0.80 s | ✅ [OSX-19.4] |
| running (vigorous exercise) | 150 | 130 | 19.5 | 0.40 s | ✅ [OSX-19.4] — "exercise" mapped to "running" (to confirm) |
| walking | **TBD** | **TBD** | — | — | ❌ **no source yet.** OpenStax gives no walking values. Must not ship until sourced (open question Q3). |

Consistency check (test): `75 × 70 / 1000 = 5.25` and `150 × 130 / 1000 = 19.5` reproduce the book's CO values exactly.

## Animation coupling
- Blood-path particles advance one "stroke" per `T_cycle`; volume per stroke ∝ SV. The path is the fixed sequence: venae cavae → right atrium → tricuspid → right ventricle → pulmonary valve → pulmonary trunk → lungs → pulmonary veins → left atrium → mitral → left ventricle → aortic valve → aorta. The sequence is anatomy (cited from OSX §19.1/19.3 in M1), not a number.
- The UI displays only engine output; it never computes physiology itself.

## Out of scope for M1 (later milestones)
Respiratory rate, tidal volume, minute ventilation, O₂ consumption, regional blood-flow distribution (M2–M3). Each needs its own cited reference rows here before implementation.
