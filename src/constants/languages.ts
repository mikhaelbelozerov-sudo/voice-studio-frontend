export const APP_LANGUAGES = ["en", "ru", "es", "hi", "id", "ar"] as const;

export type AppLanguage = (typeof APP_LANGUAGES)[number];

export const DATE_LOCALE_BY_LANGUAGE: Record<AppLanguage, string> = {
  en: "en-US",
  ru: "ru-RU",
  es: "es-ES",
  hi: "hi-IN",
  id: "id-ID",
  ar: "ar-SA"
};

