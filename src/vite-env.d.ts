/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SUPPORT_TELEGRAM_LINK?: string;
  readonly VITE_PRO_CREATOR_STARS?: string;
  /** Bot username without @ — for invite links */
  readonly VITE_TELEGRAM_BOT_USERNAME?: string;
  /** Mini App short name from BotFather (e.g. app). Default: app */
  readonly VITE_TELEGRAM_MINI_APP_SLUG?: string;
  /** named | main | https (env alias: web → https). https requires VITE_PUBLIC_MINI_APP_ORIGIN */
  readonly VITE_REFERRAL_LINK_MODE?: string;
  /** HTTPS origin of Mini App (BotFather URL), e.g. https://xxx.vercel.app — for REFERRAL_LINK_MODE=https */
  readonly VITE_PUBLIC_MINI_APP_ORIGIN?: string;
  readonly VITE_PREMIUM_VOICE_IDS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
