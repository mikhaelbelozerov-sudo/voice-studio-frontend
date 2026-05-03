import { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
};

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="app-layout flex min-h-full flex-1 flex-col">
      {children}
    </div>
  );
};
