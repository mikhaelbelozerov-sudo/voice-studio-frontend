import { useCallback, useEffect, useState } from "react";

const FORM_SELECTOR =
  "input:not([type='button']):not([type='submit']):not([type='reset']):not([type='checkbox']):not([type='radio']):not([type='hidden']):not([type='file']), textarea, select, [contenteditable='true']";

function isFormField(el: EventTarget | null): boolean {
  if (!el || !(el instanceof Element)) {
    return false;
  }
  return el.matches(FORM_SELECTOR) || el.closest(FORM_SELECTOR) !== null;
}

/** Поля, где пользователь набирает текст озвучки (кнопка «Готово» на MainButton). */
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

function hideTelegramKeyboard(): void {
  const wtg = (window as { Telegram?: { WebApp?: { hideKeyboard?: () => void } } }).Telegram?.WebApp;
  if (typeof wtg?.hideKeyboard !== "function") {
    return;
  }
  try {
    wtg.hideKeyboard();
  } catch {
    /* Bot API < 9.1 или не Mini App */
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
 * и даёт способ программно закрыть клавиатуру (MainButton «Готово» в App).
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
    document.documentElement.classList.remove("vs-keyboard-open");
    setKeyboardOpen(false);
    setShowKeyboardDone(false);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const applyUiState = (open: boolean, showDone: boolean) => {
      setKeyboardOpen(open);
      setShowKeyboardDone(showDone);
      root.classList.toggle("vs-keyboard-open", open);
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
      const { open, showDone } = readKeyboardUiState();
      applyUiState(open, showDone);
    };

    const onFocusOut = () => {
      if (hideTimer !== undefined) {
        clearTimeout(hideTimer);
      }
      hideTimer = window.setTimeout(() => {
        hideTimer = undefined;
        syncFromActiveElement();
      }, 250);
    };

    const vv = window.visualViewport;
    const onViewportResize = () => {
      if (!vv) {
        return;
      }
      /**
       * Пока поле в фокусе, viewport может ещё не сжаться (клавиатура анимируется)
       * или на части клиентов ratio не падает ниже 0.72 — нельзя вызывать applyOpen(false),
       * иначе пропадает MainButton «Готово».
       */
      if (!isTextLikeField(document.activeElement)) {
        return;
      }
      const ratio = vv.height / window.innerHeight;
      if (ratio < 0.72) {
        applyUiState(true, true);
      }
    };

    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("focusout", onFocusOut, true);
    vv?.addEventListener("resize", onViewportResize);

    return () => {
      document.removeEventListener("focusin", onFocusIn, true);
      document.removeEventListener("focusout", onFocusOut, true);
      vv?.removeEventListener("resize", onViewportResize);
      if (hideTimer !== undefined) {
        clearTimeout(hideTimer);
      }
      applyUiState(false, false);
    };
  }, []);

  return { isKeyboardOpen, showKeyboardDone, dismissKeyboard };
}
