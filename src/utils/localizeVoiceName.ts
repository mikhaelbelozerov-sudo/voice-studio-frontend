import { TFunction } from "i18next";
import { AppLanguage, APP_LANGUAGES } from "../constants/languages";

const normalizeAppLanguage = (language: string): AppLanguage => {
  const base = language.split("-")[0]?.toLowerCase() ?? "en";
  return (APP_LANGUAGES as readonly string[]).includes(base) ? (base as AppLanguage) : "en";
};

/** Maps ElevenLabs trait label to `voice.traitLabels.*` i18n key. */
export const traitToI18nKey = (trait: string): string => {
  const parts = trait.trim().split(/[\s-]+/).filter(Boolean);
  if (parts.length === 0) {
    return "";
  }
  return parts
    .map((part, index) => {
      const lower = part.toLowerCase();
      if (index === 0) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
};

/**
 * Localizes ElevenLabs voice labels like "Roger - Laid-Back, Casual, Resonant".
 * Keeps the speaker name; translates comma-separated traits when keys exist.
 */
export const formatLocalizedVoiceName = (name: string, t: TFunction, language: string): string => {
  if (!name.trim()) {
    return name;
  }

  const lang = normalizeAppLanguage(language);
  const sep = name.indexOf(" - ");
  if (sep === -1) {
    return name;
  }

  const speaker = name.slice(0, sep).trim();
  const traitsRaw = name.slice(sep + 3).trim();
  if (!traitsRaw) {
    return speaker;
  }

  if (lang === "en") {
    return name;
  }

  const traits = traitsRaw.split(",").map((part) => part.trim()).filter(Boolean);
  const localizedTraits = traits.map((trait) => {
    const key = traitToI18nKey(trait);
    if (!key) {
      return trait;
    }
    return t(`voice.traitLabels.${key}`, { defaultValue: trait });
  });

  return `${speaker} — ${localizedTraits.join(", ")}`;
};
