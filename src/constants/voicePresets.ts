/** Match backend CREATOR_VOICE_PRESETS keys */

export type VoicePresetId =
  | "tiktok_story"
  | "youtube_documentary"
  | "luxury_ad"
  | "podcast"
  | "motivational"
  | "cinematic_trailer";

export type VoicePresetSettings = {
  speed: number;
  pitch: number;
};

/** Значения speed/pitch совпадают с voice-studio-backend CREATOR_VOICE_PRESETS */
export const VOICE_PRESET_SETTINGS: Record<VoicePresetId, VoicePresetSettings> = {
  tiktok_story: { speed: 1.08, pitch: 0.06 },
  youtube_documentary: { speed: 0.95, pitch: -0.04 },
  luxury_ad: { speed: 0.9, pitch: -0.08 },
  podcast: { speed: 1.0, pitch: 0.0 },
  motivational: { speed: 1.1, pitch: 0.12 },
  cinematic_trailer: { speed: 0.88, pitch: -0.12 }
};

export const VOICE_PRESET_OPTIONS: { id: VoicePresetId; labelKey: string }[] = [
  { id: "tiktok_story", labelKey: "presets.tiktokStory" },
  { id: "youtube_documentary", labelKey: "presets.youtubeDocumentary" },
  { id: "luxury_ad", labelKey: "presets.luxuryAd" },
  { id: "podcast", labelKey: "presets.podcast" },
  { id: "motivational", labelKey: "presets.motivational" },
  { id: "cinematic_trailer", labelKey: "presets.cinematicTrailer" }
];
