const CLIENT_ID_KEY = "vs_referral_client_id";

/** Per–Mini App install id (localStorage), avoids false device_reuse on identical iPhone models. */
function getStableClientId(): string {
  try {
    const existing = window.localStorage.getItem(CLIENT_ID_KEY);
    if (existing && existing.length >= 8) {
      return existing;
    }
    const id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `rnd_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(CLIENT_ID_KEY, id);
    return id;
  } catch {
    return `ephemeral_${Date.now()}`;
  }
}

/** Stable client key for referral anti-abuse (install id + Telegram WebView + screen + UA). */
export function buildReferralClientFingerprint(): string {
  const twa = (window as unknown as { Telegram?: { WebApp?: { platform?: string; version?: string } } }).Telegram?.WebApp;
  const parts = [
    getStableClientId(),
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
