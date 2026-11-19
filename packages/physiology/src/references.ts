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
  'OSX-20.4': {
    id: 'OSX-20.4',
    citation: 'Betts J.G. et al. Anatomy and Physiology 2e, §20.4 Homeostatic Regulation of the Vascular System, table "Systemic Blood Flow During Rest, Mild Exercise, and Maximal Exercise in a Healthy Young Individual". OpenStax, 2022.',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/20-4-homeostatic-regulation-of-the-vascular-system',
    license: 'CC BY-NC-SA 4.0 (cited for numeric facts only; no text reused)',
  },
  'LEE-2025': {
    id: 'LEE-2025',
    citation: 'Lee S.H., Seo Y., Lee D.T. Ventilatory Responses to Progressive Treadmill Speeds in Women: A Comparative Analysis of Nasal, Oral, and Oronasal Breathing Conditions. Int J Environ Res Public Health 22(5):718, 2025. Table "Ventilatory responses across breathing conditions and speeds", oronasal, 9 km/h; 10 healthy recreationally active women, 24 ± 2 y.',
    url: 'https://doi.org/10.3390/ijerph22050718',
    license: 'CC BY 4.0 (peer-reviewed, open access; PMC12111123)',
  },
  'CP-7.8': {
    id: 'CP-7.8',
    citation: 'Urone P.P., Hinrichs R. et al. College Physics 2e, §7.8 Work, Energy, and Power in Humans, table "Energy and Oxygen Consumption Rates" (76-kg male). OpenStax, 2022.',
    url: 'https://openstax.org/books/college-physics-2e/pages/7-8-work-energy-and-power-in-humans',
    license: 'CC BY-NC-SA 4.0 (cited for numeric facts only; no text reused)',
  },
};
