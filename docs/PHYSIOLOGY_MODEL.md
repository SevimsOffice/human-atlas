# Physiology model (v2 — Milestones 1–2: heart, lungs)

The engine (`packages/physiology`) is a pure, deterministic function of a scenario: `compute(scenario) → state`. Every constant below has a reference ID; the code stores the ID next to the value and tests assert both. Values marked **derived** are computed by a stated formula, never typed in.

## References
- **[OSX-19.1]** Betts J.G. et al., *Anatomy and Physiology 2e*, OpenStax 2022, §19.1 "Heart Anatomy" (module m46676). CC BY-NC-SA 4.0. Used for the order of the blood path and which structures carry oxygen-poor/oxygen-rich blood (content/blood-path.json) and the facts in content/texts.
- **[OSX-19.4]** Betts J.G. et al., *Anatomy and Physiology 2e*, OpenStax 2022, §19.4 "Cardiac Physiology" (module m46672). CC BY-NC-SA 4.0. Values verified from the CNXML source on 2026-11-18.

- **[OSX-22.3]** Betts J.G. et al., *Anatomy and Physiology 2e*, OpenStax 2022, §22.3 "The Process of Breathing" (module m46549). CC BY-NC-SA 4.0. Also used for texts: §22.1 (m46548) [OSX-22.1], §22.2 (m46551) [OSX-22.2].
- **[CP-7.8]** Urone P.P., Hinrichs R. et al., *College Physics 2e*, OpenStax 2022, §7.8 "Work, Energy, and Power in Humans" (module m42153), table "Energy and Oxygen Consumption Rates" for a 76-kg male. CC BY-NC-SA 4.0. Quote anchors for table rows are written `activity | watts | L O2/min` exactly as the row reads.

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

## Respiratory model (M2)

| Symbol | Meaning | Unit |
|---|---|---|
| RR | breathing (respiratory) rate | breaths/min |
| VT | tidal volume | mL |
| VE | minute ventilation | L/min |
| T_breath | breath cycle duration | s |
| VO2 | oxygen uptake | L/min |
| O2 extraction | O2 removed from each litre of blood passing through the body | mL O2/L blood |

Formulas:
- `VE = RR × VT / 1000` — definition of minute ventilation (derived).
- `T_breath = 60 / RR` — definition of rate (derived).
- `O2 extraction = VO2 / CO × 1000` — mass balance of oxygen across the body (the Fick principle). **Formula citation still to verify** against an accessible textbook (none of the OpenStax books states it; checked 2026-11-19). This is the value that links the respiratory engine to the cardiac engine.

Reference values:

| Quantity | Value | Range | Ref | Quote anchor |
|---|---|---|---|---|
| Resting RR (adult) | 14 breaths/min | 12–18 | [OSX-22.3] | "A typical resting respiratory rate is about 14 breaths per minute." / "the normal respiratory rate is similar to that of adults, 12 to 18 breaths per minute" |
| Resting VT | 500 mL | — | [OSX-22.3] | "Tidal volume (TV) is the amount of air that normally enters the lungs during quiet breathing, which is about 500 milliliters." |
| VO2, sitting at rest | 0.34 L/min | — | [CP-7.8] | "Sitting at rest | 120 | 0.34" |
| VO2, running cross-country | 2.12 L/min | — | [CP-7.8] | "Running cross-country | 740 | 2.12" |
| (not used) VO2, walking 5 km/h | 0.80 L/min | — | [CP-7.8] | "Walking (5 km/h) | 280 | 0.80" — walking stays out until cardiac values are sourced |

Scenario results:

| Scenario | RR | VT | VE (derived) | T_breath | VO2 | O2 extraction (derived) |
|---|---|---|---|---|---|---|
| rest | 14 | 500 mL | 7.0 L/min | 4.29 s | 0.34 L/min | 0.34 / 5.25 → 64.8 mL/L |
| running | **source pending** | **source pending** | — | — | 2.12 L/min | 2.12 / 19.5 → 108.7 mL/L |

Caveats: VO2 values describe a 76-kg male (College Physics), cardiac values a 70-kg individual (A&P); the derived extraction therefore mixes two reference bodies and is shown as illustrative. "Rest" uses the *sitting at rest* row (same table as the running row), not the basal metabolic rate (250 mL/min, lying, fasted).

### Running breathing values — search log (M2)
OpenStax A&P §22.6 describes exercise hyperpnea only qualitatively; Biology 2e gives 12–15 breaths/min at rest only. The *Open Textbook of Exercise Physiology* (MacIntosh, LibreTexts) was found but could not be opened from the dev environment (med.libretexts.org blocked), so no value was verified. The engine reports `missing: ['breathingRate','tidalVolume']` for running; the UI shows "source pending" and does not animate breathing at an invented rate.

### Animation (M2)
- Lungs expand and relax once per breath cycle `T_breath` from the engine (rest 4.29 s). The amplitude is schematic (not to scale) and labelled as such. With no sourced RR (running) the lungs are shown still, with a note.
- The blood path's lung step now points at the modelled right lung, where the particles change from oxygen-poor to oxygen-rich.

## Out of scope (later milestones)
Regional blood-flow distribution and exercise across systems (M3). Each needs its own cited reference rows here before implementation.
