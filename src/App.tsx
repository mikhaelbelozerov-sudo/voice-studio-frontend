import { Home, Library, UserCircle, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Button } from "./components/ui/Button";
import { useTelegram } from "./hooks/useTelegram";
import { GeneratePage } from "./pages/Generate";
import { LibraryPage } from "./pages/Library";
import { PricingPage } from "./pages/Pricing";
import { ProfilePage } from "./pages/Profile";
import { updateUserLanguage } from "./services/api";
import { LANGUAGE_STORAGE_KEY } from "./i18n";

function App() {
  const { t, i18n } = useTranslation();
  const { telegramId } = useTelegram();
  const [showLanguageModal, setShowLanguageModal] = useState(() => !window.localStorage.getItem(LANGUAGE_STORAGE_KEY));

  const navItems = useMemo(
    () => [
      { to: "/generate", label: t("nav.generate"), icon: Home },
      { to: "/library", label: t("nav.library"), icon: Library },
      { to: "/pricing", label: t("nav.pricing"), icon: WalletCards },
      { to: "/profile", label: t("nav.profile"), icon: UserCircle }
    ],
    [t]
  );

  const handleSelectLanguage = async (language: "ru" | "en") => {
    await i18n.changeLanguage(language);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    setShowLanguageModal(false);
    if (telegramId) {
      try {
        await updateUserLanguage({ telegramId, language });
      } catch (_error) {
        // Язык в UI уже применён локально, сетевую ошибку игнорируем.
      }
    }
  };

  return (
    <Layout>
      <div className="app-main mx-auto min-h-screen w-full max-w-3xl bg-slate-100 px-4 pt-2 dark:bg-slate-950">
        <Routes>
          <Route path="/" element={<Navigate to="/generate" replace />} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>

        <nav className="app-bottom-nav fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div className="mx-auto grid w-full max-w-3xl grid-cols-4 gap-1 px-2 py-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center rounded-lg py-2 text-xs transition ${
                    isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-100"
                  }`
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {showLanguageModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t("languageModal.title")}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("languageModal.description")}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => void handleSelectLanguage("ru")}>
                  {t("common.russian")}
                </Button>
                <Button onClick={() => void handleSelectLanguage("en")}>{t("common.english")}</Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}

export default App;
