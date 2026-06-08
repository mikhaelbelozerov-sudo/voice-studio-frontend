import { useEffect, useRef } from "react";
import { trackAnalytics } from "../lib/analytics";
import { claimReferral } from "../services/api";
import { buildReferralClientFingerprint } from "../utils/referralFingerprint";
import { parseReferrerFromStartParam, readTelegramStartParamRaw } from "../utils/referralLink";

const CLAIM_SUCCESS_KEY = "vs_referral_claim_success";

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** start_param on iOS often appears only after WebApp.ready() and a short delay. */
const resolveReferrerId = async (): Promise<number | null> => {
  const delaysMs = [0, 100, 300, 800, 2000, 4000];

  for (const delay of delaysMs) {
    if (delay > 0) {
      await sleep(delay);
    }

    const id = parseReferrerFromStartParam(readTelegramStartParamRaw());
    if (id) {
      return id;
    }
  }

  return null;
};

/**
 * On first launch with ?startapp=ref_<id>, registers invite via backend (idempotent).
 * Retries reading start_param; does not permanently block claim on transient failures.
 */
export const useReferralDeepLink = (inviteeTelegramId: number | null) => {
  const attemptStarted = useRef(false);

  useEffect(() => {
    if (!inviteeTelegramId || attemptStarted.current) {
      return;
    }
    if (sessionStorage.getItem(CLAIM_SUCCESS_KEY)) {
      return;
    }

    attemptStarted.current = true;

    void (async () => {
      const referrerId = await resolveReferrerId();
      if (!referrerId || referrerId === inviteeTelegramId) {
        return;
      }

      try {
        const res = await claimReferral({
          inviteeTelegramId,
          referrerTelegramId: referrerId,
          clientFingerprint: buildReferralClientFingerprint()
        });
        sessionStorage.setItem(CLAIM_SUCCESS_KEY, "1");
        trackAnalytics("referral_deep_link_claim", {
          referrerId,
          alreadyClaimed: res.alreadyClaimed === true
        });
      } catch {
        attemptStarted.current = false;
        trackAnalytics("referral_deep_link_error", { referrerId });
      }
    })();
  }, [inviteeTelegramId]);
};
