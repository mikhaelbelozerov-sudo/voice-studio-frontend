import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { useTelegram } from "../hooks/useTelegram";
import {
  createInvoice,
  CreateInvoiceRequest,
  getUserProfile,
  InvoiceProductType,
  UserProfile
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

const subscriptionPlans: PricingItem[] = [
  {
    id: "free",
    title: "Free",
    description: "1 минута генерации в день",
    amountStars: 0,
    productType: "subscription",
    productValue: 0
  },
  {
    id: "pro",
    title: "Pro",
    description: "Безлимитная генерация и хранение файлов 30 дней",
    amountStars: 100,
    productType: "subscription",
    productValue: 1,
    badge: "Популярный"
  },
  {
    id: "premium",
    title: "Premium",
    description: "Максимальный тариф и длительное хранение файлов",
    amountStars: 200,
    productType: "subscription",
    productValue: 2,
    badge: "Лучший"
  }
];

const minutePlans: PricingItem[] = [
  {
    id: "minutes_100",
    title: "100 минут",
    description: "Пакет дополнительных минут генерации",
    amountStars: 50,
    productType: "minutes",
    productValue: 100
  }
];

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
  const { telegramId: telegramUserId } = useTelegram();
  const telegramId = useMemo(() => telegramUserId ?? FALLBACK_TELEGRAM_ID, [telegramUserId]);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isPurchasingId, setIsPurchasingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      const nextProfile = await getUserProfile(telegramId);
      setProfile(nextProfile);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [telegramId]);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        await refreshProfile();
      } catch (_err) {
        setError("Не удалось загрузить данные профиля");
      }
    };
    void load();
  }, [refreshProfile]);

  const purchase = useCallback(
    async (plan: PricingItem) => {
      if (!telegramId) {
        setError("Не удалось определить пользователя Telegram.");
        return;
      }

      if (plan.amountStars <= 0) {
        setError("Тариф Free не требует покупки.");
        return;
      }

      const openInvoice = window.Telegram?.WebApp?.openInvoice;
      if (!openInvoice) {
        setError("Функция оплаты Telegram недоступна в текущем окружении.");
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
            try {
              await refreshProfile();
              setSuccess("Оплата прошла успешно. Баланс обновлён.");
            } catch (_err) {
              setSuccess("Оплата прошла успешно. Обновите страницу для актуальных данных.");
            }
            return;
          }

          if (status === "cancelled") {
            setError("Оплата была отменена.");
            return;
          }

          if (status === "failed") {
            setError("Не удалось завершить оплату. Попробуйте позже.");
            return;
          }

          setError("Платёж находится в обработке. Проверьте баланс через несколько секунд.");
        });
      } catch (err) {
        const message =
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          typeof (err as { response?: { data?: { error?: string } } }).response?.data?.error === "string"
            ? (err as { response: { data: { error: string } } }).response.data.error
            : "Не удалось создать инвойс. Попробуйте позже.";
        setError(message);
      } finally {
        setIsPurchasingId(null);
      }
    },
    [refreshProfile, telegramId]
  );

  return (
    <div className="space-y-5 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Оплата и тарифы</h1>
        <p className="text-sm text-slate-600">Покупайте минуты и подписки прямо в мини-приложении.</p>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Подписки</h2>
          {isLoadingProfile ? (
            <span className="inline-flex items-center gap-2 text-xs text-slate-500">
              <Spinner />
              Обновление...
            </span>
          ) : null}
        </div>

        {subscriptionPlans.map((plan) => (
          <div key={plan.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-900">{plan.title}</p>
                <p className="mt-1 text-sm text-slate-600">{plan.description}</p>
              </div>
              {plan.badge ? (
                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">{plan.badge}</span>
              ) : null}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">
                {plan.amountStars === 0 ? "Бесплатно" : `${plan.amountStars} ⭐`}
              </p>
              <Button
                onClick={() => void purchase(plan)}
                disabled={plan.amountStars === 0}
                loading={isPurchasingId === plan.id}
              >
                {plan.amountStars === 0 ? "Текущий уровень" : "Купить"}
              </Button>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Пакеты минут</h2>
        {minutePlans.map((plan) => (
          <div key={plan.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <p className="text-lg font-semibold text-slate-900">{plan.title}</p>
            <p className="mt-1 text-sm text-slate-600">{plan.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">{plan.amountStars} ⭐</p>
              <Button onClick={() => void purchase(plan)} loading={isPurchasingId === plan.id}>
                Купить
              </Button>
            </div>
          </div>
        ))}
      </section>

      <div className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">
        <p>Текущий тариф: <span className="font-semibold capitalize text-slate-900">{profile?.subscription_tier ?? "free"}</span></p>
        <p className="mt-1">Stars минуты: <span className="font-semibold text-slate-900">{profile?.stars_minutes ?? 0}</span></p>
      </div>
    </div>
  );
};
