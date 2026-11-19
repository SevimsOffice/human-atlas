# Issue text for hubmapconsortium/ccf-releases

**Title:** Crosswalk maps `VH_M_left_anterior_descending_artery` / `VH_F_left_anterior_descending_artery` to a pulmonary artery branch (FMA:8636)

**Body:**

In the ASCT+B → 3D reference object crosswalk, the left anterior descending (coronary) artery nodes are mapped to a pulmonary artery term:

| File | Node | Label in crosswalk | ID |
|---|---|---|---|
| `v1.3/models/asct-b-3d-models-mapping.csv` | `VH_M_left_anterior_descending_artery` | Anterior descending branch of left pulmonary artery | FMA:8636 |
| `v1.4/models/asct-b-3d-models-crosswalk.csv` | `VH_M_left_anterior_descending_artery` | Anterior descending branch of left pulmonary artery | FMA:8636 |
| `v2.0/models/asct-b-3d-models-crosswalk.csv` | `VH_M_left_anterior_descending_artery`, `VH_F_left_anterior_descending_artery` | Anterior descending branch of left pulmonary artery | FMA:8636 |

The mesh sits in the `VH_M_cardiac_artery` group of `VH_M_Blood_Vasculature.glb` together with the left and right coronary arteries, and its sibling `VH_M_diagonal_branch_of_left_anterior_descending_artery` is correctly labelled "Diagonal branch of anterior descending branch of left coronary artery" (FMA:3860). So this node looks like the coronary LAD, not a pulmonary artery branch.

**Suggested mapping:** anterior interventricular branch of left coronary artery — FMA:3862, or Uberon `UBERON:8600102` "left anterior descending artery" (which carries `xref: FMA:3862`).

**Two smaller issues in the same files (IRI column doesn't match the ID column):**
- `VH_M_papillary_muscle_of_heart_anterolateral`: ID `FMA:7265`, IRI `http://purl.org/sig/ont/fma/fma72655`
- `VH_M_papillary_muscle_of_heart_posterior`: ID `FMA:7261`, IRI `http://purl.org/sig/ont/fma/fma72611`

(Present in v1.3 and still in v2.0.)

Thanks for the reference library — it's excellent to build on.
