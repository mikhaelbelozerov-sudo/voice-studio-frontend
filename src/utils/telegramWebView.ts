import WebApp from "@twa-dev/sdk";
import { APP_SCREEN_BG, type AppTheme } from "../constants/telegramTheme";

function getActiveTheme(): AppTheme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

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
    /* Bot API < 9.1 */
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

/**
 * Синхронизация высоты WebView с Telegram (клавиатура) — иначе сверху чёрная «пустота»,
 * пока браузер не сделает reflow (например при первом вводе символа).
 */
export function applyTelegramViewportLayout(theme?: AppTheme): void {
  const activeTheme = theme ?? getActiveTheme();
  const tg = (window as { Telegram?: { WebApp?: { viewportHeight?: number } } }).Telegram?.WebApp;
  const vv = window.visualViewport;

  let heightPx = window.innerHeight;
  const tgVh = Number(tg?.viewportHeight) || 0;
  if (tgVh > 0) {
    heightPx = tgVh;
  } else if (vv) {
    heightPx = vv.height;
  }

  document.documentElement.style.setProperty("--vs-viewport-height", `${Math.round(heightPx)}px`);
  clearTelegramWebViewChromePadding();
  paintTelegramWebViewBackground(activeTheme);
}

export function syncTelegramWebViewAfterViewport(theme: AppTheme): void {
  applyTelegramViewportLayout(theme);
}

/** Минимальная прокрутка — только если поле реально не видно (как при вводе текста). */
export function ensureFieldVisibleInViewport(field: HTMLElement): void {
  field.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
}

const repairTimers = new WeakMap<HTMLElement, number[]>();

/** После открытия клавиатуры: layout Telegram + scrollIntoView nearest. */
export function scheduleKeyboardViewportRepair(field: HTMLElement, theme?: AppTheme): void {
  const prev = repairTimers.get(field);
  if (prev) {
    prev.forEach((id) => window.clearTimeout(id));
  }

  const run = () => {
    applyTelegramViewportLayout(theme);
    ensureFieldVisibleInViewport(field);
  };

  run();
  requestAnimationFrame(run);
  const timers = [80, 200, 380, 600].map((ms) => window.setTimeout(run, ms));
  repairTimers.set(field, timers);
}
