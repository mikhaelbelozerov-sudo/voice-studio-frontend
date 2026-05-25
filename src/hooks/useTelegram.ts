import { useCallback, useEffect, useState } from "react";
import WebApp from "@twa-dev/sdk";
import { isReferralMiniAppLaunch } from "../utils/referralLink";

export type AppTheme = "light" | "dark";
const THEME_STORAGE_KEY = "voice_studio_theme";

/** Совпадает с Tailwind bg-slate-100 / dark:bg-slate-950 в App */
export const APP_SCREEN_BG = {
  light: "#f1f5f9",
  dark: "#020617"
} as const;

export function applyTelegramBottomBarColor(theme: AppTheme): void {
  const screenBg = APP_SCREEN_BG[theme];
  const tg = getTelegramWebApp();
  if (!tg) {
    return;
  }
  try {
    if (typeof tg.setBackgroundColor === "function") {
      tg.setBackgroundColor(screenBg);
    }
    if (typeof tg.setBottomBarColor === "function") {
      tg.setBottomBarColor(screenBg);
    }
  } catch {
    /* старая версия клиента */
  }
}

/**
 * MainButton.show() на первом кадре иногда рисует bottom bar чёрным до применения цвета.
 * Повторяем setBottomBarColor после layout и с небольшой задержкой.
 */
export function scheduleTelegramBottomBarRepaint(theme: AppTheme): () => void {
  const paint = () => applyTelegramBottomBarColor(theme);
  paint();
  let rafB = 0;
  const rafA = requestAnimationFrame(() => {
    paint();
    rafB = requestAnimationFrame(paint);
  });
  const timers = [16, 48, 120, 240].map((ms) => window.setTimeout(paint, ms));
  return () => {
    cancelAnimationFrame(rafA);
    if (rafB) {
      cancelAnimationFrame(rafB);
    }
    timers.forEach((id) => window.clearTimeout(id));
  };
}

type TelegramWebApp = typeof WebApp;
type TelegramWebAppWithFullscreen = TelegramWebApp & {
  isFullscreen?: boolean;
  /** false = мини-окно (свайп вверх); true = развёрнуто по высоте */
  isExpanded?: boolean;
  requestFullscreen?: () => void;
};

function getTelegramWebApp(): TelegramWebApp | undefined {
  return (window as unknown as { Telegram?: { WebApp: TelegramWebApp } }).Telegram?.WebApp;
}

function isTelegramIos(): boolean {
  return String(getTelegramWebApp()?.platform ?? "").toLowerCase() === "ios";
}

/** iOS: programmatic expand reliably retriggers WebView reload; referral: same on some builds. */
function allowProgrammaticTelegramExpand(): boolean {
  return !isTelegramIos() && !isReferralMiniAppLaunch();
}

type ExpandMode = "expandOnly" | "expandAndFullscreen";

/**
 * Telegram часто открывает Mini App из Reply Keyboard в «половинном» режиме.
 * Один вызов expand() ненадёжен — повторяем на старте.
 *
 * Важно: не вызывать requestFullscreen() на каждом viewportChanged — на части клиентов
 * (в т.ч. при открытии по startapp / реферальной ссылке) это приводит к зацикливанию
 * перезапуска WebView. Полноэкран — только в начальных ретраях и по первому жесту.
 *
 * iOS: не вызываем WebApp.expand/requestFullscreen из JS — клиент уходит в цикл перезапуска WebView.
 */
function tryExpandTelegramWebApp(mode: ExpandMode = "expandAndFullscreen"): void {
  if (!allowProgrammaticTelegramExpand()) {
    return;
  }
  const tg = getTelegramWebApp() as TelegramWebAppWithFullscreen | undefined;
  if (!tg) {
    return;
  }
  try {
    tg.expand();
  } catch {
    /* */
  }
  if (mode === "expandOnly") {
    return;
  }
  try {
    tg.requestFullscreen?.();
  } catch {
    /* */
  }
}

