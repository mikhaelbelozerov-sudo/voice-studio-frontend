import { ReactNode, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type LayoutProps = {
  children: ReactNode;
};

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const webApp = (window as any).Telegram?.WebApp;
    const backButton = webApp?.BackButton;
    if (!webApp || !backButton) {
      return;
    }

    const handleBack = () => {
      if (location.pathname === "/") {
        webApp.close();
        return;
      }

      if (window.history.length > 1) {
        navigate(-1);
        return;
      }

      webApp.close();
    };

    if (location.pathname === "/") {
      backButton.hide();
    } else {
      backButton.show();
    }

    backButton.onClick(handleBack);

    return () => {
      backButton.offClick(handleBack);
      backButton.hide();
    };
  }, [location.pathname, navigate]);

  return <>{children}</>;
};
