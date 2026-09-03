import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "../../i18n/LanguageContext";

interface Props {
  compact?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<Props> = ({ compact = false, className = "" }) => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === "dark";

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`p-2 rounded-xl border transition-all active:scale-95 ${
          isDark
            ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-amber-300 hover:border-zinc-700"
            : "bg-white border-stone-200 text-stone-600 hover:text-amber-500 hover:border-stone-300 shadow-xs"
        } ${className}`}
        aria-label={isDark ? t("theme.switchToLight", "Switch to light mode") : t("theme.switchToDark", "Switch to dark mode")}
        title={isDark ? t("theme.light", "Light Mode") : t("theme.dark", "Dark Mode")}
      >
        {isDark ? (
          <Sun className="w-4 h-4 transition-transform hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 transition-transform hover:-rotate-12 text-indigo-600" />
        )}
      </button>
    );
  }

  return (
    <div className={`flex items-center justify-between p-2.5 rounded-2xl border ${
      isDark ? "bg-zinc-900/90 border-zinc-800" : "bg-stone-50 border-stone-200"
    } ${className}`}>
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
          isDark ? "bg-zinc-800 text-amber-300" : "bg-white text-indigo-600 shadow-xs"
        }`}>
          {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
        </div>
        <div className="text-left">
          <p className={`text-xs font-bold ${isDark ? "text-zinc-200" : "text-stone-800"}`}>
            {t("theme.title", "Appearance")}
          </p>
          <p className={`text-[10px] ${isDark ? "text-zinc-400" : "text-stone-500"}`}>
            {isDark ? t("theme.dark", "Dark Mode") : t("theme.light", "Light Mode")}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          isDark ? "bg-brand-500" : "bg-stone-300"
        }`}
        role="switch"
        aria-checked={isDark}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            isDark ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
};
