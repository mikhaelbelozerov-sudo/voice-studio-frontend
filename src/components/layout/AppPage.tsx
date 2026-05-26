import { ReactNode } from "react";

type AppPageProps = {
  children: ReactNode;
  className?: string;
};

/** Обёртка страницы: отступ снизу даёт .app-main; маркер — для ограничения прокрутки. */
export function AppPage({ children, className = "space-y-5" }: AppPageProps) {
  return (
    <div className={className}>
      {children}
      <div className="app-page-scroll-end" aria-hidden="true" />
    </div>
  );
}
