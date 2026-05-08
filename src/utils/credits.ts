const premiumVoiceSet = new Set(
  (import.meta.env.VITE_PREMIUM_VOICE_IDS ?? "")
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean)
);

/** Mirrors backend heuristic for MVP cost preview */

export function estimateSpeechSeconds(text: string, speed: number): number {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const safeSpeed = Math.min(Math.max(speed || 1, 0.7), 1.2);
  const rawSeconds = Math.max(3, Math.min(240, Math.ceil(words * 0.52 + trimmed.length * 0.02)));
  return Math.ceil(rawSeconds / safeSpeed);
}

export function getVoiceCreditMultiplier(voiceId: string): number {
  return premiumVoiceSet.has(voiceId) ? 1.35 : 1;
}

export function computeGenerationCreditsEstimate(text: string, voiceId: string, speed: number): number {
  const seconds = estimateSpeechSeconds(text, speed);
  const mult = getVoiceCreditMultiplier(voiceId);
  return Math.max(5, Math.ceil(seconds * mult));
}
