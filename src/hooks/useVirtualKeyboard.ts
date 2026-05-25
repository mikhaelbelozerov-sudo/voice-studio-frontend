import { useCallback, useEffect, useState } from "react";

const FORM_SELECTOR =
  "input:not([type='button']):not([type='submit']):not([type='reset']):not([type='checkbox']):not([type='radio']):not([type='hidden']):not([type='file']), textarea, select, [contenteditable='true']";

function isFormField(el: EventTarget | null): boolean {
  if (!el || !(el instanceof Element)) {
    return false;
  }
  return el.matches(FORM_SELECTOR) || el.closest(FORM_SELECTOR) !== null;
}

function hideTelegramKeyboard(): void {
  const wtg = (window as { Telegram?: { WebApp?: { hideKeyboard?: () => void } } }).Telegram?.WebApp;
  if (typeof wtg?.hideKeyboard !== "function") {
    return;
  }
  try {
    wtg.hideKeyboard();
  } catch {
    /* Bot API < 9.1 */
  }
}

/**
 * MainButton «Готово» в App + класс vs-keyboard-open (скрывает нижний таббар при вводе).
 */
export function useVirtualKeyboard() {
  const [isKeyboardOpen, setKeyboardOpen] = useState(false);

  const dismissKeyboard = useCallback(() => {
    hideTelegramKeyboard();
    const ae = document.activeElement;
    if (ae instanceof HTMLElement) {
      ae.blur();
    }
    document.documentElement.classList.remove("vs-keyboard-open");
    setKeyboardOpen(false);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const applyOpen = (open: boolean) => {
      setKeyboardOpen(open);
      root.classList.toggle("vs-keyboard-open", open);
    };

    const onFocusIn = (event: FocusEvent) => {
      if (isFormField(event.target)) {
        if (hideTimer !== undefined) {
          clearTimeout(hideTimer);
          hideTimer = undefined;
        }
        applyOpen(true);
      }
    };

    const onFocusOut = () => {
      if (hideTimer !== undefined) {
        clearTimeout(hideTimer);
      }
      hideTimer = window.setTimeout(() => {
        hideTimer = undefined;
        if (!isFormField(document.activeElement)) {
          applyOpen(false);
        }
      }, 250);
    };

    const vv = window.visualViewport;
    const onViewportResize = () => {
      if (!isFormField(document.activeElement)) {
        return;
      }
      const ratio = vv ? vv.height / window.innerHeight : 1;
      if (ratio < 0.72) {
        applyOpen(true);
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
      applyOpen(false);
    };
  }, []);

  return { isKeyboardOpen, dismissKeyboard };
}
