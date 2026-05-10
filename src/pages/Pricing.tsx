import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { PRO_CREATOR_STARS_PRICE } from "../constants/catalog";
import { useTelegram } from "../hooks/useTelegram";
import { useTelegramStarsPurchase } from "../hooks/useTelegramStarsPurchase";
import { CreateInvoiceRequest, getUserProfile, UserProfile } from "../services/api";
import { formatNarrationSeconds } from "../utils/credits";

const FALLBACK_TELEGRAM_ID = 123456789;

type Pack = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  titleParams?: Record<string, string | number>;
  amountStars: number;
  invoice: CreateInvoiceRequest;
};

function isProActive(profile: UserProfile | null): boolean {
  if (!profile) return false;
  if (profile.subscription_tier === "premium") return true;
  if (profile.subscription_tier !== "pro" || !profile.subscription_expires_at) return false;
  return new Date(profile.subscription_expires_at).getTime() > Date.now();
}

export const PricingPage = () => {
  const { t } = useTranslation();
  const { telegramId: telegramUserId } = useTelegram();
  const telegramId = telegramUserId ?? FALLBACK_TELEGRAM_ID;
  const proStars = PRO_CREATOR_STARS_PRICE;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!telegramUserId) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    void getUserProfile(telegramUserId)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [telegramUserId]);

  const walletSeconds = profile ? (profile.credit_balance ?? 0) + (profile.subscription_credit_balance ?? 0) : 0;
  const proOn = isProActive(profile);
  const hasWallet = (profile?.credit_balance ?? 0) > 0;
  const isPaidTrack =
    walletSeconds > 0 || profile?.subscription_tier === "pro" || profile?.subscription_tier === "premium";

  const planBadge = useMemo(() => {
    if (proOn) return t("pricing.planBadgeProBeta");
    if (hasWallet || walletSeconds > 0) return t("pricing.planBadgeStudio");
    return t("pricing.planBadgeBeta");
  }, [proOn, hasWallet, walletSeconds, t]);

  const narrationLabel = useMemo(() => formatNarrationSeconds(walletSeconds).label, [walletSeconds]);

  const usageBarPercent = useMemo(() => {
    if (!profile) return 0;
    if (!isPaidTrack) {
      const cap = profile.free_seconds_cap ?? 60;
      const used = profile.free_seconds_used ?? 0;
      return Math.min(100, Math.max(0, (used / Math.max(cap, 1)) * 100));
    }
    const denom = proOn ? 6000 : Math.max(300, walletSeconds, 1);
    return Math.min(100, Math.round((walletSeconds / denom) * 100));
  }, [profile, isPaidTrack, proOn, walletSeconds]);

  const topUps: Pack[] = useMemo(
    () => [
      {
        id: "starter5",
        titleKey: "pricing.packStarterTitle",
        descriptionKey: "pricing.packStarterDesc",
        amountStars: 39,
        invoice: {
          telegramId,
          productType: "credits",
          productValue: 5 * 60,
          amountStars: 39
        }
      },
      {
        id: "creator20",
        titleKey: "pricing.packCreatorTitle",
        descriptionKey: "pricing.packCreatorDesc",
        amountStars: 99,
        invoice: {
          telegramId,
          productType: "credits",
          productValue: 20 * 60,
          amountStars: 99
        }
      }
    ],
    [telegramId]
  );

  const creatorPlan: Pack = useMemo(
    () => ({
      id: "proBeta",
      titleKey: "pricing.proBetaTitle",
      descriptionKey: "pricing.proBetaDesc",
      titleParams: { stars: proStars },
      amountStars: proStars,
      invoice: {
        telegramId,
        productType: "subscription",
        productValue: 3,
        amountStars: proStars
      }
    }),
    [telegramId, proStars]
  );

  const [isPurchasingId, setIsPurchasingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { purchase } = useTelegramStarsPurchase(telegramUserId);

  const buy = async (pack: Pack) => {
    if (!telegramUserId) {
      setError(t("generate.telegramMissing"));
      return;
    }
    setIsPurchasingId(pack.id);
    setError(null);
    setSuccess(null);
    await purchase(pack.invoice, (status) => {
      setIsPurchasingId(null);
      if (status === "paid") {
        setSuccess(t("pricing.paid"));
        void getUserProfile(telegramUserId).then(setProfile);
      } else if (status === "cancelled") {
        setError(t("pricing.cancelled"));
      } else {
        setError(t("pricing.failed"));
      }
    });
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t("pricing.title")}</h1>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{t("pricing.subtitleV2")}</p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
            {planBadge}
          </span>
          {profileLoading ? (
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <Spinner />
              {t("common.loading")}
            </span>
          ) : null}
        </div>
        <p className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-100">{t("pricing.studioTimeAvailable")}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-50">{narrationLabel}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {t("pricing.approxMinutesHint", { minutes: Math.floor(walletSeconds / 60) })}
        </p>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{isPaidTrack ? t("pricing.usageBarPaid") : t("pricing.usageBarPreview")}</span>
            <span>{Math.round(usageBarPercent)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className={`h-2 rounded-full transition-[width] ${isPaidTrack ? "bg-emerald-500" : "bg-amber-500"}`}
              style={{ width: `${usageBarPercent}%` }}
            />
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{t("pricing.softUpgradeHint")}</p>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t("pricing.topUpsTitle")}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{t("pricing.topUpsHint")}</p>
        <div className="grid gap-3">
          {topUps.map((pack) => (
            <div
              key={pack.id}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {t(pack.titleKey, pack.titleParams)}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t(pack.descriptionKey)}</p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {pack.amountStars} <span aria-hidden>⭐️</span>
                </p>
                <Button onClick={() => void buy(pack)} loading={isPurchasingId === pack.id}>
                  {t("common.buy")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t("pricing.subscriptionsSecondary")}</h2>
        <div className="rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-900/5 to-slate-900/10 p-[1px] dark:from-amber-400/20 dark:via-slate-800 dark:to-slate-900">
          <div className="rounded-2xl bg-white p-4 dark:bg-slate-950">
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t(creatorPlan.titleKey, creatorPlan.titleParams)}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t(creatorPlan.descriptionKey)}</p>
            <div className="mt-4 flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {creatorPlan.amountStars} <span aria-hidden>⭐️</span> / {t("pricing.perMonth")}
              </p>
              <Button onClick={() => void buy(creatorPlan)} loading={isPurchasingId === creatorPlan.id}>
                {t("pricing.subscribePro")}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
