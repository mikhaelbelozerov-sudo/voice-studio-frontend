import { useTranslation } from "react-i18next";

export const TEXT_PREVIEW_MAX_LENGTH = 100;

type GenerationHistoryTextProps = {
  text: string | null;
  expanded: boolean;
  copied: boolean;
  onToggleExpand: () => void;
  onCopy: () => void;
};

export function isTextTruncated(text: string | null, maxLength = TEXT_PREVIEW_MAX_LENGTH): boolean {
  return Boolean(text && text.length > maxLength);
}

export function GenerationHistoryText({
  text,
  expanded,
  copied,
  onToggleExpand,
  onCopy
}: GenerationHistoryTextProps) {
  const { t } = useTranslation();
  const emptyText = t("library.noText");
  const hasText = Boolean(text?.trim());
  const truncated = isTextTruncated(text);
  const displayText =
    !hasText || !text
      ? emptyText
      : expanded || !truncated
        ? text
        : `${text.slice(0, TEXT_PREVIEW_MAX_LENGTH)}…`;

  return (
    <div className="space-y-2">
      <p
        className={`text-sm leading-relaxed text-slate-900 dark:text-slate-100 ${
          expanded && hasText ? "whitespace-pre-wrap break-words" : ""
        }`}
      >
        {displayText}
      </p>
      {hasText && truncated ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <button
            type="button"
            onClick={onToggleExpand}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {expanded ? t("library.collapseText") : t("library.showFullText")}
          </button>
          {expanded ? (
            <button
              type="button"
              onClick={onCopy}
              className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              {copied ? t("library.textCopied") : t("library.copyText")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
