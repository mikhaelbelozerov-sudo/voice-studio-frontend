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

type ReferralLinkMode = "named" | "main" | "https";

function getReferralLinkMode(): ReferralLinkMode {
  const raw = (import.meta.env.VITE_REFERRAL_LINK_MODE ?? "named").trim().toLowerCase();
  if (raw === "main" || raw === "https" || raw === "web") {
    return raw === "web" ? "https" : (raw as ReferralLinkMode);
  }
  return "named";
}

/** Дополняет t.me-ссылку параметром mode= (compact | fullscreen), см. доку Telegram Web Apps. */
function appendTmeLaunchModeQuery(tmeUrl: string): string {
  const launchMode = (import.meta.env.VITE_REFERRAL_TME_LAUNCH_MODE ?? "fullscreen").trim().toLowerCase();
  if (!launchMode || launchMode === "0" || launchMode === "default") {
    return tmeUrl;
  }
  return `${tmeUrl}&mode=${encodeURIComponent(launchMode)}`;
}

/**
 * Mini App deep link: friend opens app with startapp payload ref_<telegramId>
 *
 * Modes (VITE_REFERRAL_LINK_MODE):
 * - named (default): https://t.me/BOT/SLUG?startapp=ref_ID — Direct link из BotFather
 * - main: https://t.me/BOT?startapp=ref_ID — «главный» Mini App без short name в пути (иногда ведёт себя иначе на iOS)
 * - https: https://YOUR_VERCEL/?tgWebAppStartParam=ref_ID — тот же домен, что в BotFather; параметр как в доке Web Apps
 *
 * @see https://core.telegram.org/bots/webapps#direct-link-mini-apps
 */
export function buildReferralMiniAppUrl(inviterTelegramId: number): string | null {
  const bot = import.meta.env.VITE_TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "");
  if (!bot) {
    return null;
  }
  const slug = normalizeMiniAppSlug(import.meta.env.VITE_TELEGRAM_MINI_APP_SLUG);
  const payload = `ref_${inviterTelegramId}`;
  const enc = encodeURIComponent(payload);
  const mode = getReferralLinkMode();

  if (mode === "https") {
    const origin = import.meta.env.VITE_PUBLIC_MINI_APP_ORIGIN?.trim().replace(/\/$/, "");
    if (!origin) {
      if (import.meta.env.DEV) {
        console.warn(
          "[referralLink] VITE_REFERRAL_LINK_MODE=https requires VITE_PUBLIC_MINI_APP_ORIGIN (e.g. https://your-app.vercel.app)"
        );
      }
      return null;
    }
    return `${origin}/?tgWebAppStartParam=${enc}`;
  }

  if (mode === "main") {
    return appendTmeLaunchModeQuery(`https://t.me/${bot}?startapp=${enc}`);
  }

  return appendTmeLaunchModeQuery(`https://t.me/${bot}/${slug}?startapp=${enc}`);
}

/** Direct link `t.me/bot/slug?startapp=…` — в чатах Telegram даёт превью Mini App с кнопкой «Открыть». */
export function buildReferralNamedMiniAppUrl(inviterTelegramId: number): string | null {
  const bot = import.meta.env.VITE_TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "");
  if (!bot) {
    return null;
  }
  const slug = normalizeMiniAppSlug(import.meta.env.VITE_TELEGRAM_MINI_APP_SLUG);
  const payload = `ref_${inviterTelegramId}`;
  return appendTmeLaunchModeQuery(
    `https://t.me/${bot}/${slug}?startapp=${encodeURIComponent(payload)}`
  );
}

/**
 * Ссылка для `t.me/share/url`: при режиме main/https по умолчанию подставляется named direct link,
 * чтобы в чате было превью с кнопкой запуска; копирование по-прежнему через {@link buildReferralMiniAppUrl}.
 * Отключить: VITE_REFERRAL_SHARE_TELEGRAM_CARD=0
 */
export function buildReferralShareUrl(inviterTelegramId: number): string | null {
  const mode = getReferralLinkMode();
  const cardOff = import.meta.env.VITE_REFERRAL_SHARE_TELEGRAM_CARD?.trim() === "0";
  if (!cardOff && (mode === "main" || mode === "https")) {
    return buildReferralNamedMiniAppUrl(inviterTelegramId);
  }
  return buildReferralMiniAppUrl(inviterTelegramId);
}

/**
 * Диалог «поделиться в чат»: по спецификации Telegram ссылка `tg://msg_url?url=…` подставляется
 * **в начало поля ввода** (как при ручной вставке), из‑за чего клиент может развернуть превью Mini App.
 * `https://t.me/share/url` внутри WebView часто даёт только «голую» строку без превью.
 *
 * Формат https: VITE_REFERRAL_SHARE_LINK_FORMAT=https (или tme)
 * Подпись после ссылки: по умолчанию включается; отключить — VITE_REFERRAL_SHARE_INCLUDE_CAPTION=0
 */
