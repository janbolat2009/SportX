import React from "react";
import { Home, Dumbbell, TrendingUp, Users, User as UserIcon, LogIn, Apple, MessageSquare } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../i18n/LanguageContext";

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const MobileNav: React.FC<Props> = ({ currentTab, onSelectTab }) => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const isTrainer = user?.role === "coach" || user?.role === "trainer";

  const tabs = React.useMemo(() => {
    if (!isAuthenticated) {
      return [
        { id: "home", label: t("nav.home", "Home"), icon: Home },
        { id: "train", label: t("nav.train", "Train"), icon: Dumbbell, highlight: true },
        { id: "profile", label: t("nav.login", "Log In"), icon: LogIn },
      ];
    }

    if (isTrainer) {
      return [
        { id: "coach", label: t("nav.athletes", "Athletes"), icon: Users, highlight: true },
        { id: "messages", label: t("nav.messages", "Messages"), icon: MessageSquare },
        { id: "progress", label: t("nav.progress", "Progress"), icon: TrendingUp },
        { id: "profile", label: t("nav.profile", "Profile"), icon: UserIcon },
      ];
    }

    return [
      { id: "home", label: t("nav.home", "Home"), icon: Home },
      { id: "train", label: t("nav.train", "Train"), icon: Dumbbell, highlight: true },
      { id: "messages", label: t("nav.messages", "Messages"), icon: MessageSquare },
      { id: "progress", label: t("nav.progress", "Progress"), icon: TrendingUp },
      { id: "profile", label: t("nav.profile", "Profile"), icon: UserIcon },
    ];
  }, [isAuthenticated, isTrainer, t]);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#fcfbf9]/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-stone-200/90 dark:border-zinc-800/80 px-2 py-1.5 safe-area-bottom shadow-lg transition-colors duration-200">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          if (tab.highlight) {
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className="flex flex-col items-center justify-center -mt-5 relative group"
                aria-label={tab.label}
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-emerald-600/25 ring-4 ring-[#fcfbf9] dark:ring-zinc-950"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white ring-4 ring-[#fcfbf9] dark:ring-zinc-950"
                  }`}
                >
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span
                  className={`text-[11px] font-bold mt-1 ${
                    isActive ? "text-emerald-600 dark:text-brand-400" : "text-stone-500 dark:text-zinc-400"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 min-w-[56px] min-h-[48px] rounded-xl transition-all ${
                isActive ? "text-emerald-600 dark:text-brand-400 font-bold" : "text-stone-500 hover:text-stone-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.2]" : "stroke-[1.75]"}`} />
              <span className="text-[11px] mt-1 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
