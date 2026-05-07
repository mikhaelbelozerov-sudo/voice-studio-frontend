export const TTS_LANGUAGE_CODES = [
  "en",
  "ru",
  "es",
  "hi",
  "id",
  "ar",
  "de",
  "fr",
  "it",
  "ja",
  "zh",
  "ko",
  "tr",
  "uk",
  "pl",
  "pt",
  "el",
  "he",
  "vi"
] as const;

export type TtsLanguageCode = (typeof TTS_LANGUAGE_CODES)[number];

export const TTS_LANGUAGE_OPTIONS: Array<{ code: TtsLanguageCode; label: string }> = [
  { code: "en", label: "English 🇬🇧" },
  { code: "ru", label: "Русский 🇷🇺" },
  { code: "es", label: "Español 🇪🇸" },
  { code: "hi", label: "हिन्दी 🇮🇳" },
  { code: "id", label: "Bahasa Indonesia 🇮🇩" },
  { code: "ar", label: "العربية 🇸🇦" },
  { code: "de", label: "Deutsch 🇩🇪" },
  { code: "fr", label: "Français 🇫🇷" },
  { code: "it", label: "Italiano 🇮🇹" },
  { code: "ja", label: "日本語 🇯🇵" },
  { code: "zh", label: "中文 🇨🇳" },
  { code: "ko", label: "한국어 🇰🇷" },
  { code: "tr", label: "Türkçe 🇹🇷" },
  { code: "uk", label: "Українська 🇺🇦" },
  { code: "pl", label: "Polski 🇵🇱" },
  { code: "pt", label: "Português 🇵🇹" },
  { code: "el", label: "Ελληνικά 🇬🇷" },
  { code: "he", label: "עברית 🇮🇱" },
  { code: "vi", label: "Tiếng Việt 🇻🇳" }
];

export const mapInterfaceLanguageToTtsCode = (lng: string): TtsLanguageCode => {
  if (lng.startsWith("ru")) return "ru";
  if (lng.startsWith("es")) return "es";
  if (lng.startsWith("id") || lng.startsWith("in")) return "id";
  if (lng.startsWith("ar")) return "ar";
  if (lng.startsWith("hi")) return "hi";
  if (lng.startsWith("tr")) return "tr";
  if (lng.startsWith("uk")) return "uk";
  if (lng.startsWith("pl")) return "pl";
  if (lng.startsWith("pt")) return "pt";
  if (lng.startsWith("el")) return "el";
  if (lng.startsWith("he")) return "he";
  if (lng.startsWith("vi")) return "vi";
  return "en";
};

