import { useCallback, useEffect, useState } from "react";
import WebApp from "@twa-dev/sdk";

export type AppTheme = "light" | "dark";
const THEME_STORAGE_KEY = "voice_studio_theme";

/** Совпадает с Tailwind bg-slate-100 / dark:bg-slate-950 в App */
const APP_SCREEN_BG = {
  light: "#f1f5f9",
  dark: "#020617"
} as const;

type TelegramWebApp = typeof WebApp;

function getTelegramWebApp(): TelegramWebApp | undefined {
  return (window as unknown as { Telegram?: { WebApp: TelegramWebApp } }).Telegram?.WebApp;
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
    if (typeof tg.setBottomBarColor === "function") {
      tg.setBottomBarColor(screenBg);
    }
  } catch {
    /* старая версия клиента */
  }
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
    getTelegramWebApp()?.expand();
    applyTheme(theme);
  }, [applyTheme, theme]);

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (!tg) {
      return;
    }
    const onThemeChanged = () => {
      applyTelegramChrome(document.documentElement.classList.contains("dark"));
    };
    tg.onEvent("themeChanged", onThemeChanged);
    return () => {
      tg.offEvent("themeChanged", onThemeChanged);
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
