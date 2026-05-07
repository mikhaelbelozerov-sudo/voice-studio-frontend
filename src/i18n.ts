import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { APP_LANGUAGES } from "./constants/languages";

import enTranslation from "./locales/en/translation.json";
import ruTranslation from "./locales/ru/translation.json";
import esTranslation from "./locales/es/translation.json";
import hiTranslation from "./locales/hi/translation.json";
import idTranslation from "./locales/id/translation.json";
import arTranslation from "./locales/ar/translation.json";

export const LANGUAGE_STORAGE_KEY = "voice_studio_language";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ruTranslation },
      en: { translation: enTranslation },
      es: { translation: esTranslation },
      hi: { translation: hiTranslation },
      id: { translation: idTranslation },
      ar: { translation: arTranslation }
    },
    fallbackLng: "en",
    supportedLngs: [...APP_LANGUAGES],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"]
    }
  });

export default i18n;
