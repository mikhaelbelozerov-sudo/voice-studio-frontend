import { Home, Library, UserCircle, WalletCards } from "lucide-react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { GeneratePage } from "./pages/Generate";
import { LibraryPage } from "./pages/Library";
import { PricingPage } from "./pages/Pricing";
import { ProfilePage } from "./pages/Profile";

const navItems = [
  { to: "/generate", label: "Generate", icon: Home },
  { to: "/library", label: "Library", icon: Library },
  { to: "/pricing", label: "Pricing", icon: WalletCards },
  { to: "/profile", label: "Profile", icon: UserCircle }
];

function App() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl bg-slate-100 px-4 pt-4">
      <Routes>
        <Route path="/" element={<Navigate to="/generate" replace />} />
        <Route path="/generate" element={<GeneratePage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto grid w-full max-w-3xl grid-cols-4 gap-1 px-2 py-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center rounded-lg py-2 text-xs transition ${
                  isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-700"
                }`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default App;
