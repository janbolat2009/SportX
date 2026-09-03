import React, { useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../i18n/LanguageContext";
import { Language } from "../../i18n/translations";
import { Logo } from "../common/Logo";
import { ThemeToggle } from "../common/ThemeToggle";
import {
  X, Dumbbell, Activity, TrendingUp, Apple, Moon,
  Bot, User as UserIcon, Users, LogIn, UserPlus, LogOut, Globe
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuth: (mode: "login" | "signup") => void;
}

export const MobileDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  onOpenAuth,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const drawerRef = useRef<HTMLDivElement>(null);

  const isTrainer = user?.role === "coach" || user?.role === "trainer";

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const languages: { code: Language; label: string; shortLabel: string }[] = [
    { code: "ru", label: "Русский", shortLabel: "RU" },
    { code: "kk", label: "Қазақша", shortLabel: "KK" },
    { code: "en", label: "English", shortLabel: "EN" },
  ];

  const handleNavClick = (tabId: string) => {
    onSelectTab(tabId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden flex justify-end animate-in fade-in duration-200">
      {/* Dimmed Overlay Backdrop - Tapping outside closes menu */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-Over Drawer Panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
        className="relative w-[85vw] max-w-[340px] h-full bg-zinc-950 dark:bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col justify-between overflow-y-auto p-4 sm:p-5 z-10 animate-in slide-in-from-right duration-250 ease-out"
      >
        {/* Top Header inside Drawer */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div onClick={() => handleNavClick(isTrainer ? "coach" : isAuthenticated ? "home" : "train")} className="cursor-pointer">
              <Logo size="sm" />
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all active:scale-95"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Header (If Authenticated) */}
          {isAuthenticated && user && (
            <div
              onClick={() => handleNavClick("profile")}
              className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-3 cursor-pointer hover:border-zinc-700 transition-colors shadow-xs"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-sm text-brand-400 border border-zinc-700 shrink-0">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  user.full_name?.charAt(0).toUpperCase() || "U"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{user.full_name}</p>
                <p className="text-[10px] text-zinc-400 font-mono capitalize">
                  {isTrainer ? t("auth.trainer", "Trainer") : (user.role || "Athlete")}
                </p>
              </div>
            </div>
          )}

          {/* Role-Specific Navigation Links */}
          <nav className="space-y-1.5 py-1">
            {/* Unauthenticated Role Links: Home, Train */}
            {!isAuthenticated && (
              <>
                <button
                  onClick={() => handleNavClick("home")}
                  className={`w-full min-h-[46px] px-3.5 rounded-xl flex items-center gap-3 text-xs font-bold transition-all ${
                    currentTab === "home"
                      ? "bg-brand-500 text-black shadow-md shadow-brand-500/20"
                      : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <Activity className="w-4 h-4 shrink-0" />
                  <span>{t("nav.home", "Home")}</span>
                </button>

                <button
                  onClick={() => handleNavClick("train")}
                  className={`w-full min-h-[46px] px-3.5 rounded-xl flex items-center gap-3 text-xs font-bold transition-all ${
                    currentTab === "train"
                      ? "bg-brand-500 text-black shadow-md shadow-brand-500/20"
                      : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <Dumbbell className="w-4 h-4 shrink-0" />
                  <span>{t("nav.train", "Train")}</span>
                </button>
              </>
            )}

            {/* Trainer Role Links: Home, Athletes, Progress, AI Assistant, Profile */}
            {isAuthenticated && isTrainer && (
              <>
                <button
                  onClick={() => handleNavClick("coach")}
                  className={`w-full min-h-[46px] px-3.5 rounded-xl flex items-center gap-3 text-xs font-bold transition-all ${
                    currentTab === "home"
                      ? "bg-brand-500 text-black shadow-md shadow-brand-500/20"
                      : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <Activity className="w-4 h-4 shrink-0" />
                  <span>{t("nav.home", "Home")}</span>
                </button>

                <button
                  onClick={() => handleNavClick("coach")}
                  className={`w-full min-h-[46px] px-3.5 rounded-xl flex items-center gap-3 text-xs font-bold transition-all ${
                    currentTab === "coach"
                      ? "bg-brand-500 text-black shadow-md shadow-brand-500/20"
                      : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>{t("nav.athletes", "Athletes")}</span>
                </button>

                <button
                  onClick={() => handleNavClick("progress")}
                  className={`w-full min-h-[46px] px-3.5 rounded-xl flex items-center gap-3 text-xs font-bold transition-all ${
                    currentTab === "progress"
                      ? "bg-brand-500 text-black shadow-md shadow-brand-500/20"
                      : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  <span>{t("nav.progress", "Progress")}</span>
                </button>

                <button
                  onClick={() => handleNavClick("assistant")}
                  className={`w-full min-h-[46px] px-3.5 rounded-xl flex items-center gap-3 text-xs font-bold transition-all ${
                    currentTab === "assistant"
                      ? "bg-brand-500 text-black shadow-md shadow-brand-500/20"
                      : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <Bot className="w-4 h-4 shrink-0" />
                  <span>{t("nav.assistant", "AI Assistant")}</span>
                </button>

                <button
                  onClick={() => handleNavClick("profile")}
                  className={`w-full min-h-[46px] px-3.5 rounded-xl flex items-center gap-3 text-xs font-bold transition-all ${
                    currentTab === "profile"
                      ? "bg-brand-500 text-black shadow-md shadow-brand-500/20"
                      : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <UserIcon className="w-4 h-4 shrink-0" />
                  <span>{t("nav.profile", "Profile")}</span>
                </button>
              </>
            )}

            {/* Athlete Role Links: Home, Train, Progress, Nutrition, Sleep, AI Assistant, Profile */}
            {isAuthenticated && !isTrainer && (
              <>
                <button
                  onClick={() => handleNavClick("home")}
                  className={`w-full min-h-[46px] px-3.5 rounded-xl flex items-center gap-3 text-xs font-bold transition-all ${
                    currentTab === "home"
                      ? "bg-brand-500 text-black shadow-md shadow-brand-500/20"
                      : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <Activity className="w-4 h-4 shrink-0" />
                  <span>{t("nav.home", "Home")}</span>
                </button>

                <button
                  onClick={() => handleNavClick("train")}
                  className={`w-full min-h-[46px] px-3.5 rounded-xl flex items-center gap-3 text-xs font-bold transition-all ${
                    currentTab === "train"
                      ? "bg-brand-500 text-black shadow-md shadow-brand-500/20"
                      : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <Dumbbell className="w-4 h-4 shrink-0" />
                  <span>{t("nav.train", "Train")}</span>
                </button>

                <button
                  onClick={() => handleNavClick("progress")}
                  className={`w-full min-h-[46px] px-3.5 rounded-xl flex items-center gap-3 text-xs font-bold transition-all ${
                    currentTab === "progress"
                      ? "bg-brand-500 text-black shadow-md shadow-brand-500/20"
                      : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  <span>{t("nav.progress", "Progress")}</span>
                </button>

                <button
                  onClick={() => handleNavClick("nutrition")}
                  className={`w-full min-h-[46px] px-3.5 rounded-xl flex items-center gap-3 text-xs font-bold transition-all ${
                    currentTab === "nutrition"
                      ? "bg-brand-500 text-black shadow-md shadow-brand-500/20"
                      : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <Apple className="w-4 h-4 shrink-0" />
                  <span>{t("nav.nutrition", "Nutrition")}</span>
                </button>

                <button
                  onClick={() => handleNavClick("sleep")}
                  className={`w-full min-h-[46px] px-3.5 rounded-xl flex items-center gap-3 text-xs font-bold transition-all ${
                    currentTab === "sleep"
                      ? "bg-brand-500 text-black shadow-md shadow-brand-500/20"
                      : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <Moon className="w-4 h-4 shrink-0" />
                  <span>{t("nav.sleep", "Sleep")}</span>
                </button>

                <button
                  onClick={() => handleNavClick("assistant")}
                  className={`w-full min-h-[46px] px-3.5 rounded-xl flex items-center gap-3 text-xs font-bold transition-all ${
                    currentTab === "assistant"
                      ? "bg-brand-500 text-black shadow-md shadow-brand-500/20"
                      : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <Bot className="w-4 h-4 shrink-0" />
                  <span>{t("nav.assistant", "AI Assistant")}</span>
                </button>

                <button
                  onClick={() => handleNavClick("profile")}
                  className={`w-full min-h-[46px] px-3.5 rounded-xl flex items-center gap-3 text-xs font-bold transition-all ${
                    currentTab === "profile"
                      ? "bg-brand-500 text-black shadow-md shadow-brand-500/20"
                      : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <UserIcon className="w-4 h-4 shrink-0" />
                  <span>{t("nav.profile", "Profile")}</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Bottom Section: Theme Switcher, Language Switcher & Auth Actions */}
        <div className="pt-4 border-t border-zinc-800/80 space-y-3.5">
          
          {/* Theme Switcher in Drawer */}
          <ThemeToggle compact={false} />

          {/* 3-Language Selector Grid */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5 text-brand-400" />
              <span>{t("profile.language", "Language")}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {languages.map((item) => (
                <button
                  key={item.code}
                  onClick={() => setLanguage(item.code)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center border transition-all ${
                    language === item.code
                      ? "bg-brand-500/15 border-brand-500 text-brand-400 shadow-xs"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <span className="text-[10px] font-mono opacity-60 uppercase">{item.shortLabel}</span>
                  <span className="text-xs font-bold">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Auth Controls */}
          {isAuthenticated ? (
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold flex items-center justify-center gap-2 border border-rose-500/20 transition-all active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>{t("nav.logout", "Sign Out")}</span>
            </button>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth("login");
                }}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <LogIn className="w-4 h-4 text-brand-400" />
                <span>{t("nav.login", "Log In")}</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenAuth("signup");
                }}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-black text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md shadow-brand-500/20 active:scale-95 uppercase tracking-wider"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t("nav.signup", "Sign Up")}</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
