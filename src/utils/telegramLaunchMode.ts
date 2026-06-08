import { readTelegramStartParamRaw } from "./referralLink";

const DEEP_LINK_SESSION_KEY = "vs_tg_deep_link_launch";

/**
 * Any Mini App cold start with startapp / start_param (referral or not).
 * iOS Telegram is fragile during this window — avoid viewport/expand API churn.
 */
export function markTelegramDeepLinkLaunchIfDetected(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    if (sessionStorage.getItem(DEEP_LINK_SESSION_KEY)) {
      return true;
    }
  } catch {
    /* */
  }
  const raw = readTelegramStartParamRaw();
  if (!raw) {
    return false;
  }
  try {
    sessionStorage.setItem(DEEP_LINK_SESSION_KEY, "1");
  } catch {
    /* */
  }
  return true;
}

export function isTelegramDeepLinkLaunch(): boolean {
  return markTelegramDeepLinkLaunchIfDetected();
}

