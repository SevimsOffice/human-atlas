# Asset & content register (SOURCES)

Every shipped or downloaded asset gets one row **before** it is used. The in-app "Sources & credits" page is generated from `packages/anatomy-manifest` + this register.

| ID | Asset | Type | Source URL | License | Attribution / citation | Changes made | Used in | Status |
|---|---|---|---|---|---|---|---|---|
| HRA-HEART-M | VH_M_Heart.glb (Heart, Male v1.2) | 3D model (GLB) | https://cdn.humanatlas.io/hra-releases/v1.3/models/VH_M_Heart.glb (mirror: github.com/hubmapconsortium/ccf-releases v1.3/models) | CC BY 4.0 | Kristen Browne; Heidi Schlehlein. 2022. 3D Reference Organ for Heart, Male v1.2. HuBMAP. doi:10.48539/HBM373.VSTV.568 | Spike only: materials replaced at runtime. (M1: Draco/Meshopt compression to be recorded here) | spikes/hubmap-heart | spike |
| HRA-XWALK-1.3 | asct-b-3d-models-mapping.csv | Mapping table | github.com/hubmapconsortium/ccf-releases v1.3/models | CC BY 4.0 (HRA release) | Quardokus, Schlehlein, Herr, Börner. ASCT+B Tables to 3D Reference Object Library Mapping. HuBMAP. | none | scripts (M1 manifest) | downloaded |
| OSX-AP2E-19.4 | OpenStax A&P 2e §19.4 Cardiac Physiology (numeric values only) | Reference values | https://openstax.org/books/anatomy-and-physiology-2e/pages/19-4-cardiac-physiology | CC BY-NC-SA 4.0 (values are cited facts, no text reused) | Betts, J. G. et al. Anatomy and Physiology 2e. OpenStax, 2022. | none | docs/PHYSIOLOGY_MODEL.md | cited |

## Template row
| ID | Asset | Type | Source URL | License | Attribution / citation | Changes made | Used in | Status |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | | |

Status values: `spike` · `downloaded` · `cited` · `shipped` · `removed`. Share-alike or NC assets must say so in the License column in **bold**.
