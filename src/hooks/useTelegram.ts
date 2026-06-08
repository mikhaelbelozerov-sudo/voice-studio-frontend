import { useCallback, useEffect, useState } from "react";
import WebApp from "@twa-dev/sdk";
import { APP_SCREEN_BG, type AppTheme } from "../constants/telegramTheme";
import {
  applyTelegramViewportLayout,
  disableTelegramVerticalSwipes,
  hideTelegramMainButton,
  isTelegramKeyboardLikelyOpen,
  paintTelegramWebViewBackground,
  syncTelegramWebViewAfterViewport
} from "../utils/telegramWebView";
import { isReferralMiniAppLaunch, markReferralLaunchIfDetected } from "../utils/referralLink";
import {
  captureTelegramBootstrapSuffix,
  ensureTelegramLaunchUrl
} from "../utils/telegramBootstrap";
import {
  isTelegramDeepLinkLaunch,
  markTelegramDeepLinkLaunchIfDetected
} from "../utils/telegramLaunchMode";

export type { AppTheme } from "../constants/telegramTheme";
export { APP_SCREEN_BG } from "../constants/telegramTheme";
const THEME_STORAGE_KEY = "voice_studio_theme";

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

type ExpandMode = "expandOnly" | "expandAndFullscreen";

const IOS_FULLSCREEN_ONCE_KEY = "vs_ios_request_fullscreen_once";

function getTelegramWebAppWithFullscreen(): TelegramWebAppWithFullscreen | undefined {
  return getTelegramWebApp() as TelegramWebAppWithFullscreen | undefined;
}

function isTelegramExpanded(): boolean {
  return getTelegramWebAppWithFullscreen()?.isExpanded === true;
}

function isTelegramFullscreen(): boolean {
  return getTelegramWebAppWithFullscreen()?.isFullscreen === true;
}

/**
 * Telegram часто открывает Mini App в «половинном» режиме — expand() разворачивает на всю высоту.
 * requestFullscreen() (Bot API 8.0+) — полноэкранный режим; на iOS только один отложенный вызов за сессию.
 */
function tryExpandTelegramWebApp(mode: ExpandMode = "expandAndFullscreen"): void {
  const tg = getTelegramWebAppWithFullscreen();
  if (!tg) {
    return;
  }
  if (!isTelegramExpanded()) {
    try {
      tg.expand();
    } catch {
      /* */
    }
  }
  if (mode === "expandOnly" || isTelegramIos()) {
    return;
  }
  if (!isTelegramFullscreen()) {
    try {
      tg.requestFullscreen?.();
    } catch {
      /* */
    }
  }
}

/** iOS: один вызов requestFullscreen после стабилизации WebView (без цикла pageshow/viewport). */
function tryIosRequestFullscreenOnce(): void {
  if (!isTelegramIos() || isTelegramFullscreen()) {
    return;
  }
  const tg = getTelegramWebAppWithFullscreen();
  if (!tg?.requestFullscreen) {
    return;
  }
  try {
    if (sessionStorage.getItem(IOS_FULLSCREEN_ONCE_KEY)) {
      return;
    }
    sessionStorage.setItem(IOS_FULLSCREEN_ONCE_KEY, "1");
  } catch {
    /* */
  }
  if (!isTelegramExpanded()) {
    try {
      tg.expand();
    } catch {
      /* */
    }
  }
  try {
    tg.requestFullscreen();
  } catch {
    /* */
  }
}

function scheduleTelegramExpandRetries(mode: ExpandMode = "expandAndFullscreen"): () => void {
  const delaysMs = mode === "expandOnly" ? [0, 400, 1200] : [0, 80, 200, 450, 900, 1600, 2800];
  const ids = delaysMs.map((ms) => window.setTimeout(() => tryExpandTelegramWebApp(mode), ms));

  if (isTelegramIos()) {
    return () => {
      ids.forEach((id) => window.clearTimeout(id));
    };
  }

  const onPageShow = () => tryExpandTelegramWebApp("expandAndFullscreen");
  window.addEventListener("pageshow", onPageShow);

  return () => {
    ids.forEach((id) => window.clearTimeout(id));
    window.removeEventListener("pageshow", onPageShow);
  };
}

