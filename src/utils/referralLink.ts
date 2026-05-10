/**
 * Mini App deep link: friend opens app with startapp payload ref_<telegramId>
 * @see https://core.telegram.org/bots/webapps#direct-link-mini-apps
 */
export function buildReferralMiniAppUrl(inviterTelegramId: number): string | null {
  const bot = import.meta.env.VITE_TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "");
  if (!bot) {
    return null;
  }
  const slug = (import.meta.env.VITE_TELEGRAM_MINI_APP_SLUG ?? "app").trim().replace(/^\//, "");
  const payload = `ref_${inviterTelegramId}`;
  if (slug) {
    return `https://t.me/${bot}/${slug}?startapp=${encodeURIComponent(payload)}`;
  }
  return `https://t.me/${bot}?startapp=${encodeURIComponent(payload)}`;
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
