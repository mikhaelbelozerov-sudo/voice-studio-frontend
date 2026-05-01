import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import enTranslation from "./locales/en/translation.json";
import ruTranslation from "./locales/ru/translation.json";

export const LANGUAGE_STORAGE_KEY = "voice_studio_language";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ruTranslation },
      en: { translation: enTranslation }
    },
    fallbackLng: "ru",
    supportedLngs: ["ru", "en"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"]
    }
  });

export default i18n;
