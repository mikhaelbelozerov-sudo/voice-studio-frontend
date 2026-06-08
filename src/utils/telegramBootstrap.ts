import WebApp from "@twa-dev/sdk";
import { readTelegramStartParamRaw } from "./referralLink";

const BOOTSTRAP_SESSION_KEY = "vs_tg_webapp_bootstrap";

function readBootstrapFromUrl(): string {
  if (typeof window === "undefined") {
    return "";
  }
  const search = /tgWebApp/i.test(window.location.search) ? window.location.search : "";
  return search;
}

/**
 * Telegram sometimes puts tgWebApp* in location.hash. HashRouter treats hash as the route
 * (`#/generate`) — param-only hash breaks routing and shows a black screen with only the nav bar.
 * Move those params into the query string and reset hash to a valid route.
 */
export function normalizeTelegramLaunchHashForRouter(): void {
  if (typeof window === "undefined") {
    return;
  }

  const rawHash = window.location.hash;
  if (!rawHash || rawHash.length <= 1) {
    return;
  }

  const body = rawHash.startsWith("#") ? rawHash.slice(1) : rawHash;
  if (body.startsWith("/")) {
    return;
  }

  if (!/tgWebApp/i.test(body)) {
    return;
  }

  let url: URL;
  try {
    url = new URL(window.location.href);
  } catch {
    return;
  }

  try {
    const hashParams = new URLSearchParams(body);
    hashParams.forEach((value, key) => {
      if (/tgWebApp/i.test(key) && !url.searchParams.has(key)) {
        url.searchParams.set(key, value);
      }
    });
    url.hash = "";
    window.history.replaceState(window.history.state, "", url.toString());
  } catch {
    /* */
  }
}

function persistBootstrapSuffix(suffix: string): void {
  if (!suffix) {
    return;
  }
  try {
    sessionStorage.setItem(BOOTSTRAP_SESSION_KEY, suffix);
  } catch {
    /* private mode / quota */
  }
}

/**
 * iOS named direct links (`t.me/bot/app?startapp=…`) sometimes pass start_param only via WebApp API,
 * not in the address bar. Telegram then reloads WebView in a loop until tgWebApp* appear in the URL.
 * Patch the launch URL in-place (no React Router navigation).
 */
export function ensureTelegramLaunchUrl(): void {
  if (typeof window === "undefined") {
    return;
  }

  let url: URL;
  try {
    url = new URL(window.location.href);
  } catch {
    return;
  }

  const tg = (window as { Telegram?: { WebApp?: typeof WebApp } }).Telegram?.WebApp;
  if (!tg) {
    return;
  }

  let changed = false;

  const initData = typeof tg.initData === "string" ? tg.initData.trim() : "";
  if (initData && !url.searchParams.has("tgWebAppData")) {
    url.searchParams.set("tgWebAppData", initData);
    changed = true;
  }

  const startParam = readTelegramStartParamRaw();
  if (startParam && !url.searchParams.has("tgWebAppStartParam")) {
    url.searchParams.set("tgWebAppStartParam", startParam);
    changed = true;
  }

  const version = String((tg as { version?: string }).version ?? "").trim();
  if (version && !url.searchParams.has("tgWebAppVersion")) {
    url.searchParams.set("tgWebAppVersion", version);
    changed = true;
  }

  const platform = String(tg.platform ?? "").trim();
  if (platform && !url.searchParams.has("tgWebAppPlatform")) {
    url.searchParams.set("tgWebAppPlatform", platform);
    changed = true;
  }

  if (changed) {
    try {
      window.history.replaceState(window.history.state, "", url.toString());
    } catch {
      /* */
    }
  }

  persistBootstrapSuffix(readBootstrapFromUrl());
}

/**
 * Telegram injects tgWebApp* into the launch URL (query and sometimes hash).
 * On iOS, client-side navigations that drop them reload the WebView in a loop.
 * Capture on every call and persist for the session so in-app routes keep the suffix.
 */
export function captureTelegramBootstrapSuffix(): string {
  ensureTelegramLaunchUrl();

  const fromUrl = readBootstrapFromUrl();
  if (fromUrl) {
    persistBootstrapSuffix(fromUrl);
    return fromUrl;
  }
  try {
    return sessionStorage.getItem(BOOTSTRAP_SESSION_KEY) ?? "";
  } catch {
    return "";
  }
}

export function getTelegramBootstrapSuffix(): string {
  return captureTelegramBootstrapSuffix();
}
