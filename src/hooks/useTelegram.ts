import { useMemo } from "react";
import WebApp from "@twa-dev/sdk";

export const useTelegram = () => {
  return useMemo(() => {
    WebApp.ready();
    WebApp.expand();

    const user = WebApp.initDataUnsafe?.user;
    const colorScheme = WebApp.colorScheme || "light";

    return {
      user,
      isDark: colorScheme === "dark",
      colorScheme
    };
  }, []);
};
