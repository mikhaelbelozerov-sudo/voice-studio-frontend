/** Stable-enough client key for referral anti-abuse (Telegram WebView + screen + UA). */
export function buildReferralClientFingerprint(): string {
  const twa = (window as unknown as { Telegram?: { WebApp?: { platform?: string; version?: string } } }).Telegram?.WebApp;
  const parts = [
    typeof navigator !== "undefined" ? navigator.userAgent : "",
    typeof screen !== "undefined" ? `${screen.width}x${screen.height}` : "",
    twa?.platform ?? "",
    twa?.version ?? "",
    typeof navigator !== "undefined" ? navigator.language : ""
  ];
  const raw = parts.join("|");
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `fp_${(h >>> 0).toString(16)}_${raw.length}`;
}
