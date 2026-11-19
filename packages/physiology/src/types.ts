/** A value taken from a cited reference. `ref` must exist in docs/PHYSIOLOGY_MODEL.md. */
export interface RefValue {
  readonly value: number;
  readonly unit: string;
  readonly ref: ReferenceId;
  /** Quote anchor in the reference, so a reviewer can find the sentence. */
  readonly quote: string;
  readonly range?: readonly [number, number];
}

/** A value computed by a named formula from other values. Never typed in by hand. */
export interface DerivedValue {
  readonly value: number;
  readonly unit: string;
  readonly formula: FormulaId;
}

export type ReferenceId = 'OSX-19.4' | 'OSX-22.3' | 'CP-7.8' | 'OSX-20.4' | 'LEE-2025';
export type FormulaId = 'CO=HR*SV' | 'T=60/HR' | 'VE=RR*VT' | 'Tb=60/RR' | 'avO2=VO2/CO' | 'VO2/kg=VO2/m' | 'VO2@70kg=VO2/kg*70' | 'flow=CO*share' | 'share=organ/total' | 'ratio=run/rest';
