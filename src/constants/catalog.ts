/** Must match backend `PRO_CREATOR_STARS_PRICE` (Render env). */
export const PRO_CREATOR_STARS_PRICE = (() => {
  const raw = import.meta.env.VITE_PRO_CREATOR_STARS;
  const n = raw != null && raw !== "" ? Number.parseInt(String(raw), 10) : Number.NaN;
  return Number.isFinite(n) && n > 0 ? n : 1199;
})();
