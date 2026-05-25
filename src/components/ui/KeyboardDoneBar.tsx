import { useEffect, useState } from "react";
import { Button } from "./Button";

type KeyboardDoneBarProps = {
  visible: boolean;
  label: string;
  onDone: () => void;
};

/**
 * Кнопка «Готово» внутри WebView (не Telegram MainButton) — без чёрной native bottom bar.
 * Позиция привязана к visualViewport, чтобы панель была сразу над клавиатурой.
 */
export function KeyboardDoneBar({ visible, label, onDone }: KeyboardDoneBarProps) {
  const [insetBottom, setInsetBottom] = useState(0);

  useEffect(() => {
    if (!visible) {
      setInsetBottom(0);
      return;
    }

    const update = () => {
      const vv = window.visualViewport;
      if (!vv) {
        setInsetBottom(0);
        return;
      }
      const keyboardAndChrome = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setInsetBottom(Math.round(keyboardAndChrome));
    };

    update();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);

    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[60] mx-auto max-w-3xl px-4"
      style={{ bottom: insetBottom }}
      role="presentation"
    >
      <div className="pointer-events-auto rounded-t-2xl border border-b-0 border-slate-200 bg-slate-100/95 px-3 py-2 shadow-[0_-4px_24px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-700 dark:bg-slate-950/95">
        <Button type="button" className="h-11 w-full text-base font-semibold" onClick={onDone}>
          {label}
        </Button>
      </div>
    </div>
  );
}
