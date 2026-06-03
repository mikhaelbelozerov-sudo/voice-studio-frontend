import { Coins, Crown, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AppPage } from "../components/layout/AppPage";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import { PRO_CREATOR_STARS_PRICE } from "../constants/catalog";
import { usePreserveTelegramMiniAppBootstrap } from "../hooks/usePreserveTelegramMiniAppBootstrap";
import { useTelegram } from "../hooks/useTelegram";
import { useTelegramStarsPurchase } from "../hooks/useTelegramStarsPurchase";
import { CreateInvoiceRequest } from "../services/api";

const FALLBACK_TELEGRAM_ID = 123456789;

type Pack = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  titleParams?: Record<string, string | number>;
  amountStars: number;
  invoice: CreateInvoiceRequest;
};

export const PricingPage = () => {
  const { t } = useTranslation();
  const { suffix: tgBootstrapSuffix } = usePreserveTelegramMiniAppBootstrap();
  const { telegramId: telegramUserId } = useTelegram();
  const telegramId = telegramUserId ?? FALLBACK_TELEGRAM_ID;
  const proStars = PRO_CREATOR_STARS_PRICE;

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
      } else if (status === "cancelled") {
        setError(t("pricing.cancelled"));
      } else {
        setError(t("pricing.failed"));
      }
    });
  };

  return (
    <AppPage>
      <PageHeader icon={Coins} title={t("nav.pricing")} subtitle={t("pricing.subtitle")} />

      <Link
        to={`/generate${tgBootstrapSuffix}`}
        className="-mt-2 inline-block text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
      >
        {t("pricing.viewBalance")}
      </Link>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          {success}
        </div>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t("pricing.topUpsTitle")}</h2>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{t("pricing.topUpsHint")}</p>
        </div>
        <div className="grid gap-3">
          {topUps.map((pack) => (
            <div
              key={pack.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950"
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t(pack.titleKey, pack.titleParams)}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{t(pack.descriptionKey)}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-sm font-medium tabular-nums text-slate-800 dark:text-slate-200">
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

      <section className="space-y-4 rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/80 via-white to-white p-4 shadow-sm dark:border-blue-800/60 dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t("pricing.subscriptionsSecondary")}</h2>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{t("pricing.proHint")}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
          <div className="flex items-start gap-2">
            <Star className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t(creatorPlan.titleKey, creatorPlan.titleParams)}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{t(creatorPlan.descriptionKey)}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <p className="text-sm font-medium tabular-nums text-slate-800 dark:text-slate-200">
              {creatorPlan.amountStars} <span aria-hidden>⭐️</span> / {t("pricing.perMonth")}
            </p>
            <Button onClick={() => void buy(creatorPlan)} loading={isPurchasingId === creatorPlan.id}>
              {t("pricing.subscribePro")}
            </Button>
          </div>
        </div>
      </section>
    </AppPage>
  );
};
