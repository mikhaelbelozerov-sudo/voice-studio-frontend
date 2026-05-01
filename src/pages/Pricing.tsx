import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/Button";
import { useTelegram } from "../hooks/useTelegram";
import {
  createInvoice,
  CreateInvoiceRequest,
  InvoiceProductType
} from "../services/api";

const FALLBACK_TELEGRAM_ID = 123456789;

type PricingItem = {
  id: string;
  title: string;
  description: string;
  amountStars: number;
  productType: InvoiceProductType;
  productValue: number;
  badge?: string;
};

type OpenInvoiceStatus = "paid" | "cancelled" | "failed" | "pending";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        openInvoice?: (url: string, callback?: (status: OpenInvoiceStatus) => void) => void;
      };
    };
  }
}

export const PricingPage = () => {
  const { t } = useTranslation();
  const { telegramId: telegramUserId } = useTelegram();
  const telegramId = useMemo(() => telegramUserId ?? FALLBACK_TELEGRAM_ID, [telegramUserId]);

  const [isPurchasingId, setIsPurchasingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const subscriptionPlans: PricingItem[] = useMemo(
    () => [
      {
        id: "free",
        title: "Free",
        description: t("pricing.freeDescription", { defaultValue: "1 minute per day" }),
        amountStars: 0,
        productType: "subscription",
        productValue: 0
      },
      {
        id: "pro",
        title: "Pro",
        description: t("pricing.proDescription", { defaultValue: "Unlimited generation and 30-day file storage" }),
        amountStars: 100,
        productType: "subscription",
        productValue: 1,
        badge: t("pricing.popular")
      },
      {
        id: "premium",
        title: "Premium",
        description: t("pricing.premiumDescription", { defaultValue: "Top tier and long-term file storage" }),
        amountStars: 200,
        productType: "subscription",
        productValue: 2,
        badge: t("pricing.best")
      }
    ],
    [t]
  );

  const minutePlans: PricingItem[] = useMemo(
    () => [
      {
        id: "minutes_100",
        title: t("pricing.minutes100Title", { defaultValue: "100 minutes" }),
        description: t("pricing.minutes100Description", { defaultValue: "Extra generation minutes package" }),
        amountStars: 50,
        productType: "minutes",
        productValue: 100
      }
    ],
    [t]
  );

  const purchase = useCallback(
    async (plan: PricingItem) => {
      if (!telegramId) {
        setError(t("generate.telegramMissing"));
        return;
      }

      if (plan.amountStars <= 0) {
        setError(t("pricing.freeNoPurchase"));
        return;
      }

      const openInvoice = window.Telegram?.WebApp?.openInvoice;
      if (!openInvoice) {
        setError(t("pricing.telegramUnavailable"));
        return;
      }

      setIsPurchasingId(plan.id);
      setError(null);
      setSuccess(null);

      try {
        const invoicePayload: CreateInvoiceRequest = {
          telegramId,
          productType: plan.productType,
          productValue: plan.productValue,
          amountStars: plan.amountStars
        };

        const invoice = await createInvoice(invoicePayload);

        openInvoice(invoice.invoiceLink, async (status) => {
          if (status === "paid") {
            setSuccess(t("pricing.paid"));
            return;
          }

          if (status === "cancelled") {
            setError(t("pricing.cancelled"));
            return;
          }

          if (status === "failed") {
            setError(t("pricing.failed"));
            return;
          }

          setError(t("pricing.pending"));
        });
      } catch (err) {
        const message =
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          typeof (err as { response?: { data?: { error?: string } } }).response?.data?.error === "string"
            ? (err as { response: { data: { error: string } } }).response.data.error
            : t("pricing.createInvoiceError");
        setError(message);
      } finally {
        setIsPurchasingId(null);
      }
    },
    [t, telegramId]
  );

  return (
    <div className="space-y-5 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("pricing.title")}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">{t("pricing.subtitle")}</p>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t("pricing.subscriptions")}</h2>
        </div>

        {subscriptionPlans.map((plan) => (
          <div key={plan.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{plan.title}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{plan.description}</p>
              </div>
              {plan.badge ? (
                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">{plan.badge}</span>
              ) : null}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {plan.amountStars === 0 ? t("common.free") : `${plan.amountStars} ⭐`}
              </p>
              <Button
                onClick={() => void purchase(plan)}
                disabled={plan.amountStars === 0}
                loading={isPurchasingId === plan.id}
              >
                {plan.amountStars === 0 ? t("pricing.currentLevel") : t("common.buy")}
              </Button>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t("pricing.minutesPackages")}</h2>
        {minutePlans.map((plan) => (
          <div key={plan.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{plan.title}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{plan.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{plan.amountStars} ⭐</p>
              <Button onClick={() => void purchase(plan)} loading={isPurchasingId === plan.id}>
                {t("common.buy")}
              </Button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};
