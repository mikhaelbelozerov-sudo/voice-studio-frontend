import { FileUp, X } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { trackAnalytics } from "../../../lib/analytics";

interface TextEditorProps {
  value: string;
  maxLength?: number;
  onChange: (value: string) => void;
}

function normalizeImportedText(raw: string): string {
  return raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

export const TextEditor = ({ value, onChange, maxLength = 1000 }: TextEditorProps) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileNotice, setFileNotice] = useState<"truncated" | "empty" | "readError" | null>(null);
  const hasText = value.trim().length > 0;

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

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,text/plain"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => void handleFileChange(e)}
      />
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t("voice.text")}</h2>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {value.length}/{maxLength}
          </span>
          <button
            type="button"
            onClick={handlePickFile}
            className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-50"
            aria-label={t("voice.loadFromFileAria")}
            title={t("voice.loadFromFileHint")}
          >
            <FileUp size={16} className="shrink-0" />
            <span className="max-w-[7rem] truncate sm:max-w-none">{t("voice.loadFromFile")}</span>
          </button>
          {hasText ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
              aria-label={t("voice.clearText")}
              title={t("voice.clearText")}
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
      </div>
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
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("voice.textPlaceholder")}
        rows={6}
        enterKeyHint="done"
        className="vs-text-input min-h-36 w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
    </div>
  );
};
