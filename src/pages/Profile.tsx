import WebApp from "@twa-dev/sdk";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { DropdownMenu } from "../components/ui/DropdownMenu";
import { AppLanguage } from "../constants/languages";
import { useTelegram } from "../hooks/useTelegram";
import { getUserProfile, updateUserLanguage, UserProfile } from "../services/api";
import { LANGUAGE_STORAGE_KEY } from "../i18n";
import { buildReferralMiniAppUrl } from "../utils/referralLink";
const FALLBACK_TELEGRAM_ID = 123456789;
const SUPPORT_LINK = import.meta.env.VITE_SUPPORT_TELEGRAM_LINK || "";

export const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const { user, telegramId: telegramUserId, theme, setTheme } = useTelegram();
  const telegramId = useMemo(() => telegramUserId ?? FALLBACK_TELEGRAM_ID, [telegramUserId]);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  const inviteUrl = useMemo(
    () => (telegramUserId ? buildReferralMiniAppUrl(telegramUserId) : null),
    [telegramUserId]
  );

  const walletSeconds = profile
    ? (profile.credit_balance ?? 0) + (profile.subscription_credit_balance ?? 0)
    : 0;

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

  const handleCopyInvite = async () => {
    if (!inviteUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setInviteCopied(true);
      window.setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      /* */
    }
  };

  const handleShareInvite = () => {
    if (!inviteUrl) {
      return;
    }
    const text = encodeURIComponent(t("profile.inviteShareText"));
    const url = encodeURIComponent(inviteUrl);
    const share = `https://t.me/share/url?url=${url}&text=${text}`;
    try {
      WebApp.openTelegramLink?.(share);
    } catch {
      window.open(share, "_blank", "noopener,noreferrer");
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
        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t("profile.greeting", { name: user?.first_name || t("common.guest") })}
        </p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {t("profile.greetingSubtitle")}
        </p>
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
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("profile.studioWalletTitle")}</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {t("profile.studioWalletDetail", {
            total: walletSeconds,
            wallet: profile?.credit_balance ?? 0,
            sub: profile?.subscription_credit_balance ?? 0
          })}
        </p>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{t("profile.inviteTitle")}</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t("profile.inviteSubtitle")}</p>
        {!inviteUrl ? (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{t("profile.inviteLinkMissing")}</p>
        ) : (
          <div className="mt-3 space-y-2">
            <p className="break-all rounded-lg bg-slate-50 p-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {inviteUrl}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button variant="secondary" className="w-full" onClick={() => void handleCopyInvite()}>
                {inviteCopied ? t("profile.copied") : t("profile.copyInviteLink")}
              </Button>
              <Button className="w-full" onClick={handleShareInvite}>
                {t("profile.shareInvite")}
              </Button>
            </div>
          </div>
        )}
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