function scheduleTelegramExpandRetries(): () => void {
  if (!allowProgrammaticTelegramExpand()) {
    return () => {};
  }
  const delaysMs = [0, 80, 200, 450, 900, 1600, 2800];
  const ids = delaysMs.map((ms) => window.setTimeout(() => tryExpandTelegramWebApp("expandAndFullscreen"), ms));

  const onPageShow = () => tryExpandTelegramWebApp("expandAndFullscreen");
  window.addEventListener("pageshow", onPageShow);

  return () => {
    ids.forEach((id) => window.clearTimeout(id));
    window.removeEventListener("pageshow", onPageShow);
  };
}

function applyTelegramChrome(isDark: boolean) {
  const screenBg = (isDark ? APP_SCREEN_BG.dark : APP_SCREEN_BG.light) as `#${string}`;
  document.documentElement.style.setProperty("--tg-theme-bg-color", screenBg);

  const tg = getTelegramWebApp();
  if (!tg) {
    return;
  }
  try {
    tg.setHeaderColor(screenBg);
    tg.setBackgroundColor(screenBg);
    applyTelegramBottomBarColor(isDark ? "dark" : "light");
  } catch {
    /* старая версия клиента */
  }
}

type Insets = { top?: number; bottom?: number; left?: number; right?: number };

/**
 * Bot API 8.0+: safeAreaInset + contentSafeAreaInset.
 * В fullscreen шапка Telegram прозрачная — content top иногда совпадает только с вырезом,
 * без строки «Закрыть» + заголовок; тогда добавляем запас по высоте шапки.
 * Значения пишем в --tg-content-safe-area-inset-*, которые читает globals.css.
 */
function syncTelegramContentSafeAreaVars(): void {
  const tg = getTelegramWebApp() as
    | (TelegramWebApp & {
        safeAreaInset?: Insets;
        contentSafeAreaInset?: Insets;
        isFullscreen?: boolean;
      })
    | undefined;

  const root = document.documentElement;
  if (!tg) {
    root.style.setProperty("--vs-app-top-offset", "0px");
    return;
  }

  const safe = tg.safeAreaInset ?? {};
  const content = tg.contentSafeAreaInset ?? {};

  const sTop = Number(safe.top) || 0;
  const cTop = Number(content.top) || 0;
  const isFs = tg.isFullscreen === true;
  /** В fullscreen шапка прозрачная — всегда даём запас под строку управления (не только при «заниженном» cTop). */
  const chromeRowPx = 72;
  const effectiveTop = isFs ? Math.max(cTop, sTop + chromeRowPx) : Math.max(cTop, sTop);

  const sL = Number(safe.left) || 0;
  const cL = Number(content.left) || 0;
  const effectiveLeft = isFs && Math.max(cL, sL) < 56 ? Math.max(cL, sL, 56) : Math.max(cL, sL);

  const sR = Number(safe.right) || 0;
  const cR = Number(content.right) || 0;
  const effectiveRight = isFs && Math.max(cR, sR) < 56 ? Math.max(cR, sR, 56) : Math.max(cR, sR);

  const sB = Number(safe.bottom) || 0;
  const cB = Number(content.bottom) || 0;
  const effectiveBottom = Math.max(cB, sB);

  const px = (n: number) => `${Math.max(0, Math.round(n))}px`;

  root.style.setProperty("--tg-content-safe-area-inset-top", px(effectiveTop));
  root.style.setProperty("--tg-content-safe-area-inset-left", px(effectiveLeft));
  root.style.setProperty("--tg-content-safe-area-inset-right", px(effectiveRight));
  root.style.setProperty("--tg-content-safe-area-inset-bottom", px(effectiveBottom));

  /** Фиксированный дополнительный отступ под пункты меню / заголовок (px). */
  const platform = String(tg.platform ?? "");
  const iosBoost = platform === "ios" ? 12 : 0;
  const extraTop =
    (isFs ? 32 : 20) + iosBoost + (cTop === 0 && sTop === 0 ? 24 : 0);
  root.style.setProperty("--vs-app-top-offset", `${extraTop}px`);
}

