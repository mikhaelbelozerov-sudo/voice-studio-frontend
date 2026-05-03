import { useCallback, useEffect, useState } from "react";
import WebApp from "@twa-dev/sdk";

export type AppTheme = "light" | "dark";
const THEME_STORAGE_KEY = "voice_studio_theme";

type TelegramWebApp = typeof WebApp;

function getTelegramWebApp(): TelegramWebApp | undefined {
  return (window as unknown as { Telegram?: { WebApp: TelegramWebApp } }).Telegram?.WebApp;
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

    const tg = getTelegramWebApp();
    if (!tg) {
      return;
    }

    const bg = tg.themeParams.bg_color;
    try {
      if (bg) {
        tg.setHeaderColor(bg);
        tg.setBackgroundColor(bg);
      } else {
        tg.setHeaderColor((isDark ? "#1e293b" : "#ffffff") as `#${string}`);
        tg.setBackgroundColor((isDark ? "#0f172a" : "#f1f5f9") as `#${string}`);
      }
    } catch {
      /* старая версия клиента или не Mini App */
    }
  }, []);

  useEffect(() => {
    WebApp.ready();
    const tg = getTelegramWebApp();
    tg?.expand();
    applyTheme(theme);
  }, [applyTheme, theme]);

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (!tg) {
      return;
    }
    const onThemeChanged = () => {
      const nextBg = tg.themeParams.bg_color;
      if (nextBg) {
        tg.setHeaderColor(nextBg);
        tg.setBackgroundColor(nextBg);
      }
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
