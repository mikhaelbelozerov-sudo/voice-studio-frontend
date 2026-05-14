/**
 * BotFather «Direct link» short name only (e.g. `app`). Not the hosted https URL.
 * @see https://core.telegram.org/bots/webapps#direct-link-mini-apps
 */
const MINI_APP_SLUG_MAX_LEN = 64;

function normalizeMiniAppSlug(raw: string | undefined): string {
  const trimmed = (raw ?? "app").trim().replace(/^\//, "");
  if (!trimmed || trimmed.length > MINI_APP_SLUG_MAX_LEN) {
    return "app";
  }
  const looksLikeUrl =
    /:\/\//.test(trimmed) ||
    /^https?:/i.test(trimmed) ||
    /[?#&]/.test(trimmed) ||
    /\s/.test(trimmed) ||
    trimmed.includes("t.me/");
  const tokenOk = /^[a-zA-Z0-9_-]+$/.test(trimmed);
  if (looksLikeUrl || !tokenOk) {
    if (import.meta.env.DEV) {
      console.warn(
        "[referralLink] VITE_TELEGRAM_MINI_APP_SLUG must be the Mini App short name from BotFather (e.g. app), not a website URL. Falling back to \"app\"."
      );
    }
    return "app";
  }
  return trimmed;
}

/**
 * Mini App deep link: friend opens app with startapp payload ref_<telegramId>
 * @see https://core.telegram.org/bots/webapps#direct-link-mini-apps
 */
export function buildReferralMiniAppUrl(inviterTelegramId: number): string | null {
  const bot = import.meta.env.VITE_TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "");
  if (!bot) {
    return null;
  }
  const slug = normalizeMiniAppSlug(import.meta.env.VITE_TELEGRAM_MINI_APP_SLUG);
  const payload = `ref_${inviterTelegramId}`;
  return `https://t.me/${bot}/${slug}?startapp=${encodeURIComponent(payload)}`;
}

function readTelegramStartParamRaw(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  const twa = (window as {
    Telegram?: { WebApp?: { startParam?: string; initDataUnsafe?: { start_param?: string } } };
  }).Telegram?.WebApp;
  if (!twa) {
    return undefined;
  }
  if (typeof twa.startParam === "string" && twa.startParam.length > 0) {
    return twa.startParam;
  }
  const sp = twa.initDataUnsafe?.start_param;
  return typeof sp === "string" && sp.length > 0 ? sp : undefined;
}

/**
 * Mini App opened via referral direct link (?startapp=ref_<telegramId>).
 * On Telegram iOS, expand/requestFullscreen during this launch can reload the WebView in a loop — skip that path in useTelegram.
 */
export function isReferralMiniAppLaunch(): boolean {
  return parseReferrerFromStartParam(readTelegramStartParamRaw()) != null;
}

export function parseReferrerFromStartParam(raw: string | undefined | null): number | null {
  if (!raw || typeof raw !== "string") {
    return null;
  }
  const decoded = (() => {
    try {
      return decodeURIComponent(raw.trim());
    } catch {
      return raw.trim();
    }
  })();
  const m = /^ref_(\d+)$/i.exec(decoded);
  if (!m) {
    return null;
  }
  const id = Number(m[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
}
