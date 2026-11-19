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
};
