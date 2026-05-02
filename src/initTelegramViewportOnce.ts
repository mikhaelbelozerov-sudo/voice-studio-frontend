import WebApp from "@twa-dev/sdk";

let telegramViewportInitialized = false;

/**
 * Вызывает WebApp.ready() и при необходимости WebApp.expand() ровно один раз за загрузку страницы.
 * Раньше expand дублировался из каждого экземпляра useTelegram и при смене темы — это могло
 * приводить к повторным сигналам в нативный клиент и эффекту «накладывающихся» окон.
 */
export function initTelegramViewportOnce(): void {
  if (telegramViewportInitialized) {
    return;
  }
  telegramViewportInitialized = true;

  WebApp.ready();

  const alreadyExpanded = WebApp.isExpanded === true;
  if (!alreadyExpanded) {
    WebApp.expand();
  }
}
