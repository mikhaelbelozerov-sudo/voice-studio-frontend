import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { useTelegram } from "../hooks/useTelegram";
import { getUserProfile, updateUserLanguage, UserProfile } from "../services/api";
import { getSubscriptionRemainingInfo } from "../utils/formatRemainingTime";
import { LANGUAGE_STORAGE_KEY } from "../i18n";

const FALLBACK_TELEGRAM_ID = 123456789;

const formatDate = (iso: string | null, locale: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(locale.startsWith("en") ? "en-US" : "ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const { user, telegramId: telegramUserId, theme, setTheme } = useTelegram();
  const telegramId = useMemo(() => telegramUserId ?? FALLBACK_TELEGRAM_ID, [telegramUserId]);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSubscriptionLabel = () => {
    const info = getSubscriptionRemainingInfo(profile?.subscription_expires_at ?? null);
    if (info.kind === "inactive") return t("profile.remainingInactive");
    if (info.kind === "expired") return t("profile.subscription_expired");
    return t("profile.subscription_active", { days: info.days, hours: info.hours });
  };

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getUserProfile(telegramId);
        setProfile(data);
      } catch (_error) {
        setError(t("profile.loadError"));
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [t, telegramId]);

  const handleLanguageChange = async (language: "ru" | "en") => {
    await i18n.changeLanguage(language);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    if (!telegramId) {
      return;
    }
    try {
      await updateUserLanguage({ telegramId, language });
      setProfile((prev) => (prev ? { ...prev, language } : prev));
    } catch (_error) {
      // Локально язык уже переключили.
    }
  };

  return (
    <div className="space-y-4 pb-24">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("profile.title")}</h1>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>{error}</p>
          <Button className="mt-3" variant="secondary" onClick={() => window.location.reload()}>
            {t("common.retry")}
          </Button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-2xl bg-white p-4 text-slate-600 shadow-sm">
          <Spinner />
          <span>{t("profile.loading")}</span>
        </div>
      ) : null}

      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("profile.name")}</p>
        <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{user?.first_name || t("common.guest")}</p>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("profile.telegramId")}</p>
        <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{user?.id || "—"}</p>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("profile.theme")}</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button
            variant={theme === "light" ? "primary" : "secondary"}
            onClick={() => setTheme("light")}
          >
            {t("common.light")}
          </Button>
          <Button
            variant={theme === "dark" ? "primary" : "secondary"}
            onClick={() => setTheme("dark")}
          >
            {t("common.dark")}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("profile.language")}</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button
            variant={i18n.language.startsWith("ru") ? "primary" : "secondary"}
            onClick={() => void handleLanguageChange("ru")}
          >
            {t("common.russian")}
          </Button>
          <Button
            variant={i18n.language.startsWith("en") ? "primary" : "secondary"}
            onClick={() => void handleLanguageChange("en")}
          >
            {t("common.english")}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("profile.myPlan")}</p>
        <p className="text-base font-semibold capitalize text-slate-900 dark:text-slate-100">{profile?.subscription_tier ?? "free"}</p>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {t("profile.expiresAt")}: {formatDate(profile?.subscription_expires_at ?? null, i18n.language)}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("common.remaining")}: {getSubscriptionLabel()}
        </p>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("profile.starsMinutes")}</p>
        <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{profile?.stars_minutes ?? 0}</p>
      </div>

    </div>
  );
};
