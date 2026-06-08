const BOOTSTRAP_SESSION_KEY = "vs_tg_webapp_bootstrap";

function readBootstrapFromUrl(): string {
  if (typeof window === "undefined") {
    return "";
  }
  const search = /tgWebApp/i.test(window.location.search) ? window.location.search : "";
  const hash = /tgWebApp/i.test(window.location.hash) ? window.location.hash : "";
  return `${search}${hash}`;
}

/**
 * Telegram injects tgWebApp* into the launch URL (query and sometimes hash).
 * On iOS, client-side navigations that drop them reload the WebView in a loop.
 * Capture on every call and persist for the session so in-app routes keep the suffix.
 */
export function captureTelegramBootstrapSuffix(): string {
  const fromUrl = readBootstrapFromUrl();
  if (fromUrl) {
    try {
      sessionStorage.setItem(BOOTSTRAP_SESSION_KEY, fromUrl);
    } catch {
      /* private mode / quota */
    }
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
