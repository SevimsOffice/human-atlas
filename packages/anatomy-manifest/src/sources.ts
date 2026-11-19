/** Machine-readable copy of the rows in docs/SOURCES.md that the app credits. A test keeps them in sync. */
export interface SourceEntry {
  readonly id: string;
  readonly title: string;
  readonly kind: 'model' | 'ontology' | 'reference' | 'mapping';
  readonly url: string;
  readonly license: string;
  readonly licenseUrl: string;
  readonly attribution: string;
  readonly changes: string;
}

export const SOURCES: readonly SourceEntry[] = [
  {
    id: 'HRA-HEART-M', kind: 'model', title: '3D Reference Organ for Heart, Male v1.2 (HuBMAP Human Reference Atlas)',
    url: 'https://doi.org/10.48539/HBM373.VSTV.568', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    attribution: 'Kristen Browne; Heidi Schlehlein. 2022. 3D Reference Organ for Heart, Male v1.2. HuBMAP.',
    changes: 'Compressed with Meshopt (quantized geometry); materials replaced at runtime. Node names unchanged.',
  },
  {
    id: 'HRA-VASC-M', kind: 'model', title: '3D Reference Organ for Blood Vasculature, Male (HuBMAP Human Reference Atlas)',
    url: 'https://humanatlas.io/3d-reference-library', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    attribution: 'HuBMAP CCF 3D Reference Object Library — Kristen Browne, Heidi Schlehlein, Bruce W. Herr II, Ellen Quardokus, Andreas Bueckle, Katy Börner.',
    changes: 'Only the "blood vasculature of heart" subtree kept; compressed with Meshopt; materials replaced at runtime.',
  },
  {
    id: 'HRA-LUNG-M', kind: 'model', title: '3D Reference Organ for Lung, Male v1.2 (HuBMAP Human Reference Atlas)',
    url: 'https://doi.org/10.48539/HBM787.FWXN.723', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    attribution: 'Kristen Browne; Heidi Schlehlein. 2022. 3D Reference Organ for Lung, Male v1.2. HuBMAP.',
    changes: 'Compressed with Meshopt (quantized geometry); materials replaced at runtime; lungs scaled during the schematic breathing animation. Node names unchanged.',
  },
  {
    id: 'HRA-XWALK-1.3', kind: 'mapping', title: 'ASCT+B Tables to 3D Reference Object Library Mapping (HRA v1.3)',
    url: 'https://github.com/hubmapconsortium/ccf-releases/tree/main/v1.3/models', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    attribution: 'Ellen M. Quardokus; Heidi Schlehlein; Bruce Herr II; Katy Börner. HuBMAP.',
    changes: 'Four mappings corrected (left anterior descending artery; three lung airway rows), see overrides.json. Nodes without an ID matched to Uberon by exact label only.',
  },
  {
    id: 'UBERON', kind: 'ontology', title: 'Uberon multi-species anatomy ontology',
    url: 'https://obophenotype.github.io/uberon/', license: 'CC BY 3.0', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
    attribution: 'Mungall C.J. et al. Uberon, an integrative multi-species anatomy ontology. Genome Biology 13:R5 (2012).',
    changes: 'Subset extracted: IDs, labels, definitions, part_of for structures in the model.',
  },
  {
    id: 'OSX-AP2E', kind: 'reference', title: 'OpenStax Anatomy and Physiology 2e — §19.1, §19.4 (heart), §20.4 (blood-flow distribution), §22.1–22.3 (respiratory system)',
    url: 'https://openstax.org/details/books/anatomy-and-physiology-2e', license: 'CC BY-NC-SA 4.0 (cited for facts and numbers only; no text reused)',
    licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    attribution: 'Betts J.G., Young K.A., Wise J.A., et al. Anatomy and Physiology 2e. OpenStax, Rice University, 2022.',
    changes: 'None. Values cited in docs/PHYSIOLOGY_MODEL.md; texts in content/texts are our own wording.',
  },
  {
    id: 'OSX-CP2E', kind: 'reference', title: 'OpenStax College Physics 2e — §7.8 Work, Energy, and Power in Humans (oxygen consumption table)',
    url: 'https://openstax.org/details/books/college-physics-2e', license: 'CC BY-NC-SA 4.0 (cited for numbers only; no text reused)',
    licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    attribution: 'Urone P.P., Hinrichs R., et al. College Physics 2e. OpenStax, Rice University, 2022.',
    changes: 'None. Oxygen uptake at rest and running cited in docs/PHYSIOLOGY_MODEL.md.',
  },
];
