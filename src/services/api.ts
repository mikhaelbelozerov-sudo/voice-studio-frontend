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

export interface Generation {
  id: number | string;
  text: string | null;
  voice_id: string | null;
  audio_url: string | null;
  created_at: string;
  file_deleted: boolean | null;
}

export type UserTier = "free" | "pro" | "premium";

export interface GenerationsResponse {
  generations: Generation[];
  userTier: UserTier;
}

export interface UserProfile {
  subscription_tier: UserTier;
  subscription_expires_at: string | null;
  stars_minutes: number;
}

export const getVoices = async () => {
  const { data } = await api.get<VoicesResponse>("/voices");
  return data;
};

export const generateAudio = async (params: {
  text: string;
  voiceId: string;
  speed: number;
  pitch: number;
  telegramId: number;
}) => {
  const response = await api.post('/generate', params);
  return response.data;
};

export const fetchGenerations = async (telegramId: number, limit = 20, offset = 0) => {
  const { data } = await api.get<GenerationsResponse>("/generations", {
    params: {
      telegramId,
      limit,
      offset
    }
  });

  return data;
};

export const getUserProfile = async (telegramId: number) => {
  const { data } = await api.get<UserProfile>("/user/profile", {
    params: { telegramId }
  });
  return data;
};
