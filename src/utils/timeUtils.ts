export type UserTier = "free" | "pro" | "premium";

const FREE_TTL_MS = 24 * 60 * 60 * 1000;
const PRO_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const formatRemainingTime = (createdAt: string, tier: UserTier, fileDeleted = false): string => {
  if (fileDeleted) {
    return "Файл удалён";
  }

  if (tier === "premium") {
    return "Хранится постоянно";
  }

  const ttlMs = tier === "pro" ? PRO_TTL_MS : FREE_TTL_MS;
  const expiresAtMs = new Date(createdAt).getTime() + ttlMs;
  const remainingMs = expiresAtMs - Date.now();

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

  const totalHours = Math.floor(remainingMs / (60 * 60 * 1000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return `Будет удалён через ${days} дн. ${hours} ч.`;
};

export const isExpiringSoon = (createdAt: string, tier: UserTier, fileDeleted = false): boolean => {
  if (fileDeleted || tier === "premium") {
    return false;
  }

  const ttlMs = tier === "pro" ? PRO_TTL_MS : FREE_TTL_MS;
  const remainingMs = new Date(createdAt).getTime() + ttlMs - Date.now();
  const thresholdMs = tier === "free" ? 3 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

  return remainingMs > 0 && remainingMs <= thresholdMs;
};
