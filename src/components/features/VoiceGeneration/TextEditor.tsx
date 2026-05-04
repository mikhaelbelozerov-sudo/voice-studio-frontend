import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TextEditorProps {
  value: string;
  maxLength?: number;
  onChange: (value: string) => void;
}

export const TextEditor = ({ value, onChange, maxLength = 1000 }: TextEditorProps) => {
  const { t } = useTranslation();
  const hasText = value.trim().length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t("voice.text")}</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {value.length}/{maxLength}
          </span>
          {hasText ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
              aria-label={t("voice.clearText")}
              title={t("voice.clearText")}
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
      </div>
      <textarea
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("voice.textPlaceholder")}
        className="min-h-36 w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
    </div>
  );
};
