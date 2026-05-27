import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AppPage } from "../components/layout/AppPage";
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
    <AppPage className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t("pricing.title")}</h1>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{t("pricing.subtitle")}</p>
        <Link
          to={`/generate${tgBootstrapSuffix}`}
          className="inline-block text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {t("pricing.viewBalance")}
        </Link>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t("pricing.topUpsTitle")}</h2>
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
    </AppPage>
  );
};
