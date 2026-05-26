import { ReactNode } from "react";

type AppPageProps = {
  children: ReactNode;
  className?: string;
};

/** Обёртка страницы: нижний spacer = высота меню (предел прокрутки как у верхнего края). */
export function AppPage({ children, className = "space-y-5" }: AppPageProps) {
  return (
    <div className={className}>
      {children}
      <div className="app-page-bottom-spacer" aria-hidden="true" />
    </div>
  );
}
