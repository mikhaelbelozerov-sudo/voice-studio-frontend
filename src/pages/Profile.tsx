import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { DropdownMenu } from "../components/ui/DropdownMenu";
import { useTelegram } from "../hooks/useTelegram";
import { getUserProfile, updateUserLanguage, UserProfile } from "../services/api";
import { getSubscriptionRemainingInfo } from "../utils/formatRemainingTime";
import { LANGUAGE_STORAGE_KEY } from "../i18n";
import { AppLanguage, DATE_LOCALE_BY_LANGUAGE } from "../constants/languages";

const FALLBACK_TELEGRAM_ID = 123456789;
const SUPPORT_LINK = import.meta.env.VITE_SUPPORT_TELEGRAM_LINK || "";

const formatDate = (iso: string | null, locale: string) => {
  if (!iso) return "—";
  const normalized = (Object.keys(DATE_LOCALE_BY_LANGUAGE).find((lng) => locale.startsWith(lng)) as AppLanguage | undefined) ?? "en";
  return new Date(iso).toLocaleString(DATE_LOCALE_BY_LANGUAGE[normalized], {
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

  const languageOptions = useMemo(
    () => [
      { value: "en" as const, label: t("common.english") },
      { value: "ru" as const, label: t("common.russian") },
      { value: "es" as const, label: t("common.spanish") },
      { value: "hi" as const, label: t("common.hindi") },
      { value: "id" as const, label: t("common.indonesian") },
      { value: "ar" as const, label: t("common.arabic") }
    ],
    [t]
  );

  const handleLanguageChange = async (language: AppLanguage) => {
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

  const handleOpenSupport = () => {
    if (!SUPPORT_LINK) {
      return;
    }
    const tg = (window as { Telegram?: { WebApp?: { openTelegramLink?: (url: string) => void } } }).Telegram?.WebApp;
    if (typeof tg?.openTelegramLink === "function") {
      tg.openTelegramLink(SUPPORT_LINK);
      return;
    }
    window.open(SUPPORT_LINK, "_blank", "noopener,noreferrer");
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
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t("profile.languageDescription")}</p>
        <DropdownMenu
          className="mt-3"
          value={languageOptions.find((option) => i18n.language.startsWith(option.value))?.value ?? "en"}
          options={languageOptions.map((option) => ({ value: option.value, label: option.label }))}
          onChange={(nextValue) => void handleLanguageChange(nextValue as AppLanguage)}
        />
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

      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("profile.supportTitle")}</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t("profile.supportSubtitle")}</p>
        <Button
          className="mt-3 w-full"
          onClick={handleOpenSupport}
          disabled={!SUPPORT_LINK}
        >
          {t("profile.supportButton")}
        </Button>
      </div>

    </div>
  );
};
