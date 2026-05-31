import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { AudioPlayer } from "../components/ui/AudioPlayer";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { AppPage } from "../components/layout/AppPage";
import { TextEditor } from "../components/features/VoiceGeneration/TextEditor";
import { VoiceStylePanel } from "../components/features/VoiceGeneration/VoiceStylePanel";
import { VoiceSelector } from "../components/features/VoiceGeneration/VoiceSelector";
import { mapInterfaceLanguageToTtsCode } from "../constants/ttsLanguages";
import { usePreserveTelegramMiniAppBootstrap } from "../hooks/usePreserveTelegramMiniAppBootstrap";
import { useTelegram } from "../hooks/useTelegram";
import { PRO_CREATOR_STARS_PRICE } from "../constants/catalog";
import { useTelegramStarsPurchase } from "../hooks/useTelegramStarsPurchase";
import { trackAnalytics } from "../lib/analytics";
import {
  ackReferralDownload,
  generateAudio,
  getUserProfile,
  getVoices,
  prepareReferralShare,
  UserProfile,
  Voice
} from "../services/api";
import { useVoiceStore } from "../store/voiceStore";
import { estimateSpeechSeconds, formatNarrationSeconds } from "../utils/credits";
import {
  buildReferralMiniAppUrl,
  buildReferralPreparedShareMessageText,
  buildReferralShareUrl,
  buildTelegramMiniAppShareDialogUrl,
  isReferralPreparedShareEnabled,
  openTelegramMiniAppShareDialog,
  sharePreparedInlineMessage
} from "../utils/referralLink";

const TOPUP_STARTER_PACK = {
  productType: "credits" as const,
  productValue: 5 * 60,
  amountStars: 39
};

const PRO_CREATOR_BETA_INVOICE = {
  productType: "subscription" as const,
  productValue: 3,
  amountStars: PRO_CREATOR_STARS_PRICE
};

