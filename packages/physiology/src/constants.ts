import type { RefValue } from './types';

// Every number here is copied from docs/PHYSIOLOGY_MODEL.md with its reference and quote anchor.
// Do not add a constant without a matching row there.

export const REST_HR: RefValue = {
  value: 75, unit: 'bpm', ref: 'OSX-19.4', range: [60, 100],
  quote: 'An average resting HR would be approximately 75 bpm but could range from 60–100',
};
export const REST_SV: RefValue = {
  value: 70, unit: 'mL', ref: 'OSX-19.4', range: [55, 100],
  quote: 'A mean SV for a resting 70-kg (150-lb) individual would be approximately 70 mL.',
};
export const REST_CO_BOOK: RefValue = {
  value: 5.25, unit: 'L/min', ref: 'OSX-19.4', range: [4.0, 8.0],
  quote: 'the mean CO is 5.25 L/min, with a range of 4.0–8.0 L/min',
};
export const EXERCISE_HR: RefValue = {
  value: 150, unit: 'bpm', ref: 'OSX-19.4',
  quote: 'In healthy young individuals, HR may increase to 150 bpm during exercise.',
};
export const EXERCISE_SV: RefValue = {
  value: 130, unit: 'mL', ref: 'OSX-19.4',
  quote: 'SV can also increase from 70 to approximately 130 mL',
};
export const EXERCISE_CO_BOOK: RefValue = {
  value: 19.5, unit: 'L/min', ref: 'OSX-19.4',
  quote: 'This would increase CO to approximately 19.5 L/min',
};

// ---- Respiratory (Milestone 2) ----
export const REST_RR: RefValue = {
  value: 14, unit: 'breaths/min', ref: 'OSX-22.3', range: [12, 18],
  quote: 'A typical resting respiratory rate is about 14 breaths per minute.',
};
export const REST_VT: RefValue = {
  value: 500, unit: 'mL', ref: 'OSX-22.3',
  quote: 'Tidal volume (TV) is the amount of air that normally enters the lungs during quiet breathing, which is about 500 milliliters.',
};
export const REST_VO2: RefValue = {
  value: 0.34, unit: 'L/min', ref: 'CP-7.8',
  quote: 'Sitting at rest | 120 | 0.34',
};
export const RUNNING_VO2: RefValue = {
  value: 2.12, unit: 'L/min', ref: 'CP-7.8',
  quote: 'Running cross-country | 740 | 2.12',
};
