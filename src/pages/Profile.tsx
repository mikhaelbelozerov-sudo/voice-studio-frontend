import { useTelegram } from "../hooks/useTelegram";

export const ProfilePage = () => {
  const { user, isDark } = useTelegram();

  return (
    <div className="space-y-4 pb-24">
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Имя</p>
        <p className="text-base font-semibold text-slate-900">{user?.first_name || "Гость"}</p>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Telegram ID</p>
        <p className="text-base font-semibold text-slate-900">{user?.id || "—"}</p>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Тема Telegram</p>
        <p className="text-base font-semibold text-slate-900">{isDark ? "Тёмная" : "Светлая"}</p>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Остаток бесплатных минут</p>
        <p className="text-base font-semibold text-slate-900">5 минут</p>
      </div>
    </div>
  );
};
