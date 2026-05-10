import axios from "axios";
import { VoicePresetId } from "../constants/voicePresets";
import { AppLanguage } from "../constants/languages";
import { TtsLanguageCode } from "../constants/ttsLanguages";

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
  languageCode: TtsLanguageCode;
}

export interface GenerateResponse {
  audioUrl?: string;
  url?: string;
  creditsCharged?: number;
  estimatedSeconds?: number;
  presetApplied?: string | null;
  hints?: { showSoftUpsell?: boolean };
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

export interface ReferralProfileSnapshot {
  referralMonthlyCap: number;
  referralRewardsUsedThisMonth: number;
  referralSlotsRemaining: number;
  referralInviterBonusSecondsEarned: number;
  referralPendingCount: number;
  referralActivatedAwaitingPayout: number;
  referralAtMonthlyLimit: boolean;
}

export interface UserProfile {
  subscription_tier: UserTier;
  subscription_expires_at: string | null;
  stars_minutes: number;
  credit_balance: number;
  credit_balance_approx_minutes: number;
  subscription_credit_balance: number;
  subscription_credit_approx_minutes: number;
  free_seconds_used: number;
  free_generation_count: number;
  free_seconds_cap: number;
  free_generation_cap: number;
  daily_gen_cap: number;
  daily_gen_used: number;
  language: AppLanguage;
  referral?: ReferralProfileSnapshot;
}

export type InvoiceProductType = "credits" | "subscription";

export interface CreateInvoiceRequest {
  telegramId: number;
  productType: InvoiceProductType;
  productValue: number;
  amountStars: number;
}

export interface CreateInvoiceResponse {
  payload: string;
  amountStars: number;
  invoiceLink: string;
}

export interface UpdateUserLanguageRequest {
  telegramId: number;
  language: AppLanguage;
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
  languageCode: TtsLanguageCode;
  telegramId: number;
  presetId?: VoicePresetId | null;
}) => {
  const normalizedPayload = {
    ...params,
    speed: Number(params.speed),
    pitch: Number(params.pitch),
    ...(params.presetId ? { presetId: params.presetId } : {})
  };
  console.log("[generateAudio] payload", normalizedPayload);
  const response = await api.post('/generate', normalizedPayload);
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

export const createInvoice = async (payload: CreateInvoiceRequest) => {
  const { data } = await api.post<CreateInvoiceResponse>("/create-invoice", payload);
  return data;
};

export const updateUserLanguage = async (payload: UpdateUserLanguageRequest) => {
  const { data } = await api.post<{ ok: boolean; language: AppLanguage }>("/user/language", payload);
  return data;
};

export type ClaimReferralRequest = {
  inviteeTelegramId: number;
  referrerTelegramId: number;
  clientFingerprint: string;
};

export type ClaimReferralResponse = {
  ok: boolean;
  alreadyClaimed?: boolean;
};

export const claimReferral = async (payload: ClaimReferralRequest) => {
  const { data } = await api.post<ClaimReferralResponse>("/referrals/claim", payload);
  return data;
};

export const ackReferralDownload = async (telegramId: number) => {
  await api.post("/referrals/download-ack", { telegramId });
};
