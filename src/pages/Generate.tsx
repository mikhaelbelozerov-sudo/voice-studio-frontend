import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { AudioPlayer } from "../components/ui/AudioPlayer";
import { Button } from "../components/ui/Button";
import { DropdownMenu } from "../components/ui/DropdownMenu";
import { Spinner } from "../components/ui/Spinner";
import { TextEditor } from "../components/features/VoiceGeneration/TextEditor";
import { VoiceControls } from "../components/features/VoiceGeneration/VoiceControls";
import { VoiceSelector } from "../components/features/VoiceGeneration/VoiceSelector";
import { VoicePresetId, VOICE_PRESET_OPTIONS } from "../constants/voicePresets";
import { mapInterfaceLanguageToTtsCode } from "../constants/ttsLanguages";
import { useTelegram } from "../hooks/useTelegram";
import { useTelegramStarsPurchase } from "../hooks/useTelegramStarsPurchase";
import { trackAnalytics } from "../lib/analytics";
import { generateAudio, getUserProfile, getVoices, UserProfile, Voice } from "../services/api";
import { useVoiceStore } from "../store/voiceStore";
import { computeGenerationCreditsEstimate, estimateSpeechSeconds } from "../utils/credits";

const TOPUP_CREDITS_PACK = {
  productType: "credits" as const,
  productValue: 10 * 60,
  amountStars: 39
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
  const [limitPaywallVisible, setLimitPaywallVisible] = useState(false);
  const [lastCost, setLastCost] = useState<number | null>(null);

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

  const presetOptions = useMemo(
    () => [
      { value: "custom", label: t("presets.custom") },
      ...VOICE_PRESET_OPTIONS.map((option) => ({ value: option.id, label: t(option.labelKey) }))
    ],
    [t]
  );

  const estimatedCredits = useMemo(() => {
    if (!selectedVoiceId) {
      return 0;
    }
    return computeGenerationCreditsEstimate(text, selectedVoiceId, speed);
  }, [selectedVoiceId, speed, text]);

  const etaSeconds = useMemo(() => {
    if (!text.trim()) {
      return 0;
    }
    return estimateSpeechSeconds(text, speed);
  }, [text, speed]);

  const walletTotal = profile ? (profile.credit_balance ?? 0) + (profile.subscription_credit_balance ?? 0) : 0;

  const isPaidTrack =
    walletTotal > 0 || profile?.subscription_tier === "pro" || profile?.subscription_tier === "premium";

  const freeLifetimeProgress = Math.min(
    100,
    Math.max(profile?.free_seconds_used && profile.free_seconds_cap
      ? (profile.free_seconds_used / profile.free_seconds_cap) * 100
      : 0, 0)
  );
  const dailyProgress = Math.min(
    100,
    Math.max(
      profile?.daily_gen_used != null && profile.daily_gen_cap ? (profile.daily_gen_used / profile.daily_gen_cap) * 100 : 0,
      0
    )
  );

  const canGenerate = useMemo(() => {
    return Boolean(
      telegramId &&
        selectedVoiceId &&
        text.trim().length > 0 &&
        text.length <= 2500 &&
        !isGenerating
    );
  }, [telegramId, isGenerating, selectedVoiceId, text]);

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
    setLimitPaywallVisible(false);

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

      const shortfall = err?.response?.data?.creditsShortfall ?? err?.response?.data?.secondsShortfall;

      if (status === 402) {
        setError(null);
        setLimitPaywallVisible(true);
        trackAnalytics("paywall_soft_shown", { reason: backendCode ?? "insufficient_credits", shortfall });
      } else if (status === 429) {
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
    trackAnalytics("topup_clicked", { pack: TOPUP_CREDITS_PACK.productValue });
    await purchaseStars({ telegramId, ...TOPUP_CREDITS_PACK }, (result) => {
      if (result === "paid") {
        void getUserProfile(telegramId).then(setProfile);
      }
    });
  };

  const paywallCard = (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 shadow-sm dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
      <p className="font-semibold">{t("paywall.afterGenerationTitle")}</p>
      <p className="mt-2 text-xs leading-relaxed text-amber-900/90 dark:text-amber-100/85">{t("paywall.afterGenerationBody")}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button className="w-full sm:flex-1" onClick={() => void handleQuickTopUp()}>
          {t("paywall.topUp10")}
        </Button>
        <Link to="/pricing" className="w-full sm:flex-1" onClick={() => trackAnalytics("paywall_explore_clicked", {})}>
          <Button variant="secondary" className="w-full">
            {t("paywall.viewPlans")}
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 pb-24">
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
                <span>{t("usage.freePool")}</span>
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
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{t("usage.lifetimeMeter")}</span>
                  <span>{Math.round(freeLifetimeProgress)}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-2 rounded-full bg-amber-500 transition-[width]"
                    style={{ width: `${freeLifetimeProgress}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{t("usage.dailyMeter")}</span>
                  <span>{profile?.daily_gen_used ?? 0}/{profile?.daily_gen_cap ?? 5}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-2 rounded-full bg-blue-600 transition-[width]"
                    style={{ width: `${dailyProgress}%` }}
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

      {limitPaywallVisible ? paywallCard : null}

      {isLoadingVoices ? (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Spinner />
          <span>{t("common.loading")}</span>
        </div>
      ) : (
        <VoiceSelector
          voices={voices}
          selectedVoiceId={selectedVoiceId}
          onSelect={(voiceId) => setSelectedVoiceId(voiceId)}
        />
      )}

      <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
        <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{t("presets.label")}</span>
        <p className="text-xs text-slate-500 dark:text-slate-400">{t("presets.hint")}</p>
        <DropdownMenu
          value={presetId ?? "custom"}
          options={presetOptions}
          onChange={(val) => {
            if (val === "custom") {
              setPresetId(null);
            } else {
              setPresetId(val as VoicePresetId);
            }
          }}
        />
        {presetId ? (
          <p className="text-xs text-blue-700 dark:text-blue-300">{t("presets.overrideNotice")}</p>
        ) : null}
      </div>

      <TextEditor value={text} onChange={setText} maxLength={2500} />

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <span>{t("generate.estimatedCost")}</span>
        <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-50">
          ~{estimatedCredits} {t("generate.creditsUnit")} · ~{Math.max(1, etaSeconds)}s
        </span>
      </div>

      <VoiceControls
        languageCode={languageCode}
        speed={speed}
        pitch={pitch}
        onLanguageCodeChange={setLanguageCode}
        onSpeedChange={setSpeed}
        onPitchChange={setPitch}
        onResetSliders={resetVoiceSliders}
      />

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
          onDownloadClick={() =>
            trackAnalytics("audio_download", {
              credits: lastCost
            })
          }
        />
      ) : null}

      {successPaywallVisible ? paywallCard : null}
    </div>
  );
};
