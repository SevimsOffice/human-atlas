import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import tr from './locales/tr.json';
import en from './locales/en.json';

export const LANG_KEY = 'atlas.lang';
const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(LANG_KEY) : null;

void i18n.use(initReactI18next).init({
  resources: { tr: { translation: tr }, en: { translation: en } },
  lng: saved === 'en' ? 'en' : 'tr', // default TR
  fallbackLng: 'tr',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (l) => {
  document.documentElement.lang = l;
  localStorage.setItem(LANG_KEY, l);
});
document.documentElement.lang = i18n.language;

export default i18n;
