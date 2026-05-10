/** Mirrors backend: 1 estimated second ≈ 1 credit (min 5). No premium markup — same quality for everyone. */

export function estimateSpeechSeconds(text: string, speed: number): number {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const safeSpeed = Math.min(Math.max(speed || 1, 0.7), 1.2);
  const rawSeconds = Math.max(3, Math.min(240, Math.ceil(words * 0.52 + trimmed.length * 0.02)));
  return Math.ceil(rawSeconds / safeSpeed);
}

export function computeGenerationCreditsEstimate(text: string, _voiceId: string, speed: number): number {
  const seconds = estimateSpeechSeconds(text, speed);
  return Math.max(5, seconds);
}

/** Human-friendly narration time for UI (no raw “credits”). */
export function formatNarrationSeconds(totalSeconds: number): { seconds: number; minutes: number; label: string } {
  const s = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  if (minutes <= 0) {
    return { seconds: s, minutes: 0, label: `${s} sec` };
  }
  if (seconds === 0) {
    return { seconds: 0, minutes, label: `${minutes} min` };
  }
  return { seconds, minutes, label: `${minutes} min ${seconds} sec` };
}
