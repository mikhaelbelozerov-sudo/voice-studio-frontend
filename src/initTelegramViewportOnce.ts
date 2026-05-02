import WebApp from "@twa-dev/sdk";

/** В `.env`: `VITE_DISABLE_TG_EXPAND=true` — только `ready()`, без `expand()` (если баг клиента сохраняется). */
const disableExpand = import.meta.env.VITE_DISABLE_TG_EXPAND === "true";

let sessionInitialized = false;

/**
 * Один раз за сессию: ready() сразу; expand() — только после стабильного viewport (или по таймауту),
 * и сам expand не чаще одного раза. Так обходим баг официального скрипта: до первого viewport_changed
 * геттер isExpanded по умолчанию true, из‑за чего ранняя проверка «уже развёрнуто» давала гонки и
 * повторные вызовы expand в неудачный момент (в т.ч. ощущение «второго окна» в клиенте Telegram).
 */
export function initTelegramViewportOnce(): void {
  if (sessionInitialized) {
    return;
  }
  sessionInitialized = true;

  WebApp.ready();

  let expandCommitted = false;
  const scheduleExpandOnce = () => {
    if (expandCommitted) {
      return;
    }
    expandCommitted = true;
    if (disableExpand) {
      return;
    }
    requestAnimationFrame(() => {
      try {
        if (!WebApp.isExpanded) {
          WebApp.expand();
        }
      } catch {
        /* мост недоступен вне клиента */
      }
    });
  };

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let cleanedUp = false;

  const cleanup = () => {
    if (cleanedUp) {
      return;
    }
    cleanedUp = true;
    WebApp.offEvent("viewportChanged", onViewportStable);
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  };

  const onViewportStable = (params: { isStateStable: boolean }) => {
    if (!params.isStateStable) {
      return;
    }
    cleanup();
    scheduleExpandOnce();
  };

  WebApp.onEvent("viewportChanged", onViewportStable);
  timeoutId = setTimeout(() => {
    timeoutId = undefined;
    cleanup();
    scheduleExpandOnce();
  }, 800);
}
