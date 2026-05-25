export type AppTheme = "light" | "dark";

/** Совпадает с Tailwind bg-slate-100 / dark:bg-slate-950 */
export const APP_SCREEN_BG: Record<AppTheme, `#${string}`> = {
  light: "#f1f5f9",
  dark: "#020617"
};
