import { UserTier } from "../services/api";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const formatRemainingTime = (
  createdAt: string,
  tier: UserTier,
  fileDeleted = false
): string => {
  if (fileDeleted) {
    return "Файл удалён";
  }

  if (tier === "premium") {
    return "Бессрочно";
  }

  const ttlMs = tier === "pro" ? 30 * DAY_MS : DAY_MS;
  const remainingMs = new Date(createdAt).getTime() + ttlMs - Date.now();

  if (remainingMs <= 0) {
    return "Удаляется менее чем через час";
  }

  if (tier === "free") {
    const totalMinutes = Math.floor(remainingMs / (60 * 1000));
    if (totalMinutes < 60) {
      return "Удаляется менее чем через час";
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `Будет удалён через ${hours} ч. ${minutes} мин.`;
  }

  const totalHours = Math.floor(remainingMs / HOUR_MS);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return `Будет удалён через ${days} дн. ${hours} ч.`;
};

export const formatSubscriptionRemaining = (expiresAt: string | null): string => {
  if (!expiresAt) {
    return "Не активна";
  }

  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  if (remainingMs <= 0) {
    return "Истекла";
  }

  const totalHours = Math.floor(remainingMs / HOUR_MS);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return `${days} дн. ${hours} ч.`;
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
