import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { useTelegram } from "../hooks/useTelegram";
import { getUserProfile, UserProfile } from "../services/api";
import { formatSubscriptionRemaining } from "../utils/formatRemainingTime";

const FALLBACK_TELEGRAM_ID = 123456789;

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export const ProfilePage = () => {
  const { user, telegramId: telegramUserId, isDark } = useTelegram();
  const telegramId = useMemo(() => telegramUserId ?? FALLBACK_TELEGRAM_ID, [telegramUserId]);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getUserProfile(telegramId);
        setProfile(data);
      } catch (_error) {
        setError("Не удалось загрузить профиль");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [telegramId]);

  return (
    <div className="space-y-4 pb-24">
      <h1 className="text-2xl font-bold text-slate-900">Профиль</h1>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>{error}</p>
          <Button className="mt-3" variant="secondary" onClick={() => window.location.reload()}>
            Обновить
          </Button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-2xl bg-white p-4 text-slate-600 shadow-sm">
          <Spinner />
          <span>Загрузка профиля...</span>
        </div>
      ) : null}

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Имя</p>
        <p className="text-base font-semibold text-slate-900">{user?.first_name || "Гость"}</p>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Telegram ID</p>
        <p className="text-base font-semibold text-slate-900">{user?.id || "—"}</p>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Тема Telegram</p>
        <p className="text-base font-semibold text-slate-900">{isDark ? "Тёмная" : "Светлая"}</p>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Текущий тариф</p>
        <p className="text-base font-semibold capitalize text-slate-900">{profile?.subscription_tier ?? "free"}</p>
        <p className="mt-2 text-sm text-slate-600">
          До: {formatDate(profile?.subscription_expires_at ?? null)}
        </p>
        <p className="text-sm text-slate-600">
          Осталось: {formatSubscriptionRemaining(profile?.subscription_expires_at ?? null)}
        </p>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Stars минуты</p>
        <p className="text-base font-semibold text-slate-900">{profile?.stars_minutes ?? 0}</p>
      </div>

    </div>
  );
};
