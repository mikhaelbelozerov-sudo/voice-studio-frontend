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

/** Bot API 7.7+: отключить свайп вниз для сворачивания Mini App (закрытие — только кнопка «Закрыть»). */
export function disableTelegramVerticalSwipes(): void {
  try {
    const sdk = WebApp as { disableVerticalSwipes?: () => void };
    if (typeof sdk.disableVerticalSwipes === "function") {
      sdk.disableVerticalSwipes();
      return;
    }
  } catch {
    /* */
  }
  const tg = (window as { Telegram?: { WebApp?: { disableVerticalSwipes?: () => void } } }).Telegram?.WebApp;
  try {
    tg?.disableVerticalSwipes?.();
  } catch {
    /* старый клиент Telegram */
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

const READABLE_TOP_INSET_PX = 12;
const READABLE_BOTTOM_GAP_PX = 12;
const FIELD_EDGE_PADDING_PX = 10;

function getReadableBounds(): { top: number; bottom: number } | null {
  const vv = window.visualViewport;
  if (!vv) {
    return null;
  }

  const nav = document.querySelector<HTMLElement>(".app-bottom-nav");
  const navTop = nav?.getBoundingClientRect().top ?? vv.offsetTop + vv.height;
  const top = vv.offsetTop + READABLE_TOP_INSET_PX;
  const bottom = Math.min(vv.offsetTop + vv.height, navTop) - READABLE_BOTTOM_GAP_PX;

  if (bottom - top < 72) {
    return null;
  }

  return { top, bottom };
}

function getDocumentMaxScrollY(): number {
  const doc = document.documentElement;
  const vv = window.visualViewport;
  if (!vv) {
    return Math.max(0, doc.scrollHeight - window.innerHeight);
  }
  return Math.max(0, doc.scrollHeight - vv.height - vv.offsetTop);
}

function clampScrollDelta(scrollDelta: number): number {
  const maxScroll = getDocumentMaxScrollY();
  const targetScroll = window.scrollY + scrollDelta;
  if (targetScroll > maxScroll) {
    scrollDelta = maxScroll - window.scrollY;
  }
  if (targetScroll < 0) {
    scrollDelta = -window.scrollY;
  }
  return scrollDelta;
}

/** Прокрутка так, чтобы поле целиком поместилось над клавиатурой и нижним меню. */
export function ensureFieldVisibleInViewport(field: HTMLElement): void {
  const bounds = getReadableBounds();
  if (!bounds) {
    field.scrollIntoView({ block: "start", inline: "nearest", behavior: "auto" });
    return;
  }

  const { top: visibleTop, bottom: visibleBottom } = bounds;
  const rect = field.getBoundingClientRect();
  const pad = FIELD_EDGE_PADDING_PX;
  const innerTop = visibleTop + pad;
  const innerBottom = visibleBottom - pad;
  const visibleHeight = innerBottom - innerTop;

  if (rect.top >= innerTop && rect.bottom <= innerBottom) {
    return;
  }

  let scrollDelta = 0;

  if (rect.height <= visibleHeight) {
    const idealTop = innerTop + (visibleHeight - rect.height) / 2;
    scrollDelta = rect.top - idealTop;
  } else if (rect.top < innerTop) {
    scrollDelta = rect.top - innerTop;
  } else if (rect.bottom > innerBottom) {
    scrollDelta = rect.bottom - innerBottom;
  }

  if (Math.abs(scrollDelta) < 4) {
    return;
  }

  scrollDelta = clampScrollDelta(scrollDelta);
  if (Math.abs(scrollDelta) < 4) {
    return;
  }

  window.scrollBy({ top: scrollDelta, behavior: "auto" });
}

/** Прокрутка к началу блока (результат генерации и блоки ниже) в видимую зону над нижним меню. */
export function scrollBlockStartIntoReadableArea(
  element: HTMLElement,
  behavior: ScrollBehavior = "smooth"
): void {
  const bounds = getReadableBounds();
  if (!bounds) {
    element.scrollIntoView({ block: "start", inline: "nearest", behavior });
    return;
  }

  const pad = FIELD_EDGE_PADDING_PX;
  const innerTop = bounds.top + pad;
  const innerBottom = bounds.bottom - pad;
  const rect = element.getBoundingClientRect();

  if (rect.top >= innerTop && rect.bottom <= innerBottom) {
    return;
  }

  let scrollDelta = rect.top - innerTop;
  if (Math.abs(scrollDelta) < 4) {
    return;
  }

  scrollDelta = clampScrollDelta(scrollDelta);
  if (Math.abs(scrollDelta) < 4) {
    return;
  }

  window.scrollBy({ top: scrollDelta, behavior });
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
