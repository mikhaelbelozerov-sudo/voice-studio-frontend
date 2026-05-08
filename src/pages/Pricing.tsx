import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/Button";
import { useTelegram } from "../hooks/useTelegram";
import { useTelegramStarsPurchase } from "../hooks/useTelegramStarsPurchase";
import { CreateInvoiceRequest } from "../services/api";

const FALLBACK_TELEGRAM_ID = 123456789;

type Pack = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  amountStars: number;
  invoice: CreateInvoiceRequest;
};

export const PricingPage = () => {
  const { t } = useTranslation();
  const { telegramId: telegramUserId } = useTelegram();
  const telegramId = telegramUserId ?? FALLBACK_TELEGRAM_ID;

  const topUps: Pack[] = useMemo(
    () => [
      {
        id: "credits10",
        titleKey: "pricing.pack10Title",
        descriptionKey: "pricing.pack10Desc",
        amountStars: 39,
        invoice: {
          telegramId,
          productType: "credits",
          productValue: 10 * 60,
          amountStars: 39
        }
      },
      {
        id: "credits35",
        titleKey: "pricing.pack35Title",
        descriptionKey: "pricing.pack35Desc",
        amountStars: 99,
        invoice: {
          telegramId,
          productType: "credits",
          productValue: 35 * 60,
          amountStars: 99
        }
      },
      {
        id: "credits120",
        titleKey: "pricing.pack120Title",
        descriptionKey: "pricing.pack120Desc",
        amountStars: 249,
        invoice: {
          telegramId,
          productType: "credits",
          productValue: 120 * 60,
          amountStars: 249
        }
      }
    ],
    [telegramId]
  );

  const creatorPlan: Pack = useMemo(
    () => ({
      id: "proCreator",
      titleKey: "pricing.proCreatorTitle",
      descriptionKey: "pricing.proCreatorDesc",
      amountStars: 650,
      invoice: {
        telegramId,
        productType: "subscription",
        productValue: 3,
        amountStars: 650
      }
    }),
    [telegramId]
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
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("pricing.title")}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">{t("pricing.subtitleV2")}</p>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t("pricing.topUpsTitle")}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{t("pricing.topUpsHint")}</p>
        {topUps.map((pack) => (
          <div
            key={pack.id}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800"
          >
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t(pack.titleKey)}</p>
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
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t("pricing.subscriptionsSecondary")}</h2>
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-[1px] dark:from-blue-900 dark:to-slate-900">
          <div className="rounded-2xl bg-white p-4 dark:bg-slate-950">
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t(creatorPlan.titleKey)}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t(creatorPlan.descriptionKey)}</p>
            <div className="mt-4 flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {creatorPlan.amountStars} <span aria-hidden>⭐️</span>
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
