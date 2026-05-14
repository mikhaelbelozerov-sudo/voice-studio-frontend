import { useEffect, useRef } from "react";
import { trackAnalytics } from "../lib/analytics";
import { claimReferral } from "../services/api";
import { buildReferralClientFingerprint } from "../utils/referralFingerprint";
import { parseReferrerFromStartParam, readTelegramStartParamRaw } from "../utils/referralLink";

const SESSION_KEY = "vs_referral_claim_attempted";

/**
 * On first launch with ?startapp=ref_<id>, credits inviter via backend (idempotent).
 */
export const useReferralDeepLink = (inviteeTelegramId: number | null) => {
  const ran = useRef(false);

  useEffect(() => {
    if (!inviteeTelegramId || ran.current) {
      return;
    }
    if (sessionStorage.getItem(SESSION_KEY)) {
      return;
    }

    const referrerId = parseReferrerFromStartParam(readTelegramStartParamRaw());
    if (!referrerId || referrerId === inviteeTelegramId) {
      sessionStorage.setItem(SESSION_KEY, "1");
      return;
    }

    ran.current = true;

    void (async () => {
      try {
        const res = await claimReferral({
          inviteeTelegramId,
          referrerTelegramId: referrerId,
          clientFingerprint: buildReferralClientFingerprint()
        });
        trackAnalytics("referral_deep_link_claim", {
          referrerId,
          alreadyClaimed: res.alreadyClaimed === true
        });
      } catch {
        trackAnalytics("referral_deep_link_error", { referrerId });
      } finally {
        sessionStorage.setItem(SESSION_KEY, "1");
      }
    })();
  }, [inviteeTelegramId]);
};