export const useTelegram = () => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const fromStorage = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (fromStorage === "light" || fromStorage === "dark") {
      return fromStorage;
    }
    return (WebApp.colorScheme || "light") === "dark" ? "dark" : "light";
  });

  const applyTheme = useCallback((nextTheme: AppTheme) => {
    const isDark = nextTheme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.body.classList.toggle("dark", isDark);
    applyTelegramChrome(isDark);
  }, []);

  useEffect(() => {
    WebApp.ready();
    let cancelExpandSchedule = () => {};
    /** Следующий тик: start_param у WebApp на iOS иногда заполняется сразу после ready(). */
    const scheduleId = window.setTimeout(() => {
      cancelExpandSchedule = scheduleTelegramExpandRetries();
    }, 0);
    queueMicrotask(() => {
      syncTelegramContentSafeAreaVars();
    });
    const insetRetry = window.setTimeout(() => {
      syncTelegramContentSafeAreaVars();
    }, 200);
    return () => {
      window.clearTimeout(scheduleId);
      cancelExpandSchedule();
      window.clearTimeout(insetRetry);
    };
  }, []);

  /** После первого жеста — повторный expand (только Android / не реферальный старт). */
  useEffect(() => {
    if (!allowProgrammaticTelegramExpand()) {
      return;
    }
    const onFirstPointer = () => {
      tryExpandTelegramWebApp("expandAndFullscreen");
      document.removeEventListener("touchstart", onFirstPointer);
      document.removeEventListener("click", onFirstPointer);
    };
    document.addEventListener("touchstart", onFirstPointer, { passive: true });
    document.addEventListener("click", onFirstPointer);
    return () => {
      document.removeEventListener("touchstart", onFirstPointer);
      document.removeEventListener("click", onFirstPointer);
    };
  }, []);

  useEffect(() => {
    applyTheme(theme);
    queueMicrotask(() => syncTelegramContentSafeAreaVars());
  }, [applyTheme, theme]);

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (!tg) {
      return;
    }
    const onThemeChanged = () => {
      syncTelegramContentSafeAreaVars();
      applyTelegramChrome(document.documentElement.classList.contains("dark"));
    };
    tg.onEvent("themeChanged", onThemeChanged);
    return () => {
      tg.offEvent("themeChanged", onThemeChanged);
    };
  }, []);

  /** Insets и fullscreen: события есть в Bot API 8.0+, в типах @twa-dev могут отсутствовать */
  useEffect(() => {
    const tg = (window as {
      Telegram?: {
        WebApp: {
          onEvent?: (n: string, h: (payload?: { isStateStable?: boolean }) => void) => void;
          offEvent?: (n: string, h: (payload?: { isStateStable?: boolean }) => void) => void;
        };
      };
    }).Telegram?.WebApp;
    const onEvent = tg?.onEvent;
    const offEvent = tg?.offEvent;
    if (!onEvent || !offEvent) {
      return;
    }

    const onLayout = () => {
      syncTelegramContentSafeAreaVars();
    };

    const onViewportChanged = (payload?: { isStateStable?: boolean }) => {
      syncTelegramContentSafeAreaVars();
      if (payload?.isStateStable !== false && allowProgrammaticTelegramExpand()) {
        tryExpandTelegramWebApp("expandOnly");
      }
    };

    const extra = ["contentSafeAreaChanged", "safeAreaChanged", "fullscreenChanged"] as const;
    for (const name of extra) {
      try {
        onEvent(name, onLayout);
      } catch {
        /* событие не поддерживается */
      }
    }
    onEvent("viewportChanged", onViewportChanged);

    return () => {
      offEvent("viewportChanged", onViewportChanged);
      for (const name of extra) {
        try {
          offEvent(name, onLayout);
        } catch {
          /* */
        }
      }
    };
  }, []);

  const setTheme = useCallback(
    (nextTheme: AppTheme) => {
      setThemeState(nextTheme);
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      applyTheme(nextTheme);
    },
    [applyTheme]
  );

  const user = WebApp.initDataUnsafe?.user;
  const telegramId = typeof user?.id === "number" ? user.id : null;

  return {
    user,
    telegramId,
    isDark: theme === "dark",
    colorScheme: theme,
    theme,
    setTheme
  };
};
