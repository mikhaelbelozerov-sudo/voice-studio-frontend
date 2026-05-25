import { Button } from "./Button";

type KeyboardDoneBarProps = {
  visible: boolean;
  label: string;
  onDone: () => void;
};

/**
 * «Готово» внутри WebView (не Telegram MainButton).
 * В Mini App при открытой клавиатуре WebView уже сжимается — панель внизу экрана (bottom: 0),
 * без расчёта visualViewport.offsetTop (он поднимал кнопку слишком высоко).
 */
export function KeyboardDoneBar({ visible, label, onDone }: KeyboardDoneBarProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] mx-auto max-w-3xl px-4 pb-[max(env(safe-area-inset-bottom,0px),var(--tg-content-safe-area-inset-bottom,0px))]"
      role="presentation"
    >
      <div className="pointer-events-auto border-t border-slate-200 bg-slate-100 px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
        <Button type="button" className="h-11 w-full text-base font-semibold" onClick={onDone}>
          {label}
        </Button>
      </div>
    </div>
  );
}
