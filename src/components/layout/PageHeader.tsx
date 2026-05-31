import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

type PageHeaderProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
};

export function PageHeader({ icon: Icon, title, subtitle }: PageHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="flex items-start gap-3.5">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 shadow-lg shadow-blue-600/25 dark:shadow-blue-900/40"
        aria-hidden
      >
        <Icon className="h-5 w-5 text-white" strokeWidth={2.25} />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
          {t("app.brand")}
        </p>
        <h1 className="mt-1 text-[1.35rem] font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-50">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 max-w-prose text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}
