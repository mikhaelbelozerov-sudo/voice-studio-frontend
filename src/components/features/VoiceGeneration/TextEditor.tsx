import { AlignLeft, FileUp, X } from "lucide-react";
import { useCallback, useRef, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useTelegram } from "../../../hooks/useTelegram";
import { trackAnalytics } from "../../../lib/analytics";
import { applyTelegramViewportLayout, ensureFieldVisibleInViewport } from "../../../utils/telegramWebView";

interface TextEditorProps {
  value: string;
  maxLength?: number;
  etaSeconds: number;
  onChange: (value: string) => void;
}

function normalizeImportedText(raw: string): string {
  return raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

export const TextEditor = ({ value, onChange, maxLength = 1000, etaSeconds }: TextEditorProps) => {
  const { t } = useTranslation();
  const { theme } = useTelegram();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [fileNotice, setFileNotice] = useState<"truncated" | "empty" | "readError" | null>(null);
  const hasText = value.trim().length > 0;
  const displayEta = hasText ? Math.max(1, etaSeconds) : 0;

  const repairKeyboardViewport = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    applyTelegramViewportLayout(theme);
    ensureFieldVisibleInViewport(textarea);
  }, [theme]);

  const clearFileNoticeSoon = () => {
    window.setTimeout(() => setFileNotice(null), 6000);
  };

  const handlePickFile = () => {
    setFileNotice(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    input.value = "";
    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const normalized = normalizeImportedText(raw);
      if (!normalized) {
        setFileNotice("empty");
        clearFileNoticeSoon();
        return;
      }
      let next = normalized;
      let truncated = false;
      if (next.length > maxLength) {
        next = next.slice(0, maxLength);
        truncated = true;
      }
      onChange(next);
      trackAnalytics("script_imported_from_file", {
        chars: next.length,
        truncated,
        mime: file.type || null
      });
      if (truncated) {
        setFileNotice("truncated");
        clearFileNoticeSoon();
      }
    } catch {
      setFileNotice("readError");
      clearFileNoticeSoon();
    }
  };

  const handleTextareaFocus = () => {
    repairKeyboardViewport();
    requestAnimationFrame(repairKeyboardViewport);
    window.setTimeout(repairKeyboardViewport, 280);
  };

  const handleTextareaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
    repairKeyboardViewport();
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,text/plain"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => void handleFileChange(e)}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <AlignLeft className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t("voice.scriptTitle")}</h2>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{t("voice.scriptHint")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
            {value.length}/{maxLength}
          </span>
          <button
            type="button"
            onClick={handlePickFile}
            className="inline-flex h-8 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            aria-label={t("voice.loadFromFileAria")}
            title={t("voice.loadFromFileHint")}
          >
            <FileUp size={16} className="shrink-0" />
            <span className="max-w-[5rem] truncate sm:max-w-none">{t("voice.loadFromFile")}</span>
          </button>
          {hasText ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
              aria-label={t("voice.clearText")}
              title={t("voice.clearText")}
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        {fileNotice ? (
          <p
            className="text-xs text-amber-800 dark:text-amber-200"
            role={fileNotice === "empty" || fileNotice === "readError" ? "alert" : "status"}
          >
            {fileNotice === "truncated"
              ? t("voice.fileTruncated", { max: maxLength })
              : fileNotice === "empty"
                ? t("voice.fileEmpty")
                : t("voice.fileReadError")}
          </p>
        ) : null}
        <textarea
          ref={textareaRef}
          value={value}
          maxLength={maxLength}
          onChange={handleTextareaChange}
          onFocus={handleTextareaFocus}
          placeholder={t("voice.textPlaceholder")}
          rows={6}
          enterKeyHint="done"
          className="vs-text-input min-h-36 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
      </div>

      <div
        className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs dark:border-slate-800"
        role="status"
        aria-live="polite"
      >
        <span className="font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {t("generate.estimatedNarration")}
        </span>
        <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-50">
          {hasText ? (
            <>
              ~{displayEta}s {t("generate.audioForScript")}
            </>
          ) : (
            <span className="font-normal text-slate-400 dark:text-slate-500">{t("voice.scriptEtaEmpty")}</span>
          )}
        </span>
      </div>
    </div>
  );
};
