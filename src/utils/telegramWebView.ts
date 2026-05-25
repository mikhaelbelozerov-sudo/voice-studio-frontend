import WebApp from "@twa-dev/sdk";
import { APP_SCREEN_BG, type AppTheme } from "../constants/telegramTheme";

/** Остаток native bottom bar Telegram — чёрная полоса под контентом. */
export function clearTelegramWebViewChromePadding(): void {
  const root = document.documentElement;
  root.style.paddingBottom = "";
  root.style.boxSizing = "";
}

export function hideTelegramMainButton(): void {
  try {
    WebApp.MainButton.hide();
  } catch {
    /* */
  }
}

export function hideTelegramKeyboard(): void {
  const wtg = (window as { Telegram?: { WebApp?: { hideKeyboard?: () => void } } }).Telegram?.WebApp;
  if (typeof wtg?.hideKeyboard !== "function") {
    return;
  }
  try {
    wtg.hideKeyboard();
  } catch {
    /* */
  }
}

export function dismissTelegramKeyboardField(field?: HTMLElement | null): void {
  hideTelegramKeyboard();
  field?.blur();
  clearTelegramWebViewChromePadding();
}

export function paintTelegramWebViewBackground(theme: AppTheme): void {
  const screenBg = APP_SCREEN_BG[theme];
  document.documentElement.style.setProperty("--tg-theme-bg-color", screenBg);
  const tg = (window as { Telegram?: { WebApp?: { setBackgroundColor?: (c: string) => void; setBottomBarColor?: (c: string) => void } } })
    .Telegram?.WebApp;
  if (!tg) {
    return;
  }
  try {
    tg.setBackgroundColor?.(screenBg);
    tg.setBottomBarColor?.(screenBg);
  } catch {
    /* */
  }
}

/** Клавиатура открыта — не вызывать expand (чёрные артефакты при resize). */
export function isTelegramKeyboardLikelyOpen(): boolean {
  const tg = (window as { Telegram?: { WebApp?: { viewportHeight?: number; viewportStableHeight?: number } } }).Telegram
    ?.WebApp;
  if (tg) {
    const vh = Number(tg.viewportHeight) || 0;
    const stable = Number(tg.viewportStableHeight) || 0;
    if (stable > 0 && vh > 0) {
      return vh < stable * 0.88;
    }
  }
  const vv = window.visualViewport;
  return vv ? vv.height < window.innerHeight * 0.82 : false;
}

export function syncTelegramWebViewAfterViewport(theme: AppTheme): void {
  clearTelegramWebViewChromePadding();
  paintTelegramWebViewBackground(theme);
}
