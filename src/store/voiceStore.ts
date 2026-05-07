import { create } from "zustand";
import { TtsLanguageCode } from "../constants/ttsLanguages";

interface VoiceState {
  selectedVoiceId: string | null;
  text: string;
  speed: number;
  pitch: number;
  languageCode: TtsLanguageCode;
  setSelectedVoiceId: (voiceId: string) => void;
  setText: (text: string) => void;
  setSpeed: (speed: number) => void;
  setPitch: (pitch: number) => void;
  setLanguageCode: (languageCode: TtsLanguageCode) => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  selectedVoiceId: null,
  text: "",
  speed: 1.0,
  pitch: 0,
  languageCode: "en",
  setSelectedVoiceId: (selectedVoiceId) => set({ selectedVoiceId }),
  setText: (text) => set({ text }),
  setSpeed: (speed) => set({ speed: Math.min(Math.max(Number(speed), 0.7), 1.2) }),
  setPitch: (pitch) => set({ pitch: Math.min(Math.max(Number(pitch), -1), 1) }),
  setLanguageCode: (languageCode) => set({ languageCode })
}));
