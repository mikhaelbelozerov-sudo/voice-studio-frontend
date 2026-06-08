import { useMemo } from "react";
import { captureTelegramBootstrapSuffix } from "../utils/telegramBootstrap";

/**
 * Telegram opens Mini Apps with tgWebApp* in the URL (query and sometimes hash).
 * Client-side navigations that drop these params can make Telegram iOS reload the WebView in a loop.
 * Capture on first render (and persist in session) and append to every in-app route change.
 */
export function usePreserveTelegramMiniAppBootstrap(): { suffix: string } {
  return useMemo(() => ({ suffix: captureTelegramBootstrapSuffix() }), []);
}
