import { useEffect } from "react";

const FORM_SELECTOR = "input:not([type='button']):not([type='submit']):not([type='reset']):not([type='checkbox']):not([type='radio']):not([type='hidden']), textarea, select, [contenteditable='true']";

function isFormField(el: EventTarget | null): boolean {
  if (!el || !(el instanceof Element)) {
    return false;
  }
  return el.matches(FORM_SELECTOR) || el.closest(FORM_SELECTOR) !== null;
}

/**
 * Скрывает нижнее меню при открытой клавиатуре (фокус в поле ввода), чтобы таббар не висел над клавиатурой.
 */
export function useHideBottomNavOnKeyboard(): void {
  useEffect(() => {
    const root = document.documentElement;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const setOpen = (open: boolean) => {
      root.classList.toggle("vs-keyboard-open", open);
    };

    const onFocusIn = (event: FocusEvent) => {
      if (isFormField(event.target)) {
        if (hideTimer !== undefined) {
          clearTimeout(hideTimer);
          hideTimer = undefined;
        }
        setOpen(true);
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
      if (!vv) {
        return;
      }
      const ratio = vv.height / window.innerHeight;
      const keyboardLikely = ratio < 0.72;
      if (keyboardLikely && isFormField(document.activeElement)) {
        setOpen(true);
      } else if (!keyboardLikely && !isFormField(document.activeElement)) {
        setOpen(false);
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
      setOpen(false);
    };
  }, []);
}
