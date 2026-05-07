export const TTS_LANGUAGE_CODES = [
  "ru",
  "en",
  "es",
  "fr",
  "de",
  "it",
  "ja",
  "zh",
  "ko",
  "ar",
  "hi",
  "tr"
] as const;

export type TtsLanguageCode = (typeof TTS_LANGUAGE_CODES)[number];

export const TTS_LANGUAGE_OPTIONS: Array<{ code: TtsLanguageCode; label: string }> = [
  { code: "en", label: "English 🇬🇧" },
  { code: "ru", label: "Русский 🇷🇺" },
  { code: "es", label: "Español 🇪🇸" },
  { code: "fr", label: "Français 🇫🇷" },
  { code: "de", label: "Deutsch 🇩🇪" },
  { code: "it", label: "Italiano 🇮🇹" },
  { code: "ja", label: "日本語 🇯🇵" },
  { code: "zh", label: "中文 🇨🇳" },
  { code: "ko", label: "한국어 🇰🇷" },
  { code: "ar", label: "العربية 🇸🇦" },
  { code: "hi", label: "हिन्दी 🇮🇳" },
  { code: "tr", label: "Türkçe 🇹🇷" }
];

export const mapInterfaceLanguageToTtsCode = (lng: string): TtsLanguageCode => {
  if (lng.startsWith("ru")) return "ru";
  if (lng.startsWith("es")) return "es";
  if (lng.startsWith("ar")) return "ar";
  if (lng.startsWith("hi")) return "hi";
  return "en";
};