export const GeneratePage = () => {
  const { t, i18n } = useTranslation();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [successPaywallVisible, setSuccessPaywallVisible] = useState(false);
  const [studioGate, setStudioGate] = useState<{ shortfallSec: number; code: string } | null>(null);
  const [lastCost, setLastCost] = useState<number | null>(null);
  const [referralLinkCopied, setReferralLinkCopied] = useState(false);

  const {
    selectedVoiceId,
    text,
    speed,
    pitch,
    languageCode,
    presetId,
    setSelectedVoiceId,
    setText,
    setSpeed,
    setPitch,
    setLanguageCode,
    setPresetId,
    resetVoiceSliders
  } = useVoiceStore();

  const { telegramId } = useTelegram();
  const { suffix: tgBootstrapSuffix } = usePreserveTelegramMiniAppBootstrap();
  const { purchase: purchaseStars } = useTelegramStarsPurchase(telegramId);

  useEffect(() => {
    const loadVoices = async () => {
      setIsLoadingVoices(true);
      setError(null);
      try {
        const data = await getVoices();
        setVoices(data.voices || []);
      } catch {
        setError(t("generate.loadVoicesError"));
        setVoices([]);
      } finally {
        setIsLoadingVoices(false);
      }
    };

    void loadVoices();
  }, [t]);

  useEffect(() => {
    setLanguageCode(mapInterfaceLanguageToTtsCode(i18n.language));
  }, [i18n.language, setLanguageCode]);

  useEffect(() => {
    const loadUsage = async () => {
      if (!telegramId) {
        setProfile(null);
        return;
      }
      try {
        const data = await getUserProfile(telegramId);
        setProfile(data);
      } catch {
        setProfile(null);
      }
    };
    void loadUsage();
  }, [telegramId, audioUrl]);

  const etaSeconds = useMemo(() => {
    if (!text.trim()) {
      return 0;
    }
    return estimateSpeechSeconds(text, speed);
  }, [text, speed]);

  const inviteUrl = useMemo(
    () => (telegramId ? buildReferralMiniAppUrl(telegramId) : null),
    [telegramId]
  );

  const inviteShareUrl = useMemo(
    () => (telegramId ? buildReferralShareUrl(telegramId) : null),
    [telegramId]
  );

  const handlePostGenReferralShare = async () => {
    const urlToShare = inviteShareUrl ?? inviteUrl;
    if (!urlToShare || !telegramId) {
      return;
    }
    if (isReferralPreparedShareEnabled()) {
      const messageText = buildReferralPreparedShareMessageText(telegramId, t("profile.inviteShareCaption"));
      if (messageText) {
        try {
          const { preparedMessageId } = await prepareReferralShare({
            telegramId,
            messageText,
            title: t("profile.sharePreparedInviteTitle")
          });
          if (sharePreparedInlineMessage(preparedMessageId)) {
            trackAnalytics("referral_link_shared", { source: "post_generation", channel: "prepared" });
            return;
          }
        } catch {
          /* fallback */
        }
      }
    }
    const share = buildTelegramMiniAppShareDialogUrl(urlToShare, t("profile.inviteShareCaption"));
    trackAnalytics("referral_link_shared", { source: "post_generation", channel: "link" });
    openTelegramMiniAppShareDialog(share);
  };

  const handlePostGenReferralCopy = async () => {
    if (!inviteUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(inviteUrl);
      trackAnalytics("referral_link_copied", { source: "post_generation" });
      setReferralLinkCopied(true);
      window.setTimeout(() => setReferralLinkCopied(false), 2000);
    } catch {
      /* */
    }
  };

  const walletTotal = profile ? (profile.credit_balance ?? 0) + (profile.subscription_credit_balance ?? 0) : 0;

  const isPaidTrack =
    walletTotal > 0 || profile?.subscription_tier === "pro" || profile?.subscription_tier === "premium";

  const freeSecondsCap = profile?.free_seconds_cap ?? 60;
  const freeSecondsUsed = profile?.free_seconds_used ?? 0;
  const freeRendersCap = profile?.free_generation_cap ?? 3;
  const freeRendersUsed = profile?.free_generation_count ?? 0;
  const freeSecondsProgress = Math.min(100, Math.max((freeSecondsUsed / freeSecondsCap) * 100, 0));
  const freeRendersProgress = Math.min(100, Math.max((freeRendersUsed / freeRendersCap) * 100, 0));
  const freeRendersExhausted = freeRendersUsed >= freeRendersCap;
  const freeSecondsExhausted = freeSecondsUsed >= freeSecondsCap;
  const freeSecondsLeft = Math.max(0, freeSecondsCap - freeSecondsUsed);
  const freeRendersLeft = Math.max(0, freeRendersCap - freeRendersUsed);
  const freeSecondsInsufficientForScript =
    !isPaidTrack && Boolean(text.trim()) && etaSeconds > 0 && freeSecondsUsed + etaSeconds > freeSecondsCap;

  const freePreviewStatusKey = useMemo(() => {
    if (isPaidTrack) {
      return null;
    }
    if (freeRendersExhausted && freeSecondsExhausted) {
      return "usage.freeStatusBoth";
    }
    if (freeRendersExhausted) {
      return "usage.freeStatusRenders";
    }
    if (freeSecondsExhausted) {
      return "usage.freeStatusSeconds";
    }
    if (freeSecondsInsufficientForScript) {
      return "usage.freeStatusSecondsShortfall";
    }
    return null;
  }, [
    isPaidTrack,
    freeRendersExhausted,
    freeSecondsExhausted,
    freeSecondsInsufficientForScript
  ]);

  const maxScriptLen = isPaidTrack ? 2500 : 420;

  const freeLimitBlocksGenerate = useMemo(() => {
    if (isPaidTrack || !profile) {
      return false;
    }
    if (freeRendersUsed >= freeRendersCap) {
      return true;
    }
    if (freeSecondsUsed >= freeSecondsCap) {
      return true;
    }
    return Boolean(text.trim()) && etaSeconds > 0 && freeSecondsUsed + etaSeconds > freeSecondsCap;
  }, [
    isPaidTrack,
    profile,
    freeRendersUsed,
    freeRendersCap,
    freeSecondsUsed,
    freeSecondsCap,
    text,
    etaSeconds
  ]);

  const upgradePromptKey = useMemo(() => {
    if (!freeLimitBlocksGenerate) {
      return null;
    }
    if (freeRendersExhausted && freeSecondsExhausted) {
      return "generate.upgradeGateBodyBoth";
    }
    if (freeRendersExhausted) {
      return "generate.upgradeGateBodyRenders";
    }
    if (freeSecondsExhausted) {
      return "generate.upgradeGateBodySeconds";
    }
    return "generate.upgradeGateBodyShortfall";
  }, [freeLimitBlocksGenerate, freeRendersExhausted, freeSecondsExhausted]);

  const canGenerate = useMemo(() => {
    if (!isPaidTrack && profile) {
      if (freeRendersUsed >= freeRendersCap) {
        return false;
      }
      if (text.trim() && etaSeconds > 0 && freeSecondsUsed + etaSeconds > freeSecondsCap) {
        return false;
      }
    }
    return Boolean(
      telegramId &&
        selectedVoiceId &&
        text.trim().length > 0 &&
        text.length <= maxScriptLen &&
        !isGenerating
    );
  }, [
    telegramId,
    isGenerating,
    selectedVoiceId,
    text,
    maxScriptLen,
    isPaidTrack,
    profile,
    freeRendersUsed,
    freeRendersCap,
    freeSecondsUsed,
    freeSecondsCap,
    etaSeconds
  ]);

  useEffect(() => {
    if (!freeLimitBlocksGenerate) {
      return;
    }
    trackAnalytics("paywall_shown", { variant: "free_preview_exhausted" });
  }, [freeLimitBlocksGenerate]);

  const handleGenerate = async () => {
    if (!selectedVoiceId) {
      setError(t("generate.selectVoiceFirst"));
      return;
    }

    if (!telegramId) {
      setError(t("generate.telegramMissing"));
      return;
    }

    trackAnalytics("generation_clicked", {
      preset: presetId,
      chars: text.length
    });

    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);
    setSuccessPaywallVisible(false);
    setStudioGate(null);

    try {
      const response = await generateAudio({
        text,
        voiceId: selectedVoiceId,
        speed,
        pitch,
        languageCode,
        telegramId,
        presetId: presetId ?? undefined
      });

      const generatedUrl = response.audioUrl || response.url;
      if (!generatedUrl) {
        throw new Error("Empty audio URL");
      }

      const absoluteUrl = generatedUrl.startsWith("http")
        ? generatedUrl
        : `${window.location.protocol}//${window.location.hostname}:3001${generatedUrl}`;

      setAudioUrl(absoluteUrl);
      setLastCost(response.creditsCharged ?? null);

      trackAnalytics("generation_completed", {
        credits: response.creditsCharged,
        seconds: response.estimatedSeconds
      });

      if (response.hints?.showSoftUpsell) {
        setSuccessPaywallVisible(true);
        trackAnalytics("paywall_shown", { variant: "post_success" });
        trackAnalytics("paywall_soft_shown", { variant: "post_success" });
      }

      await getUserProfile(telegramId).then(setProfile).catch(() => {
        /* */
      });
    } catch (requestError) {
      const err = requestError as any;
      const status = err?.response?.status;
      const backendCode = err?.response?.data?.code;

      console.error("[GeneratePage] generation failed", err?.response?.data ?? err);

      trackAnalytics("generation_failed", { status: status ?? null, code: backendCode ?? null });

      const shortfall = Number(err?.response?.data?.creditsShortfall ?? err?.response?.data?.secondsShortfall ?? 0) || 0;

      if (status === 402) {
        setError(null);
        setStudioGate({ shortfallSec: shortfall, code: String(backendCode ?? "insufficient_credits") });
        trackAnalytics("paywall_shown", { reason: backendCode ?? "limit", shortfall });
        if (backendCode === "free_exhausted" || backendCode === "daily_cap") {
          trackAnalytics("free_limit_reached", { code: backendCode });
        }
      } else if (status === 429) {
        if (backendCode === "duplicate") {
          trackAnalytics("duplicate_request_blocked", {});
        }
        if (backendCode === "cooldown") {
          trackAnalytics("cooldown_blocked", {});
        }
        if (backendCode === "queue_busy") {
          trackAnalytics("queue_busy_blocked", {});
        }
        setError(err?.response?.data?.error ?? "Slow down creator — try again in a moment.");
      } else {
        setError(err?.response?.data?.error ?? t("generate.generateError"));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickTopUp = async () => {
    if (!telegramId) return;
    trackAnalytics("topup_clicked", { pack: TOPUP_STARTER_PACK.productValue });
    await purchaseStars({ telegramId, ...TOPUP_STARTER_PACK }, (result) => {
      if (result === "paid") {
        void getUserProfile(telegramId).then(setProfile);
        setStudioGate(null);
      }
    });
  };

  const handleUpgradeProBeta = async () => {
    if (!telegramId) return;
    trackAnalytics("topup_clicked", { pack: "pro_creator_beta" });
    await purchaseStars({ telegramId, ...PRO_CREATOR_BETA_INVOICE }, (result) => {
      if (result === "paid") {
        void getUserProfile(telegramId).then(setProfile);
        setStudioGate(null);
      }
    });
  };

  const paywallCard = (
    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4 text-sm text-amber-950 shadow-sm dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
      <p className="font-semibold">{t("paywall.afterGenerationTitle")}</p>
      <p className="mt-2 text-xs leading-relaxed text-amber-900/90 dark:text-amber-100/85">{t("paywall.afterGenerationBody")}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button className="w-full sm:flex-1" onClick={() => void handleQuickTopUp()}>
          {t("paywall.topUpStarter")}
        </Button>
        <Button variant="secondary" className="w-full sm:flex-1" onClick={() => void handleUpgradeProBeta()}>
          {t("paywall.upgradeProBeta")}
        </Button>
        <Link to={`/pricing${tgBootstrapSuffix}`} className="w-full sm:flex-1" onClick={() => trackAnalytics("paywall_explore_clicked", {})}>
          <Button variant="secondary" className="w-full">
            {t("paywall.viewPlans")}
          </Button>
        </Link>
      </div>
    </div>
  );

  const gateShortfallLabel =
    studioGate && studioGate.shortfallSec > 0
      ? formatNarrationSeconds(studioGate.shortfallSec).label
      : t("generate.gateShortfallFallback");

  return (
    <AppPage>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("generate.title")}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">{t("generate.subtitle")}</p>
      </div>

      {telegramId ? (
        <div className="space-y-3 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
            <Sparkles className="h-4 w-4 text-amber-500" />
            {t("usage.studioBalance")}
          </div>
          <div className="flex flex-wrap items-baseline gap-2 text-xs text-slate-600 dark:text-slate-300">
            {!isPaidTrack ? (
              <>
                <span>{t("usage.betaPreview")}</span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                  {profile?.free_seconds_used ?? 0}s / {profile?.free_seconds_cap ?? 60}s
                </span>
                <span className="text-slate-400">·</span>
                <span>
                  {profile?.free_generation_count ?? 0}/{profile?.free_generation_cap ?? 3} {t("usage.renders")}
                </span>
              </>
            ) : (
              <>
                <span>{t("usage.paidCredits")}</span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                  {walletTotal}s
                </span>
                {profile?.subscription_tier === "pro" ? (
                  <>
                    <span className="text-slate-400">·</span>
                    <span>
                      {t("usage.proReserve", {
                        sub: Math.floor((profile.subscription_credit_balance ?? 0) / 60),
                        wallet: Math.floor((profile.credit_balance ?? 0) / 60)
                      })}
                    </span>
                  </>
                ) : null}
              </>
            )}
          </div>

          {!isPaidTrack ? (
            <div className="space-y-2">
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                {t("usage.freePreviewRules", { secondsCap: freeSecondsCap, rendersCap: freeRendersCap })}
              </p>
              {freePreviewStatusKey ? (
                <p
                  className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-[11px] leading-relaxed text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100"
                  role="status"
                >
                  {t(freePreviewStatusKey, {
                    secondsCap: freeSecondsCap,
                    rendersCap: freeRendersCap,
                    secondsLeft: freeSecondsLeft,
                    rendersLeft: freeRendersLeft,
                    need: etaSeconds,
                    left: freeSecondsLeft
                  })}
                </p>
              ) : null}
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{t("usage.secondsMeter")}</span>
                  <span>
                    {freeSecondsUsed}/{freeSecondsCap}s
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-2 rounded-full bg-amber-500 transition-[width]"
                    style={{ width: `${freeSecondsProgress}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{t("usage.rendersMeter")}</span>
                  <span>
                    {freeRendersUsed}/{freeRendersCap} {t("usage.renders")}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-2 rounded-full bg-blue-600 transition-[width]"
                    style={{ width: `${freeRendersProgress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-1 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>{t("usage.remainingMeter")}</span>
                <span>{walletTotal}s</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="h-2 rounded-full bg-emerald-500 transition-[width]" style={{ width: "100%" }} />
              </div>
            </div>
          )}
        </div>
      ) : null}

      {error ? <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/60 dark:text-red-300">{error}</div> : null}

      {studioGate ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            role="dialog"
            aria-modal="true"
          >
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t("generate.gateTitle")}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {t("generate.gateBody", { time: gateShortfallLabel })}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Button className="w-full" onClick={() => void handleQuickTopUp()}>
                {t("paywall.topUpStarter")}
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => void handleUpgradeProBeta()}>
                {t("paywall.upgradeProBeta")}
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => setStudioGate(null)}>
                {t("generate.gateDismiss")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <VoiceSelector
        voices={voices}
        selectedVoiceId={selectedVoiceId}
        isLoading={isLoadingVoices}
        onSelect={(voiceId) => setSelectedVoiceId(voiceId)}
      />

      <TextEditor value={text} onChange={setText} maxLength={maxScriptLen} etaSeconds={etaSeconds} />

      <VoiceStylePanel
        languageCode={languageCode}
        speed={speed}
        pitch={pitch}
        presetId={presetId}
        onLanguageCodeChange={setLanguageCode}
        onSpeedChange={setSpeed}
        onPitchChange={setPitch}
        onPresetChange={setPresetId}
        onReset={resetVoiceSliders}
      />

      {upgradePromptKey ? (
        <div
          className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50 via-white to-white p-4 shadow-sm dark:border-amber-800/70 dark:from-amber-950/50 dark:via-slate-900 dark:to-slate-900"
          role="region"
          aria-labelledby="upgrade-gate-title"
        >
          <p id="upgrade-gate-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {t("generate.upgradeGateTitle")}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {t(upgradePromptKey, {
              secondsCap: freeSecondsCap,
              rendersCap: freeRendersCap,
              need: etaSeconds,
              left: freeSecondsLeft
            })}
          </p>
          <Link
            to={`/pricing${tgBootstrapSuffix}`}
            className="mt-4 block"
            onClick={() => trackAnalytics("paywall_explore_clicked", { source: "free_preview_gate" })}
          >
            <Button className="w-full">{t("generate.upgradeGateCta")}</Button>
          </Link>
        </div>
      ) : null}

      <Button className="w-full gap-2" onClick={handleGenerate} disabled={!canGenerate} loading={isGenerating}>
        {isGenerating ? (
          <>
            <Spinner />
            {t("generate.generating")}
          </>
        ) : (
          t("generate.ctaStudio")
        )}
      </Button>

      {audioUrl ? (
        <AudioPlayer
          audioUrl={audioUrl}
          onDownloadClick={() => {
            trackAnalytics("audio_downloaded", { credits: lastCost });
            trackAnalytics("audio_download", { credits: lastCost });
            if (telegramId) {
              void ackReferralDownload(telegramId);
            }
            if (successPaywallVisible) {
              trackAnalytics("paywall_shown", { variant: "after_download" });
            }
          }}
        />
      ) : null}

      {audioUrl && inviteUrl ? (
        <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t("referral.ctaTitle")}</h2>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{t("referral.ctaBody")}</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button variant="secondary" className="w-full" onClick={() => void handlePostGenReferralCopy()}>
              {referralLinkCopied ? t("profile.copied") : t("referral.copyLink")}
            </Button>
            <Button className="w-full" onClick={handlePostGenReferralShare}>
              {t("referral.shareTelegram")}
            </Button>
          </div>
        </div>
      ) : null}

      {successPaywallVisible ? paywallCard : null}
    </AppPage>
  );
};
