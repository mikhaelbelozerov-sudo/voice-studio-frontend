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

type TelegramWebAppStart = {
  startParam?: string;
  initData?: string;
  initDataUnsafe?: { start_param?: string };
};

/**
 * Telegram passes startapp as start_param and as GET tgWebAppStartParam (see Web Apps docs).
 * On iOS the GET param is often available before initDataUnsafe is filled — read URL first.
 */
export function readTelegramStartParamRaw(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const u = new URL(window.location.href);
    const fromQuery = u.searchParams.get("tgWebAppStartParam");
    if (fromQuery && fromQuery.length > 0) {
      return fromQuery;
    }
  } catch {
    /* */
  }

  const hash = window.location.hash;
  if (hash.length > 1) {
    try {
      const h = hash.startsWith("#") ? hash.slice(1) : hash;
      const hp = new URLSearchParams(h);
      const fromHash = hp.get("tgWebAppStartParam");
      if (fromHash && fromHash.length > 0) {
        return fromHash;
      }
    } catch {
      /* */
    }
  }

  const twa = (window as { Telegram?: { WebApp?: TelegramWebAppStart } }).Telegram?.WebApp;
  if (twa) {
    if (typeof twa.startParam === "string" && twa.startParam.length > 0) {
      return twa.startParam;
    }
    const unsafeSp = twa.initDataUnsafe?.start_param;
    if (typeof unsafeSp === "string" && unsafeSp.length > 0) {
      return unsafeSp;
    }
    if (typeof twa.initData === "string" && twa.initData.length > 0) {
      try {
        const parsed = new URLSearchParams(twa.initData);
        const fromInit = parsed.get("start_param");
        if (fromInit && fromInit.length > 0) {
          return fromInit;
        }
      } catch {
        /* */
      }
    }
  }

  return undefined;
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
