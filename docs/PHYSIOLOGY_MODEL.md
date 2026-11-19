# Physiology model (v3 — Milestones 1–3: heart, lungs, exercise across systems)

The engine (`packages/physiology`) is a pure, deterministic function of a scenario: `compute(scenario) → state`. Every constant below has a reference ID; the code stores the ID next to the value and tests assert both. Values marked **derived** are computed by a stated formula, never typed in.

## References
- **[OSX-19.1]** Betts J.G. et al., *Anatomy and Physiology 2e*, OpenStax 2022, §19.1 "Heart Anatomy" (module m46676). CC BY-NC-SA 4.0. Used for the order of the blood path and which structures carry oxygen-poor/oxygen-rich blood (content/blood-path.json) and the facts in content/texts.
- **[OSX-19.4]** Betts J.G. et al., *Anatomy and Physiology 2e*, OpenStax 2022, §19.4 "Cardiac Physiology" (module m46672). CC BY-NC-SA 4.0. Values verified from the CNXML source on 2026-11-18.

- **[OSX-22.3]** Betts J.G. et al., *Anatomy and Physiology 2e*, OpenStax 2022, §22.3 "The Process of Breathing" (module m46549). CC BY-NC-SA 4.0. Also used for texts: §22.1 (m46548) [OSX-22.1], §22.2 (m46551) [OSX-22.2].
- **[OSX-20.4]** Betts J.G. et al., *Anatomy and Physiology 2e*, OpenStax 2022, §20.4 "Homeostatic Regulation of the Vascular System" (module m46603), table "Systemic Blood Flow During Rest, Mild Exercise, and Maximal Exercise in a Healthy Young Individual". CC BY-NC-SA 4.0.
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
- `O2 extraction = VO2(70 kg) / CO × 1000` — mass balance of oxygen across the body, labelled in the app **"derived (Fick principle)"** (owner decision 2026-11-19). A textbook statement of the formula is still to be cited (none of the OpenStax books states it). This is the value that links the respiratory engine to the cardiac engine.
- `VO2/kg = VO2 × 1000 / 76 kg` and `VO2(70 kg) = VO2/kg × 70 kg / 1000` — normalisation to the cardiac reference body (owner decision 2026-11-19, M3). The cited VO2 is kept and shown as well.

Reference values:

| Quantity | Value | Range | Ref | Quote anchor |
|---|---|---|---|---|
| Resting RR (adult) | 14 breaths/min | 12–18 | [OSX-22.3] | "A typical resting respiratory rate is about 14 breaths per minute." / "the normal respiratory rate is similar to that of adults, 12 to 18 breaths per minute" |
| Resting VT | 500 mL | — | [OSX-22.3] | "Tidal volume (TV) is the amount of air that normally enters the lungs during quiet breathing, which is about 500 milliliters." |
| VO2, sitting at rest | 0.34 L/min | — | [CP-7.8] | "Sitting at rest | 120 | 0.34" |
| VO2, running cross-country | 2.12 L/min | — | [CP-7.8] | "Running cross-country | 740 | 2.12" |
| Reference body of the VO2 table | 76 kg | — | [CP-7.8] | "Energy and Oxygen Consumption Rates for a 76-kg male with typical metabolic functions" |
| Reference body of the cardiac values | 70 kg | — | [OSX-19.4] | "A mean SV for a resting 70-kg (150-lb) individual would be approximately 70 mL." |
| (not used) VO2, walking 5 km/h | 0.80 L/min | — | [CP-7.8] | "Walking (5 km/h) | 280 | 0.80" — walking stays out until cardiac values are sourced |

Scenario results:

