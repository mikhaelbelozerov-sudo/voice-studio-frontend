/** Match backend CREATOR_VOICE_PRESETS keys */

export type VoicePresetId =
  | "tiktok_story"
  | "youtube_documentary"
  | "luxury_ad"
  | "podcast"
  | "motivational"
  | "cinematic_trailer";

export const VOICE_PRESET_OPTIONS: { id: VoicePresetId; labelKey: string }[] = [
  { id: "tiktok_story", labelKey: "presets.tiktokStory" },
  { id: "youtube_documentary", labelKey: "presets.youtubeDocumentary" },
  { id: "luxury_ad", labelKey: "presets.luxuryAd" },
  { id: "podcast", labelKey: "presets.podcast" },
  { id: "motivational", labelKey: "presets.motivational" },
  { id: "cinematic_trailer", labelKey: "presets.cinematicTrailer" }
];
