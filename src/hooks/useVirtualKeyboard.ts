import { useCallback, useEffect, useState } from "react";

const FORM_SELECTOR =
  "input:not([type='button']):not([type='submit']):not([type='reset']):not([type='checkbox']):not([type='radio']):not([type='hidden']):not([type='file']), textarea, select, [contenteditable='true']";

function isFormField(el: EventTarget | null): boolean {
  if (!el || !(el instanceof Element)) {
    return false;
  }
  return el.matches(FORM_SELECTOR) || el.closest(FORM_SELECTOR) !== null;
}

function isTextLikeField(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) {
    return false;
  }
  if (el.tagName === "TEXTAREA") {
    return true;
  }
  if (el.tagName === "INPUT") {
    const type = (el as HTMLInputElement).type?.toLowerCase() || "text";
    return !["button", "submit", "reset", "checkbox", "radio", "hidden", "file"].includes(type);
  }
  return false;
}

/** Telegram иногда оставляет padding-bottom на <html> после MainButton — даёт чёрную полосу при скролле. */
export function clearTelegramWebViewChromePadding(): void {
  const root = document.documentElement;
  root.style.paddingBottom = "";
  root.style.boxSizing = "";
}

function hideTelegramKeyboard(): void {
  const wtg = (window as { Telegram?: { WebApp?: { hideKeyboard?: () => void } } }).Telegram?.WebApp;
  if (typeof wtg?.hideKeyboard !== "function") {
    return;
  }
  try {
    wtg.hideKeyboard();
  } catch {
    /* */
  }
}

function readKeyboardUiState(): { open: boolean; showDone: boolean } {
  const active = document.activeElement;
  const textLike = isTextLikeField(active);
  const selectOpen = active instanceof HTMLElement && active.tagName === "SELECT";
  return {
    open: textLike,
    showDone: textLike && !selectOpen
  };
}

/**
 * Скрывает нижний таббар при наборе текста (класс vs-keyboard-open на html)
 * и даёт способ закрыть клавиатуру (кнопка «Готово» под полем ввода, не fixed).
 */
export function useVirtualKeyboard() {
  const [isKeyboardOpen, setKeyboardOpen] = useState(false);
  const [showKeyboardDone, setShowKeyboardDone] = useState(false);

  const dismissKeyboard = useCallback(() => {
    hideTelegramKeyboard();
    const ae = document.activeElement;
    if (ae instanceof HTMLElement) {
      ae.blur();
    }
    clearTelegramWebViewChromePadding();
    document.documentElement.classList.remove("vs-keyboard-open");
    setKeyboardOpen(false);
    setShowKeyboardDone(false);
  }, []);

  useEffect(() => {
    clearTelegramWebViewChromePadding();
    try {
      const wtg = (window as { Telegram?: { WebApp?: { MainButton?: { hide: () => void } } } }).Telegram?.WebApp;
      wtg?.MainButton?.hide();
    } catch {
      /* */
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const applyUiState = (open: boolean, showDone: boolean) => {
      setKeyboardOpen(open);
      setShowKeyboardDone(showDone);
      root.classList.toggle("vs-keyboard-open", open);
      if (!open) {
        clearTelegramWebViewChromePadding();
      }
    };

    const syncFromActiveElement = () => {
      const { open, showDone } = readKeyboardUiState();
      applyUiState(open, showDone);
    };

    const onFocusIn = (event: FocusEvent) => {
      if (!isFormField(event.target)) {
        return;
      }
      if (hideTimer !== undefined) {
        clearTimeout(hideTimer);
        hideTimer = undefined;
      }
      clearTelegramWebViewChromePadding();
      const { open, showDone } = readKeyboardUiState();
      applyUiState(open, showDone);

      const focusTarget = event.target;
      if (focusTarget instanceof HTMLTextAreaElement) {
        window.setTimeout(() => {
          focusTarget.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }, 280);
      }
    };

    const onFocusOut = () => {
      if (hideTimer !== undefined) {
        clearTimeout(hideTimer);
      }
      hideTimer = window.setTimeout(() => {
        hideTimer = undefined;
        syncFromActiveElement();
        clearTelegramWebViewChromePadding();
      }, 250);
    };

    const onScrollOrTouch = () => {
      clearTelegramWebViewChromePadding();
      if (!isTextLikeField(document.activeElement)) {
        return;
      }
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) {
        return;
      }
      const rect = active.getBoundingClientRect();
      const vv = window.visualViewport;
      const visibleBottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
      if (rect.bottom < -40 || rect.top > visibleBottom + 40) {
        dismissKeyboard();
      }
    };

    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("focusout", onFocusOut, true);
    window.addEventListener("scroll", onScrollOrTouch, { passive: true, capture: true });
    window.addEventListener("touchmove", onScrollOrTouch, { passive: true, capture: true });

    const tg = (window as {
      Telegram?: { WebApp?: { onEvent?: (n: string, h: () => void) => void; offEvent?: (n: string, h: () => void) => void } };
    }).Telegram?.WebApp;
    const onViewport = () => clearTelegramWebViewChromePadding();
    tg?.onEvent?.("viewportChanged", onViewport);

    return () => {
      document.removeEventListener("focusin", onFocusIn, true);
      document.removeEventListener("focusout", onFocusOut, true);
      window.removeEventListener("scroll", onScrollOrTouch, true);
      window.removeEventListener("touchmove", onScrollOrTouch, true);
      tg?.offEvent?.("viewportChanged", onViewport);
      if (hideTimer !== undefined) {
        clearTimeout(hideTimer);
      }
      applyUiState(false, false);
      clearTelegramWebViewChromePadding();
    };
  }, [dismissKeyboard]);

  return { isKeyboardOpen, showKeyboardDone, dismissKeyboard };
}
