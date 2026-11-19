import type { ReferenceId } from './types';

export interface Reference {
  readonly id: ReferenceId;
  readonly citation: string;
  readonly url: string;
  readonly license: string;
}

export const REFERENCES: Readonly<Record<ReferenceId, Reference>> = {
  'OSX-19.4': {
    id: 'OSX-19.4',
    citation: 'Betts J.G. et al. Anatomy and Physiology 2e, §19.4 Cardiac Physiology. OpenStax, 2022.',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/19-4-cardiac-physiology',
    license: 'CC BY-NC-SA 4.0 (cited for numeric facts only; no text reused)',
  },
  'OSX-22.3': {
    id: 'OSX-22.3',
    citation: 'Betts J.G. et al. Anatomy and Physiology 2e, §22.3 The Process of Breathing. OpenStax, 2022.',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/22-3-the-process-of-breathing',
    license: 'CC BY-NC-SA 4.0 (cited for numeric facts only; no text reused)',
  },
  'CP-7.8': {
    id: 'CP-7.8',
    citation: 'Urone P.P., Hinrichs R. et al. College Physics 2e, §7.8 Work, Energy, and Power in Humans, table "Energy and Oxygen Consumption Rates" (76-kg male). OpenStax, 2022.',
    url: 'https://openstax.org/books/college-physics-2e/pages/7-8-work-energy-and-power-in-humans',
    license: 'CC BY-NC-SA 4.0 (cited for numeric facts only; no text reused)',
  },
};
