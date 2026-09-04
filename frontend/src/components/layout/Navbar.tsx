import React, { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../i18n/LanguageContext";
import { Logo } from "../common/Logo";
import { AuthModal } from "../auth/AuthModal";
import { LanguageSelector } from "../common/LanguageSelector";
import { ThemeToggle } from "../common/ThemeToggle";
import { MobileDrawer } from "./MobileDrawer";
import {
  Activity, Dumbbell, Users, Bell, User as UserIcon, LogOut,
  ChevronDown, TrendingUp, LogIn, UserPlus, Apple, Moon, Bot, MessageSquare
} from "lucide-react";
import { NotificationsDropdown } from "./NotificationsDropdown";

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<Props> = ({ currentTab, onSelectTab }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<"login" | "signup">("login");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const isTrainer = user?.role === "coach" || user?.role === "trainer";

  const navItems = useMemo(() => {
    if (!isAuthenticated) {
      return [
        { id: "home", label: t("nav.home", "Home"), icon: Activity },
        { id: "train", label: t("nav.train", "Training"), icon: Dumbbell },
      ];
    }

    if (isTrainer) {
      return [
        { id: "coach", label: t("nav.athletes", "Athletes"), icon: Users },
        { id: "messages", label: t("nav.messages", "Messages"), icon: MessageSquare },
        { id: "progress", label: t("nav.progress", "Progress"), icon: TrendingUp },
        { id: "assistant", label: t("nav.assistant", "AI Assistant"), icon: Bot },
      ];
    }

    return [
      { id: "home", label: t("nav.home", "Home"), icon: Activity },
      { id: "train", label: t("nav.train", "Training"), icon: Dumbbell },
      { id: "progress", label: t("nav.progress", "Progress"), icon: TrendingUp },
      { id: "nutrition", label: t("nav.nutrition", "Nutrition"), icon: Apple },
      { id: "sleep", label: t("nav.sleep", "Sleep"), icon: Moon },
      { id: "messages", label: t("nav.messages", "Messages"), icon: MessageSquare },
      { id: "assistant", label: t("nav.assistant", "AI Assistant"), icon: Bot },
    ];
  }, [isAuthenticated, isTrainer, t]);

  const handleOpenAuth = (mode: "login" | "signup") => {
    setAuthInitialMode(mode);
    setShowAuthModal(true);
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full max-w-full overflow-x-clip bg-[#f8f7f5]/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-stone-200/90 dark:border-zinc-800/80 shadow-xs transition-colors duration-200">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4 md:gap-8">
          
          {/* Brand Logo - Responsive sizing for mobile */}
          <div
            onClick={() => onSelectTab(isTrainer ? "coach" : isAuthenticated ? "home" : "train")}
            className="cursor-pointer shrink-0 pr-1 sm:pr-4 hover:opacity-95 transition-opacity"
          >
            <Logo size="sm" className="sm:hidden" />
            <Logo size="md" className="hidden sm:inline-flex" />
          </div>

          {/* Desktop Centered Navigation Links with generous spacing */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-stone-200/50 dark:bg-zinc-900/80 p-1.5 rounded-2xl border border-stone-300/60 dark:border-zinc-800/80 shadow-xs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-white dark:bg-zinc-800 text-stone-900 dark:text-white shadow-xs font-bold"
                      : "text-stone-600 hover:text-stone-900 hover:bg-white/60 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600 dark:text-brand-400" : ""}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Desktop Right Section: Theme Toggle + Language Selector + Auth Actions */}
          <div className="hidden md:flex items-center gap-3 sm:gap-4 shrink-0">
            <ThemeToggle compact={true} />
            <LanguageSelector />

            {isAuthenticated ? (
              <>
                {/* Notifications Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900 border border-transparent hover:border-stone-200 dark:hover:border-zinc-800 transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
                  </button>

                  {showNotifications && (
                    <NotificationsDropdown onClose={() => setShowNotifications(false)} />
                  )}
                </div>

                {/* User Profile Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-zinc-900 border border-transparent hover:border-stone-200 dark:hover:border-zinc-800 transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-emerald-600 dark:text-brand-400 border border-stone-200 dark:border-zinc-700 shadow-xs">
                      {user?.full_name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="hidden sm:flex flex-col">
                      <span className="text-xs font-bold text-stone-800 dark:text-zinc-200 leading-tight truncate max-w-[130px]">
                        {user?.full_name || (isTrainer ? "Trainer" : "Athlete")}
                      </span>
                      <span className="text-[10px] text-stone-500 dark:text-zinc-400 font-mono capitalize">
                        {isTrainer ? t("auth.trainer", "Trainer") : (user?.role || "athlete")}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400 dark:text-zinc-500 hidden sm:block" />
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95">
                      <div className="px-3.5 py-2.5 border-b border-stone-200 dark:border-zinc-800">
                        <p className="text-xs font-bold text-stone-900 dark:text-white truncate">{user?.full_name}</p>
                        <p className="text-[10px] text-stone-500 dark:text-zinc-400 font-mono truncate">{user?.email}</p>
                      </div>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onSelectTab("profile");
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-stone-700 hover:bg-stone-100 hover:text-stone-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-stone-400 dark:text-zinc-400" />
                        <span>{t("nav.profile")}</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-rose-500 hover:bg-rose-500/10 transition-colors border-t border-stone-200 dark:border-zinc-800/60"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t("nav.logout")}</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenAuth("login")}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-stone-200 dark:border-zinc-800 text-xs font-semibold text-stone-700 hover:text-stone-900 dark:text-zinc-300 dark:hover:text-white flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5 text-emerald-600 dark:text-brand-400" />
                  <span>{t("nav.login")}</span>
                </button>

                <button
                  onClick={() => handleOpenAuth("signup")}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t("nav.signup")}</span>
                </button>
              </div>
            )}

          </div>

          {/* Mobile Right Section: Theme Toggle + Language Selector + User Quick Avatar + Animated 3-Line Hamburger */}
          <div className="flex md:hidden items-center gap-1.5 sm:gap-2">
            <ThemeToggle compact={true} />
            <LanguageSelector compact={true} />
            
            {isAuthenticated && (
              <button
                onClick={() => onSelectTab("profile")}
                className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-emerald-600 dark:text-brand-400 border border-stone-200 dark:border-zinc-700 shadow-xs active:scale-95 transition-all"
                title={user?.full_name || "Profile"}
              >
                {user?.full_name?.charAt(0).toUpperCase() || "U"}
              </button>
            )}

            <button
              onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
              className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white active:scale-95 transition-all shadow-xs"
              aria-label="Toggle navigation menu"
            >
              <div className="w-5 h-4 flex flex-col justify-between items-center relative">
                <span className={`w-5 h-0.5 bg-current rounded-full transition-all duration-300 ease-out origin-center ${
                  isMobileDrawerOpen ? "rotate-45 translate-y-1.5" : ""
                }`} />
                <span className={`w-5 h-0.5 bg-current rounded-full transition-all duration-200 ease-out ${
                  isMobileDrawerOpen ? "opacity-0 scale-x-0" : "opacity-100"
                }`} />
                <span className={`w-5 h-0.5 bg-current rounded-full transition-all duration-300 ease-out origin-center ${
                  isMobileDrawerOpen ? "-rotate-45 -translate-y-1.5" : ""
                }`} />
              </div>
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Slide-Over Drawer Navigation */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        onOpenAuth={handleOpenAuth}
      />

      {/* Standalone Auth Modal */}
      {showAuthModal && (
        <AuthModal
          initialMode={authInitialMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      )}
    </>
  );
};
