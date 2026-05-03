import { useEffect, useState } from "react";
import { Button } from "./Button";

type KeyboardAccessoryBarProps = {
  visible: boolean;
  doneLabel: string;
  onDismiss: () => void;
};

/**
 * Панель над клавиатурой (не внутри неё — это невозможно в WebView).
 * Позиция по visualViewport, чтобы оказаться сразу над клавиатурой.
 */
export const KeyboardAccessoryBar = ({ visible, doneLabel, onDismiss }: KeyboardAccessoryBarProps) => {
  const [keyboardBottomInset, setKeyboardBottomInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!visible) {
      setKeyboardBottomInset(0);
      return;
    }
    if (!vv) {
      return;
    }
    const update = () => {
      const inset = Math.max(0, window.innerHeight - vv.offsetTop - vv.height);
      setKeyboardBottomInset(inset);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="fixed left-0 right-0 z-[45] flex items-center justify-end border-t border-slate-200 bg-white/95 px-3 py-2 shadow-[0_-4px_14px_rgba(15,23,42,0.12)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-[0_-4px_14px_rgba(0,0,0,0.35)]"
      style={{ bottom: keyboardBottomInset }}
    >
      <Button type="button" variant="primary" className="min-w-[5.5rem] px-4 py-2 text-sm" onClick={onDismiss}>
        {doneLabel}
      </Button>
    </div>
  );
};
