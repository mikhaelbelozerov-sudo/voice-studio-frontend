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

/** ElevenLabs API typos / short forms → dictionary key. */
const TRAIT_KEY_ALIASES: Record<string, string> = {
  knowledgable: "knowledgeable"
};

/** Keep multi-word traits as one chip (order: longest first). */
const MULTI_WORD_TRAIT_PHRASES = [
  "Social Media Creator",
  "Captivating Storyteller",
  "Captivating storyteller",
  "Down-to-Earth",
  "Well-rounded",
  "Middle Aged",
  "Middle-aged"
] as const;

const phrasePattern = (phrase: string) =>
  new RegExp(phrase.replace(/[-]/g, "[- ]"), "i");

const splitTitleCaseChunks = (segment: string): string[] => {
  const chunks = segment
    .split(/\s+(?=[A-Z][a-z])/)
    .map((part) => part.trim())
    .filter(Boolean);
  return chunks.length > 1 ? chunks : [segment];
};

const extractPhrasesFromSegment = (segment: string): string[] => {
  const result: string[] = [];
  let rest = segment.trim();

  while (rest.length > 0) {
    let matchedPhrase: string | null = null;
    let matchIndex = -1;

    for (const phrase of MULTI_WORD_TRAIT_PHRASES) {
      const match = rest.match(phrasePattern(phrase));
      if (!match || match.index === undefined) {
        continue;
      }
      if (matchIndex === -1 || match.index < matchIndex) {
        matchIndex = match.index;
        matchedPhrase = match[0];
      }
    }

    if (matchedPhrase && matchIndex >= 0) {
      const before = rest.slice(0, matchIndex).trim();
      if (before) {
        result.push(...splitTitleCaseChunks(before));
      }
      result.push(matchedPhrase);
      rest = rest.slice(matchIndex + matchedPhrase.length).trim();
      continue;
    }

    result.push(...splitTitleCaseChunks(rest));
    break;
  }

  return result.filter(Boolean);
};

const splitTraits = (traitsRaw: string): string[] =>
  traitsRaw
    .split(/\s*,\s*|\s+and\s+/i)
    .flatMap((part) => extractPhrasesFromSegment(part.trim()))
    .filter(Boolean);

const lookupTrait = (key: string, labels: VoiceTraitLabelMap): string | undefined => {
  if (!key) {
    return undefined;
  }
  const resolved = TRAIT_KEY_ALIASES[key] ?? key;
  return labels[resolved] ?? labels[key];
};

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
  if (words.length > 1 && traitToI18nKey(trimmed) !== "socialMediaCreator") {
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

const canonicalizeEnglishTrait = (trait: string): string => {
  const key = traitToI18nKey(trait);
  if (key === "socialMediaCreator") {
    return "Social Media Creator";
  }
  return trait;
};

export type VoiceDisplayParts = {
  speaker: string;
  traits: string[];
};

const parseVoiceNameParts = (name: string): { speaker: string; traitsRaw: string } | null => {
  const sepMatch = name.match(/\s[-–—]\s/);
  if (!sepMatch || sepMatch.index == null) {
    return null;
  }
  const sep = sepMatch.index;
  const sepLen = sepMatch[0].length;
  return {
    speaker: name.slice(0, sep).trim(),
    traitsRaw: name.slice(sep + sepLen).trim()
  };
};

/** Speaker name + localized trait chips for UI. */
export const parseVoiceDisplayName = (name: string, _t: TFunction, language: string): VoiceDisplayParts => {
  const trimmed = name.trim();
  if (!trimmed) {
    return { speaker: "", traits: [] };
  }

  const parsed = parseVoiceNameParts(trimmed);
  if (!parsed) {
    return { speaker: trimmed, traits: [] };
  }

  const { speaker, traitsRaw } = parsed;
  if (!traitsRaw) {
    return { speaker, traits: [] };
  }

  const lang = normalizeAppLanguage(language);
  const traits = splitTraits(traitsRaw);
  if (lang === "en") {
    return { speaker, traits: traits.map(canonicalizeEnglishTrait) };
  }

  const labels = VOICE_TRAIT_LABELS[lang];
  return { speaker, traits: traits.map((trait) => localizeTrait(trait, labels)) };
};

/**
 * Localizes ElevenLabs voice labels like "Roger - Laid-Back, Casual, Resonant".
 * Keeps the speaker name; translates comma-separated traits when keys exist.
 */
export const formatLocalizedVoiceName = (name: string, t: TFunction, language: string): string => {
  const { speaker, traits } = parseVoiceDisplayName(name, t, language);
  if (!traits.length) {
    return speaker || name;
  }

  const lang = normalizeAppLanguage(language);
  if (lang === "en") {
    return name.trim();
  }

  return `${speaker} — ${traits.join(", ")}`;
};