function scheduleIosExpand(): () => void {
  const deepLink = isTelegramDeepLinkLaunch() || isReferralMiniAppLaunch();
  const expandDelaysMs = deepLink ? [200, 600, 1200, 2200, 3600] : [0, 150, 400, 900, 1800];
  const ids = expandDelaysMs.map((ms) => window.setTimeout(() => tryExpandTelegramWebApp("expandOnly"), ms));
  const fullscreenId = window.setTimeout(() => tryIosRequestFullscreenOnce(), deepLink ? 4200 : 2800);
  return () => {
    ids.forEach((id) => window.clearTimeout(id));
    window.clearTimeout(fullscreenId);
  };
}

function scheduleStartupExpand(): () => void {
  if (isTelegramIos()) {
    return scheduleIosExpand();
  }

  if (isReferralMiniAppLaunch() || isTelegramDeepLinkLaunch()) {
    const id = window.setTimeout(() => scheduleTelegramExpandRetries("expandAndFullscreen"), 600);
    return () => window.clearTimeout(id);
  }

  return scheduleTelegramExpandRetries("expandAndFullscreen");
}

function applyTelegramChrome(isDark: boolean) {
  const screenBg = (isDark ? APP_SCREEN_BG.dark : APP_SCREEN_BG.light) as `#${string}`;
  paintTelegramWebViewBackground(isDark ? "dark" : "light");

  const tg = getTelegramWebApp();
  if (!tg) {
    return;
  }
  try {
    tg.setHeaderColor(screenBg);
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
    markTelegramDeepLinkLaunchIfDetected();
    markReferralLaunchIfDetected();
    ensureTelegramLaunchUrl();
    captureTelegramBootstrapSuffix();
    hideTelegramMainButton();
    disableTelegramVerticalSwipes();
    applyTelegramViewportLayout();
    paintTelegramWebViewBackground(theme === "dark" ? "dark" : "light");

    let cancelExpandSchedule = scheduleStartupExpand();

    const pollDelaysMs = [0, 100, 300, 800];
    let pollIndex = 0;
    let pollTimerId = 0;
    const pollLaunchBootstrap = () => {
      markTelegramDeepLinkLaunchIfDetected();
      markReferralLaunchIfDetected();
      ensureTelegramLaunchUrl();
      captureTelegramBootstrapSuffix();
      if (pollIndex >= pollDelaysMs.length - 1) {
        return;
      }
      const waitMs = pollDelaysMs[pollIndex + 1] - pollDelaysMs[pollIndex];
      pollIndex += 1;
      pollTimerId = window.setTimeout(pollLaunchBootstrap, waitMs);
    };
    const scheduleId = window.setTimeout(pollLaunchBootstrap, 0);

    queueMicrotask(() => {
      syncTelegramContentSafeAreaVars();
    });
    const insetRetry = window.setTimeout(() => {
      syncTelegramContentSafeAreaVars();
      applyTelegramViewportLayout();
    }, 200);
    return () => {
      window.clearTimeout(scheduleId);
      if (pollTimerId) {
        window.clearTimeout(pollTimerId);
      }
      cancelExpandSchedule();
      window.clearTimeout(insetRetry);
    };
  }, []);

  /** После первого жеста — повторный expand; на iOS также пробуем fullscreen один раз. */
  useEffect(() => {
    const onFirstPointer = () => {
      if (isTelegramIos()) {
        tryExpandTelegramWebApp("expandOnly");
        tryIosRequestFullscreenOnce();
      } else {
        tryExpandTelegramWebApp("expandAndFullscreen");
      }
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
      syncTelegramWebViewAfterViewport(theme);
    };

    const onViewportChanged = (payload?: { isStateStable?: boolean }) => {
      syncTelegramContentSafeAreaVars();
      syncTelegramWebViewAfterViewport(theme);
      if (payload?.isStateStable === false || isTelegramKeyboardLikelyOpen()) {
        return;
      }
      if (isTelegramIos()) {
        if (!isTelegramExpanded()) {
          tryExpandTelegramWebApp("expandOnly");
        }
        return;
      }
      if (!isReferralMiniAppLaunch() && !isTelegramDeepLinkLaunch()) {
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
  }, [theme]);

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
