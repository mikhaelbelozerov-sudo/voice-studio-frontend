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
  /** 0 = «Поделиться» использует ту же ссылку, что и копирование; иначе при main/https в шаринг идёт t.me/бот/app для превью с кнопкой «Открыть» */
  readonly VITE_REFERRAL_SHARE_TELEGRAM_CARD?: string;
  /** 1 = в t.me/share/url снова добавить text= (подпись); часто ломает превью Mini App с кнопкой «Открыть» */
  readonly VITE_REFERRAL_SHARE_INCLUDE_CAPTION?: string;
  /** https | tme = использовать https://t.me/share/url вместо tg://msg_url */
  readonly VITE_REFERRAL_SHARE_LINK_FORMAT?: string;
  /** 0 = не использовать savePreparedInlineMessage + WebApp.shareMessage (только старый шаринг ссылкой) */
  readonly VITE_REFERRAL_PREPARED_SHARE?: string;
  readonly VITE_PREMIUM_VOICE_IDS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
