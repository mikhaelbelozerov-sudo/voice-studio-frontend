import { useMemo } from "react";
import WebApp from "@twa-dev/sdk";

export const useTelegram = () => {
  return useMemo(() => {
    WebApp.ready();
    WebApp.expand();

    const user = WebApp.initDataUnsafe?.user;
    const telegramId = typeof user?.id === "number" ? user.id : null;
    const colorScheme = WebApp.colorScheme || "light";

    return {
      user,
      telegramId,
      isDark: colorScheme === "dark",
      colorScheme
    };
  }, []);
};