| Scenario | RR | VT | VE (derived) | T_breath | VO2 cited (76 kg) | VO2/kg (derived) | VO2 at 70 kg (derived) | O2 extraction (derived, Fick) |
|---|---|---|---|---|---|---|---|---|
| rest | 14 | 500 mL | 7.0 L/min | 4.29 s | 0.34 L/min | 4.47 mL/kg/min | 0.313 L/min | 0.313 / 5.25 → 59.6 mL/L |
| running | **source pending** | **source pending** | — | — | 2.12 L/min | 27.89 mL/kg/min | 1.953 L/min | 1.953 / 19.5 → 100.1 mL/L |

Caveats: VO2 is cited for a 76-kg male (College Physics) and is scaled linearly per kg to the 70-kg body of the cardiac values (A&P). Linear per-kg scaling is itself an assumption, stated in the app and on the Sources page. "Rest" uses the *sitting at rest* row (same table as the running row), not the basal metabolic rate (250 mL/min, lying, fasted).

### Running breathing values — search log (M2)
OpenStax A&P §22.6 describes exercise hyperpnea only qualitatively; Biology 2e gives 12–15 breaths/min at rest only. The *Open Textbook of Exercise Physiology* (MacIntosh, LibreTexts) was found but could not be opened from the dev environment (med.libretexts.org blocked), so no value was verified. The engine reports `missing: ['breathingRate','tidalVolume']` for running; the UI shows "source pending" and does not animate breathing at an invented rate.

### Animation (M2)
- Lungs expand and relax once per breath cycle `T_breath` from the engine (rest 4.29 s). The amplitude is schematic (not to scale) and labelled as such. With no sourced RR (running) the lungs are shown still, with a note.
- The blood path's lung step now points at the modelled right lung, where the particles change from oxygen-poor to oxygen-rich.

## Exercise across systems (M3)

### Blood-flow distribution — [OSX-20.4]

| Organ | Rest (mL/min) | Mild exercise | Maximal exercise | Quote anchor (row as it reads) |
|---|---|---|---|---|
| Skeletal muscle | 1200 | 4500 | 12,500 | "Skeletal muscle | 1200 | 4500 | 12,500" |
| Heart | 250 | 350 | 750 | "Heart | 250 | 350 | 750" |
| Brain | 750 | 750 | 750 | "Brain | 750 | 750 | 750" |
| Integument | 500 | 1500 | 1900 | "Integument | 500 | 1500 | 1900" |
| Kidney | 1100 | 900 | 600 | "Kidney | 1100 | 900 | 600" |
| Gastrointestinal | 1400 | 1100 | 600 | "Gastrointestinal | 1400 | 1100 | 600" |
| Others (liver, spleen) | 600 | 400 | 400 | "Others (i.e., liver, spleen) | 600 | 400 | 400" |
| Total | 5800 | 9500 | 17,500 | "Total | 5800 | 9500 | 17,500" |

Formulas: `share = organ / column total` and `organ flow = engine CO × share` (both derived). The table's totals (5.8 / 17.5 L/min) differ from the engine's CO (5.25 / 19.5 L/min, §19.4), so the engine uses each organ's **share** of the column and applies it to its own CO; the cited mL/min are shown alongside.

Scenario → column: rest → "Resting"; running (HR 150) → "Maximal exercise", the closest column for vigorous exercise (the table has no running column; "mild" totals 9.5 L/min, far below 19.5). This mapping is an approximation and is stated in the UI.

| Organ | Rest share → flow | Running share → flow |
|---|---|---|
| Skeletal muscle | 0.207 → 1.09 L/min | 0.714 → 13.93 L/min |

### Rest → running comparison (all derived from engine values)
`ratio = running / rest`: HR ×2.0, SV ×1.9, CO ×3.7, VO2 (70 kg) ×6.2, O2 extraction ×1.7, skeletal-muscle flow ×12.8.

### Not modelled in M3
Muscle meshes (no HRA skeletal-muscle model; M4 source search), muscle O2 use per organ during exercise (no cited table), breathing values during running (source pending).

## Out of scope (later milestones)
Regional blood-flow distribution and exercise across systems (M3). Each needs its own cited reference rows here before implementation.
