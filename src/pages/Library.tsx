import { AudioWaveform, CalendarDays, Clock3, History } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTelegram } from "../hooks/useTelegram";
import { fetchGenerations, Generation, getVoices, UserTier, Voice } from "../services/api";
import { AppPage } from "../components/layout/AppPage";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { getRemainingStorageInfo, isExpiringSoon } from "../utils/formatRemainingTime";
import { AppLanguage, DATE_LOCALE_BY_LANGUAGE } from "../constants/languages";

const PAGE_SIZE = 20;
const FALLBACK_TELEGRAM_ID = 123456789;
const HOUR_MS = 60 * 60 * 1000;

const truncateText = (value: string | null, emptyText: string, maxLength = 100) => {
  if (!value) return emptyText;
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
};

const formatDateTime = (dateIso: string, locale: string) =>
  new Date(dateIso).toLocaleString(
    DATE_LOCALE_BY_LANGUAGE[
      (Object.keys(DATE_LOCALE_BY_LANGUAGE).find((lng) => locale.startsWith(lng)) as AppLanguage | undefined) ?? "en"
    ],
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  );

const canDownload = (item: Generation) => Boolean(item.audio_url && !item.file_deleted);

const getRefreshIntervalMs = (items: Generation[], tier: UserTier) => {
  if (tier === "premium" || items.length === 0) {
    return 60_000;
  }

  const ttlMs = tier === "pro" ? 30 * 24 * HOUR_MS : 24 * HOUR_MS;
  const hasLessThanHourLeft = items.some((item) => {
    if (item.file_deleted) return false;
    const remainingMs = new Date(item.created_at).getTime() + ttlMs - Date.now();
    return remainingMs > 0 && remainingMs < HOUR_MS;
  });

  return hasLessThanHourLeft ? 10_000 : 60_000;
};

export const LibraryPage = () => {
  const { t, i18n } = useTranslation();
  const { telegramId: telegramUserId } = useTelegram();
  const telegramId = useMemo(() => telegramUserId ?? FALLBACK_TELEGRAM_ID, [telegramUserId]);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const renderStorageLabel = (item: Generation) => {
    const remaining = getRemainingStorageInfo(item.created_at, userTier, Boolean(item.file_deleted));
    if (remaining.kind === "file_deleted") {
      return t("generation.fileDeleted");
    }
    if (remaining.kind === "permanent") {
      return t("generation.permanentlyStored");
    }
    if (remaining.kind === "less_than_hour") {
      return t("generation.willBeDeletedLessThanHour");
    }
    return t("generation.willBeDeleted", { hours: remaining.hours, minutes: remaining.minutes });
  };

  const [items, setItems] = useState<Generation[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [userTier, setUserTier] = useState<UserTier>("free");
  const [offset, setOffset] = useState(0);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setTimeTick] = useState(() => Date.now());
  const [isTabVisible, setIsTabVisible] = useState(() => document.visibilityState === "visible");

  const loadGenerations = useCallback(async (nextOffset = 0, append = false) => {
    if (!telegramId) {
      setError(t("generate.telegramMissing"));
      return;
    }

    setError(null);
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoadingInitial(true);
    }

    try {
      const data = await fetchGenerations(telegramId, PAGE_SIZE, nextOffset);
      setUserTier(data.userTier ?? "free");
      setItems((prev) => (append ? [...prev, ...data.generations] : data.generations));
      setOffset(nextOffset + data.generations.length);
      setHasMore(data.generations.length === PAGE_SIZE);
    } catch (_requestError) {
      setError(t("library.loadError"));
      if (!append) {
        setItems([]);
      }
    } finally {
      setIsLoadingInitial(false);
      setIsLoadingMore(false);
    }
  }, [t, telegramId]);

  useEffect(() => {
    void loadGenerations(0, false);
  }, [loadGenerations]);

  useEffect(() => {
    const loadVoices = async () => {
      try {
        const data = await getVoices();
        setVoices(data.voices ?? []);
      } catch (_error) {
        setVoices([]);
      }
    };

    void loadVoices();
  }, []);

  useEffect(() => {
    const refreshMs = getRefreshIntervalMs(items, userTier);
    if (!isTabVisible) {
      return;
    }

    const timerId = window.setInterval(() => {
      setTimeTick(Date.now());
    }, refreshMs);

    return () => {
      window.clearInterval(timerId);
    };
  }, [isTabVisible, items, userTier]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === "visible";
      setIsTabVisible(visible);
      if (visible) {
        setTimeTick(Date.now());
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const voiceNameById = useMemo(
    () => new Map(voices.map((voice) => [voice.voice_id, voice.name])),
    [voices]
  );

  const loadMore = useCallback(() => {
    if (isLoadingInitial || isLoadingMore || !hasMore) {
      return;
    }

    void loadGenerations(offset, true);
  }, [hasMore, isLoadingInitial, isLoadingMore, loadGenerations, offset]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "120px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <AppPage>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("library.title")}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">{t("library.subtitle")}</p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <p>{error}</p>
          <Button className="mt-3" variant="secondary" onClick={() => void loadGenerations(0, false)}>
            {t("common.retry")}
          </Button>
        </div>
      ) : null}

      {isLoadingInitial ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <Spinner />
          <span>{t("library.loading")}</span>
        </div>
      ) : null}

      {!isLoadingInitial && !error && items.length === 0 ? (
        <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t("library.emptyTitle")}</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{t("library.empty")}</p>
        </div>
      ) : null}

      {!isLoadingInitial && items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="text-sm leading-relaxed text-slate-900 dark:text-slate-100">
                {truncateText(item.text, t("library.noText"))}
              </p>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 dark:border-slate-700 dark:bg-slate-950">
                  <CalendarDays size={14} className="shrink-0" />
                  {formatDateTime(item.created_at, i18n.language)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                  <AudioWaveform size={14} className="shrink-0" />
                  {(item.voice_id && voiceNameById.get(item.voice_id)) || item.voice_id || t("library.unknownVoice")}
                </span>
              </div>

              <div
                className={`inline-flex items-center gap-1 text-xs ${
                  isExpiringSoon(item.created_at, userTier, Boolean(item.file_deleted))
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <Clock3 size={14} />
                <span>{renderStorageLabel(item)}</span>
              </div>

              <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                {canDownload(item) ? (
                  <Button
                    variant="secondary"
                    className="w-full sm:w-auto"
                    onClick={() => window.open(item.audio_url as string, "_blank", "noopener,noreferrer")}
                  >
                    {t("library.download")}
                  </Button>
                ) : (
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t("generation.fileDeleted")}</span>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {!isLoadingInitial && hasMore && items.length > 0 ? (
        <div className="pt-1">
          <div ref={loadMoreRef} className="h-1 w-full" />
          <Button className="w-full gap-2" variant="secondary" onClick={loadMore} disabled={isLoadingMore}>
            {isLoadingMore ? (
              <>
                <Spinner />
                {t("common.loading")}
              </>
            ) : (
              t("library.loadMore")
            )}
          </Button>
        </div>
      ) : null}
    </AppPage>
  );
};
