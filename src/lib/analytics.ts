import { api } from "../services/api";

const getTelegramId = (): number | null => {
  const id = (
    window as unknown as {
      Telegram?: { WebApp?: { initDataUnsafe?: { user?: { id?: number } } } };
    }
  ).Telegram?.WebApp?.initDataUnsafe?.user?.id;
  return typeof id === "number" ? id : null;
};

export const trackAnalytics = (event: string, props: Record<string, unknown> = {}): void => {
  const telegramId = getTelegramId();
  if (!telegramId) {
    return;
  }
  void api.post("/analytics/events", { telegramId, event, props }).catch(() => {
    /* no-op */
  });
};
