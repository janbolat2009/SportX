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
  ChevronDown, TrendingUp, LogIn, UserPlus, Menu, Apple, Moon, Bot
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
      { id: "assistant", label: t("nav.assistant", "AI Assistant"), icon: Bot },
    ];
  }, [isAuthenticated, isTrainer, t]);

  const handleOpenAuth = (mode: "login" | "signup") => {
    setAuthInitialMode(mode);
    setShowAuthModal(true);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-zinc-950/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4 md:gap-8">
          
          {/* Brand Logo - Spacious left anchor */}
          <div
            onClick={() => onSelectTab(isTrainer ? "coach" : isAuthenticated ? "home" : "train")}
            className="cursor-pointer shrink-0 pr-2 sm:pr-4 hover:opacity-95 transition-opacity"
          >
            <Logo size="md" />
          </div>

          {/* Desktop Centered Navigation Links with generous spacing */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800/80 shadow-xs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-zinc-800 text-white shadow-xs font-bold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-brand-400" : ""}`} />
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
                    className="relative p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500" />
                  </button>

                  {showNotifications && (
                    <NotificationsDropdown onClose={() => setShowNotifications(false)} />
                  )}
                </div>

                {/* User Profile Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs text-brand-400 border border-zinc-700 shadow-xs">
                      {user?.full_name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="hidden sm:flex flex-col">
                      <span className="text-xs font-bold text-zinc-200 leading-tight truncate max-w-[130px]">
                        {user?.full_name || (isTrainer ? "Trainer" : "Athlete")}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono capitalize">
                        {isTrainer ? t("auth.trainer", "Trainer") : (user?.role || "athlete")}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-500 hidden sm:block" />
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl py-1.5 z-40 animate-in fade-in zoom-in-95">
                      <div className="px-3.5 py-2.5 border-b border-zinc-800">
                        <p className="text-xs font-bold text-white truncate">{user?.full_name}</p>
                        <p className="text-[10px] text-zinc-400 font-mono truncate">{user?.email}</p>
                      </div>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onSelectTab("profile");
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-zinc-400" />
                        <span>{t("nav.profile")}</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors border-t border-zinc-800/60"
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
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5 text-brand-400" />
                  <span>{t("nav.login")}</span>
                </button>

                <button
                  onClick={() => handleOpenAuth("signup")}
                  className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-black text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-brand-500/20 active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t("nav.signup")}</span>
                </button>
              </div>
            )}

          </div>

          {/* Mobile Right Section: Theme Toggle + Language Selector + 3-Line Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle compact={true} />
            <LanguageSelector compact={true} />
            
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white active:scale-95 transition-all"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5 text-brand-400" />
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
