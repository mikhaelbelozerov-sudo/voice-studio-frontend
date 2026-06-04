import { TFunction } from "i18next";
import { AppLanguage, APP_LANGUAGES } from "../constants/languages";
import { VOICE_TRAIT_LABELS, VoiceTraitLabelMap } from "../constants/voiceTraitLabels";

const normalizeAppLanguage = (language: string): AppLanguage => {
  const base = language.split("-")[0]?.toLowerCase() ?? "en";
  return (APP_LANGUAGES as readonly string[]).includes(base) ? (base as AppLanguage) : "en";
};

/** Maps ElevenLabs trait label to dictionary key (camelCase). */
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

const splitTraits = (traitsRaw: string): string[] =>
  traitsRaw
    .split(/\s*,\s*|\s+and\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);

const lookupTrait = (key: string, labels: VoiceTraitLabelMap): string | undefined =>
  key ? labels[key] : undefined;

const localizeTrait = (trait: string, labels: VoiceTraitLabelMap): string => {
  const trimmed = trait.trim();
  if (!trimmed) {
    return trait;
  }

  const phraseKey = traitToI18nKey(trimmed);
  const phrase = lookupTrait(phraseKey, labels);
  if (phrase) {
    return phrase;
  }

  const words = trimmed.split(/[\s-]+/).filter(Boolean);
  if (words.length > 1) {
    const translated = words.map((word) => {
      const wordKey = traitToI18nKey(word);
      return lookupTrait(wordKey, labels) ?? word;
    });
    if (translated.some((value, index) => value !== words[index])) {
      return translated.join(" ");
    }
  }

  return trimmed;
};

/**
 * Localizes ElevenLabs voice labels like "Roger - Laid-Back, Casual, Resonant".
 * Keeps the speaker name; translates comma-separated traits when keys exist.
 */
export const formatLocalizedVoiceName = (name: string, _t: TFunction, language: string): string => {
  if (!name.trim()) {
    return name;
  }

  const lang = normalizeAppLanguage(language);
  const sepMatch = name.match(/\s[-–—]\s/);
  if (!sepMatch || sepMatch.index == null) {
    return name;
  }

  const sep = sepMatch.index;
  const sepLen = sepMatch[0].length;
  const speaker = name.slice(0, sep).trim();
  const traitsRaw = name.slice(sep + sepLen).trim();
  if (!traitsRaw) {
    return speaker;
  }

  if (lang === "en") {
    return name;
  }

  const labels = VOICE_TRAIT_LABELS[lang];
  const localizedTraits = splitTraits(traitsRaw).map((trait) => localizeTrait(trait, labels));

  return `${speaker} — ${localizedTraits.join(", ")}`;
};
