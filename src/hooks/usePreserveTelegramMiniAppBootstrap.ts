import { useMemo } from "react";

/**
 * Telegram opens Mini Apps with tgWebApp* in the URL (query and sometimes hash).
 * Client-side navigations that drop these params can make Telegram iOS reload the WebView in a loop.
 * Capture once on first render and append to every in-app route change.
 */
export function usePreserveTelegramMiniAppBootstrap(): { suffix: string } {
  return useMemo(() => {
    if (typeof window === "undefined") {
      return { suffix: "" };
    }
    const search = /tgWebApp/i.test(window.location.search) ? window.location.search : "";
    const hash = /tgWebApp/i.test(window.location.hash) ? window.location.hash : "";
    return { suffix: `${search}${hash}` };
  }, []);
}
