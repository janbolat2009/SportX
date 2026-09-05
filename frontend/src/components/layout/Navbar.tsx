import React, { useState, useMemo, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../i18n/LanguageContext";
import { Logo } from "../common/Logo";
import { AuthModal } from "../auth/AuthModal";
import { LanguageSelector } from "../common/LanguageSelector";
import { ThemeToggle } from "../common/ThemeToggle";
import { MobileDrawer } from "./MobileDrawer";
import {
  Activity, Dumbbell, Users, Bell, User as UserIcon, LogOut,
  TrendingUp, LogIn, UserPlus, Apple, Moon, Bot, MessageSquare
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

  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu]);

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
      <header className="sticky top-0 z-50 w-full bg-[#f8f7f5]/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-stone-200/90 dark:border-zinc-800/80 shadow-xs transition-colors duration-200">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4 md:gap-6">
          
          {/* Brand Logo - Responsive sizing */}
          <div
            onClick={() => onSelectTab(isTrainer ? "coach" : isAuthenticated ? "home" : "train")}
            className="cursor-pointer shrink-0 pr-1 sm:pr-2 hover:opacity-95 transition-opacity"
          >
            <Logo size="sm" className="sm:hidden" />
            <Logo size="md" className="hidden sm:inline-flex" />
          </div>

          {/* Desktop Centered Navigation Links with responsive compact/standard sizing */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 bg-stone-200/50 dark:bg-zinc-900/80 p-1 xl:p-1.5 rounded-2xl border border-stone-300/60 dark:border-zinc-800/80 shadow-xs shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-xl text-[11px] xl:text-xs font-semibold transition-all shrink-0 ${
                    isActive
                      ? "bg-white dark:bg-zinc-800 text-stone-900 dark:text-white shadow-xs font-bold"
                      : "text-stone-600 hover:text-stone-900 hover:bg-white/60 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0 ${isActive ? "text-emerald-600 dark:text-brand-400" : ""}`} />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Desktop Right Section: Theme Toggle + Language Selector + Auth Actions */}
          <div className="hidden md:flex items-center gap-2 xl:gap-3 shrink-0">
            <ThemeToggle compact={true} />
            <LanguageSelector />

            {isAuthenticated ? (
              <>
                {/* Notifications Dropdown */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900 border border-transparent hover:border-stone-200 dark:hover:border-zinc-800 transition-colors shrink-0"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4.5 h-4.5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
                  </button>

                  {showNotifications && (
                    <NotificationsDropdown onClose={() => setShowNotifications(false)} />
                  )}
                </div>

                {/* User Profile Circular Avatar Menu */}
                <div className="relative shrink-0" ref={profileMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="w-9 h-9 rounded-full bg-emerald-600/10 hover:bg-emerald-600/20 dark:bg-brand-500/15 dark:hover:bg-brand-500/25 border border-emerald-600/30 dark:border-brand-500/30 text-emerald-700 dark:text-brand-300 flex items-center justify-center font-bold text-sm transition-transform active:scale-95 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shrink-0 cursor-pointer"
                    aria-label="User Profile"
                    title={user?.full_name || "Profile"}
                  >
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name || "User"}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      user?.full_name?.trim()?.charAt(0).toUpperCase() || "A"
                    )}
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-2xl py-2 z-[100] animate-in fade-in zoom-in-95">
                      <div className="px-4 py-2.5 border-b border-stone-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs font-bold text-stone-900 dark:text-white truncate">
                            {user?.full_name || (isTrainer ? "Trainer" : "Athlete")}
                          </p>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:bg-brand-500/15 dark:text-brand-400 border border-emerald-500/20 dark:border-brand-500/20 shrink-0">
                            {isTrainer ? t("auth.trainer", "Trainer") : (user?.role || "athlete")}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-zinc-400 font-mono truncate">
                          {user?.email}
                        </p>
                      </div>

                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowProfileMenu(false);
                            onSelectTab("profile");
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-stone-700 hover:bg-stone-100 hover:text-stone-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors text-left cursor-pointer"
                        >
                          <UserIcon className="w-4 h-4 text-stone-400 dark:text-zinc-400 shrink-0" />
                          <span>{t("nav.profile", "Profile")}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowProfileMenu(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors border-t border-stone-100 dark:border-zinc-800 text-left cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 shrink-0" />
                          <span>{t("nav.logout", "Sign Out")}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleOpenAuth("login")}
                  className="px-3 py-1.5 xl:px-3.5 xl:py-2 rounded-xl bg-white hover:bg-stone-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-stone-200 dark:border-zinc-800 text-xs font-semibold text-stone-700 hover:text-stone-900 dark:text-zinc-300 dark:hover:text-white flex items-center gap-1.5 transition-all shadow-xs shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5 text-emerald-600 dark:text-brand-400 shrink-0" />
                  <span>{t("nav.login")}</span>
                </button>

                <button
                  onClick={() => handleOpenAuth("signup")}
                  className="px-3.5 py-1.5 xl:px-4 xl:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 active:scale-95 shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5 shrink-0" />
                  <span>{t("nav.signup")}</span>
                </button>
              </div>
            )}

          </div>

          {/* Mobile Right Section: Theme Toggle + Language Selector + Animated 3-Line Hamburger */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            <ThemeToggle compact={true} />
            <LanguageSelector compact={true} />

            <button
              onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
              className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white active:scale-95 transition-all shadow-xs shrink-0"
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
