import { UserTier } from "../services/api";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export type RemainingStorageInfo =
  | { kind: "file_deleted" }
  | { kind: "permanent" }
  | { kind: "minutes_left"; minutes: number }
  | { kind: "time_left"; hours: number; minutes: number };

const remainingMinutesUntilDeletion = (remainingMs: number): number => {
  if (remainingMs <= 0) {
    return 0;
  }
  return Math.max(1, Math.ceil(remainingMs / (60 * 1000)));
};

export type SubscriptionRemainingInfo =
  | { kind: "inactive" }
  | { kind: "expired" }
  | { kind: "active"; days: number; hours: number };

export const getRemainingStorageInfo = (
  createdAt: string,
  tier: UserTier,
  fileDeleted = false
): RemainingStorageInfo => {
  if (fileDeleted) {
    return { kind: "file_deleted" };
  }

  if (tier === "premium") {
    return { kind: "permanent" };
  }

  const ttlMs = tier === "pro" ? 30 * DAY_MS : DAY_MS;
  const remainingMs = new Date(createdAt).getTime() + ttlMs - Date.now();

  if (remainingMs <= 0) {
    return { kind: "minutes_left", minutes: 0 };
  }

  const totalMinutes = Math.floor(remainingMs / (60 * 1000));
  if (totalMinutes < 60) {
    return { kind: "minutes_left", minutes: remainingMinutesUntilDeletion(remainingMs) };
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { kind: "time_left", hours, minutes };
};

export const formatRemainingTime = (
  createdAt: string,
  tier: UserTier,
  fileDeleted = false
): string => {
  const info = getRemainingStorageInfo(createdAt, tier, fileDeleted);
  if (info.kind === "file_deleted") return "Файл удалён";
  if (info.kind === "permanent") return "Хранится постоянно";
  if (info.kind === "minutes_left") {
    if (info.minutes <= 0) {
      return "Будет удалён в ближайшее время";
    }
    return `Будет удалён через ${info.minutes} мин.`;
  }
  return `Будет удалён через ${info.hours} ч ${info.minutes} мин`;
};

export const getSubscriptionRemainingInfo = (expiresAt: string | null): SubscriptionRemainingInfo => {
  if (!expiresAt) {
    return { kind: "inactive" };
  }

  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  if (remainingMs <= 0) {
    return { kind: "expired" };
  }

  const totalHours = Math.floor(remainingMs / HOUR_MS);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return { kind: "active", days, hours };
};

export const formatSubscriptionRemaining = (expiresAt: string | null): string => {
  const info = getSubscriptionRemainingInfo(expiresAt);
  if (info.kind === "inactive") return "Не активна";
  if (info.kind === "expired") return "Истекла";
  return `${info.days} дн. ${info.hours} ч.`;
};

export const isExpiringSoon = (createdAt: string, tier: UserTier, fileDeleted = false): boolean => {
  if (fileDeleted || tier === "premium") {
    return false;
  }

  const ttlMs = tier === "pro" ? 30 * DAY_MS : DAY_MS;
  const remainingMs = new Date(createdAt).getTime() + ttlMs - Date.now();
  const thresholdMs = tier === "free" ? 3 * HOUR_MS : DAY_MS;

  return remainingMs > 0 && remainingMs <= thresholdMs;
};