export function buildTelegramMiniAppShareDialogUrl(miniAppUrl: string, caption?: string): string {
  const urlEnc = encodeURIComponent(miniAppUrl);
  const fmt = (import.meta.env.VITE_REFERRAL_SHARE_LINK_FORMAT ?? "").trim().toLowerCase();
  const useHttps = fmt === "https" || fmt === "tme";
  const cap = caption?.trim();
  const captionDisabled = import.meta.env.VITE_REFERRAL_SHARE_INCLUDE_CAPTION?.trim() === "0";
  const withCaption = !captionDisabled && Boolean(cap);

  if (useHttps) {
    if (withCaption && cap) {
      return `https://t.me/share/url?url=${urlEnc}&text=${encodeURIComponent(cap)}`;
    }
    return `https://t.me/share/url?url=${urlEnc}`;
  }

  if (withCaption && cap) {
    return `tg://msg_url?url=${urlEnc}&text=${encodeURIComponent(cap)}`;
  }
  return `tg://msg_url?url=${urlEnc}`;
}

/** Открывает tg://msg_url или t.me/share — сначала openTelegramLink, затем openLink. */
export function openTelegramMiniAppShareDialog(shareHref: string): void {
  const wtg = (window as {
    Telegram?: { WebApp?: { openTelegramLink?: (u: string) => void; openLink?: (u: string) => void } };
  }).Telegram?.WebApp;
  try {
    if (typeof wtg?.openTelegramLink === "function") {
      wtg.openTelegramLink(shareHref);
      return;
    }
  } catch {
    /* */
  }
  try {
    if (typeof wtg?.openLink === "function") {
      wtg.openLink(shareHref);
      return;
    }
  } catch {
    /* */
  }
  window.open(shareHref, "_blank", "noopener,noreferrer");
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

const REFERRAL_LAUNCH_SESSION_KEY = "vs_referral_launch_session";

/**
 * Detect referral startapp and persist for the session.
 * Named direct links (`t.me/bot/app?startapp=ref_…`) sometimes fill start_param after first paint;
 * without a sticky flag, expand/navigation guards miss the referral launch and iOS reloads in a loop.
 */
export function markReferralLaunchIfDetected(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    if (sessionStorage.getItem(REFERRAL_LAUNCH_SESSION_KEY)) {
      return true;
    }
  } catch {
    /* */
  }
  const id = parseReferrerFromStartParam(readTelegramStartParamRaw());
  if (id == null) {
    return false;
  }
  try {
    sessionStorage.setItem(REFERRAL_LAUNCH_SESSION_KEY, "1");
  } catch {
    /* */
  }
  return true;
}

/**
 * Mini App opened via referral direct link (?startapp=ref_<telegramId>).
 * On Telegram iOS, expand/requestFullscreen during this launch can reload the WebView in a loop — skip that path in useTelegram.
 */
export function isReferralMiniAppLaunch(): boolean {
  return markReferralLaunchIfDetected();
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

/** 0 = не вызывать backend savePreparedInlineMessage + WebApp.shareMessage */
export function isReferralPreparedShareEnabled(): boolean {
  return import.meta.env.VITE_REFERRAL_PREPARED_SHARE?.trim() !== "0";
}

/**
 * Текст сообщения для {@link https://core.telegram.org/bots/api#savepreparedinlinemessage savePreparedInlineMessage}:
 * всегда named `t.me/.../app?startapp=ref_…`, чтобы в чате было превью Mini App.
 */
export function buildReferralPreparedShareMessageText(inviterTelegramId: number, caption?: string): string | null {
  const url = buildReferralNamedMiniAppUrl(inviterTelegramId);
  if (!url) {
    return null;
  }
  const cap = caption?.trim();
  if (cap) {
    return `${cap}\n\n${url}`;
  }
  return url;
}

type TelegramWebAppShare = {
  shareMessage?: (msgId: string, callback?: (sent: boolean) => void) => void;
};

/** Bot API 8.0+ Mini App: открыть диалог «поделиться» с превью подготовленного сообщения. */
export function sharePreparedInlineMessage(preparedMessageId: string, callback?: (sent: boolean) => void): boolean {
  const wtg = (window as { Telegram?: { WebApp?: TelegramWebAppShare } }).Telegram?.WebApp;
  if (typeof wtg?.shareMessage !== "function") {
    return false;
  }
  try {
    wtg.shareMessage(preparedMessageId, callback);
    return true;
  } catch {
    return false;
  }
}
