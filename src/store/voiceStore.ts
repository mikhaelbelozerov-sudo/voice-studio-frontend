import { create } from "zustand";

interface VoiceState {
  selectedVoiceId: string | null;
  text: string;
  speed: number;
  pitch: number;
  setSelectedVoiceId: (voiceId: string) => void;
  setText: (text: string) => void;
  setSpeed: (speed: number) => void;
  setPitch: (pitch: number) => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  selectedVoiceId: null,
  text: "",
  speed: 1,
  pitch: 0,
  setSelectedVoiceId: (selectedVoiceId) => set({ selectedVoiceId }),
  setText: (text) => set({ text }),
  setSpeed: (speed) => set({ speed }),
  setPitch: (pitch) => set({ pitch })
}));
