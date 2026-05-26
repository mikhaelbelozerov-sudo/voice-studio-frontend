import { useCallback, useEffect, useRef, useState } from "react";
import { isTelegramKeyboardLikelyOpen, scheduleKeyboardViewportRepair } from "../utils/telegramWebView";

const FORM_SELECTOR =
  "input:not([type='button']):not([type='submit']):not([type='reset']):not([type='checkbox']):not([type='radio']):not([type='hidden']):not([type='file']), textarea, select, [contenteditable='true']";

function isFormField(el: EventTarget | null): boolean {
  if (!el || !(el instanceof Element)) {
    return false;
  }
  return el.matches(FORM_SELECTOR) || el.closest(FORM_SELECTOR) !== null;
}

function resolveFormField(el: EventTarget | null): HTMLElement | null {
  if (!el || !(el instanceof Element)) {
    return null;
  }
  if (el instanceof HTMLElement && el.matches(FORM_SELECTOR)) {
    return el;
  }
  return el.closest<HTMLElement>(FORM_SELECTOR);
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

/** Состояние клавиатуры для MainButton «Готово»; нижнее меню не скрываем (иначе чёрная полоса). */
export function useVirtualKeyboard() {
  const [isKeyboardOpen, setKeyboardOpen] = useState(false);
  const viewportRepairTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>();

  const dismissKeyboard = useCallback(() => {
    hideTelegramKeyboard();
    const ae = document.activeElement;
    if (ae instanceof HTMLElement) {
      ae.blur();
    }
    setKeyboardOpen(false);
  }, []);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const setOpen = (open: boolean) => {
      setKeyboardOpen(open);
    };

    const onFocusIn = (event: FocusEvent) => {
      const field = resolveFormField(event.target);
      if (!field) {
        return;
      }
      if (hideTimer !== undefined) {
        clearTimeout(hideTimer);
        hideTimer = undefined;
      }
      setOpen(true);
      if (field.classList.contains("vs-text-input")) {
        scheduleKeyboardViewportRepair(field);
      }
    };

    const onFocusOut = () => {
      if (hideTimer !== undefined) {
        clearTimeout(hideTimer);
      }
      hideTimer = window.setTimeout(() => {
        hideTimer = undefined;
        if (!isFormField(document.activeElement)) {
          setOpen(false);
        }
      }, 250);
    };

    const vv = window.visualViewport;
    const onViewportResize = () => {
      const field = resolveFormField(document.activeElement);
      if (!field?.classList.contains("vs-text-input")) {
        return;
      }
      if (isTelegramKeyboardLikelyOpen()) {
        setOpen(true);
      }
      if (viewportRepairTimerRef.current !== undefined) {
        clearTimeout(viewportRepairTimerRef.current);
      }
      viewportRepairTimerRef.current = window.setTimeout(() => {
        viewportRepairTimerRef.current = undefined;
        if (isTelegramKeyboardLikelyOpen()) {
          scheduleKeyboardViewportRepair(field);
        }
      }, 120);
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
      if (viewportRepairTimerRef.current !== undefined) {
        clearTimeout(viewportRepairTimerRef.current);
      }
      setOpen(false);
    };
  }, []);

  return { isKeyboardOpen, dismissKeyboard };
}
