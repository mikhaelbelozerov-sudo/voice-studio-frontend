import axios from "axios";

const defaultBaseUrl = "http://localhost:3001/api";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || defaultBaseUrl,
  headers: {
    "Content-Type": "application/json"
  }
});

export interface Voice {
  voice_id: string;
  name: string;
  preview_url?: string;
}

export interface VoicesResponse {
  voices: Voice[];
}

export interface GenerateRequest {
  text: string;
  voiceId: string;
  speed: number;
  pitch: number;
}

export interface GenerateResponse {
  audioUrl?: string;
  url?: string;
}

export const getVoices = async () => {
  const { data } = await api.get<VoicesResponse>("/voices");
  return data;
};

export const generateAudio = async (payload: GenerateRequest) => {
  const { data } = await api.post<GenerateResponse>("/generate", payload);
  return data;
};
