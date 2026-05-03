import { useCallback, useEffect, useState } from "react";
import WebApp from "@twa-dev/sdk";

export type AppTheme = "light" | "dark";
const THEME_STORAGE_KEY = "voice_studio_theme";

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

    const tp = WebApp.themeParams;
    const tgBg = tp.bg_color;

    if (tgBg) {
      WebApp.setBackgroundColor(tgBg);
    } else {
      WebApp.setBackgroundColor(isDark ? "#0f172a" : "#f1f5f9");
    }

    if (WebApp.isVersionAtLeast("6.1")) {
      try {
        WebApp.setHeaderColor("bg_color");
      } catch {
        WebApp.setHeaderColor((tgBg ?? (isDark ? "#1e293b" : "#ffffff")) as `#${string}`);
      }
    } else {
      WebApp.setHeaderColor((tgBg ?? (isDark ? "#1e293b" : "#ffffff")) as `#${string}`);
    }
  }, []);

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
    applyTheme(theme);
  }, [applyTheme, theme]);

  useEffect(() => {
    const onTelegramThemeChanged = () => {
      applyTheme(theme);
    };
    WebApp.onEvent("themeChanged", onTelegramThemeChanged);
    return () => {
      WebApp.offEvent("themeChanged", onTelegramThemeChanged);
    };
  }, [applyTheme, theme]);

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
