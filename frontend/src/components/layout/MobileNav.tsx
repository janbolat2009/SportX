import React from 'react';
import { Home, Dumbbell, TrendingUp, Users, User as UserIcon, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const MobileNav: React.FC<Props> = ({ currentTab, onSelectTab }) => {
  const { user, isAuthenticated } = useAuth();

  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'train', label: 'Train', icon: Dumbbell, highlight: true },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'coach', label: user?.role === 'coach' ? 'Roster' : 'Coach', icon: Users },
    { id: 'profile', label: isAuthenticated ? 'Profile' : 'Log In', icon: isAuthenticated ? UserIcon : LogIn },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 px-2 py-1.5 safe-area-bottom">
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
                aria-label="Start Training"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                  isActive
                    ? 'bg-brand-500 text-black shadow-brand-500/25 ring-4 ring-zinc-950'
                    : 'bg-brand-600 text-black hover:bg-brand-500 ring-4 ring-zinc-950'
                }`}>
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className={`text-[11px] font-semibold mt-1 ${
                  isActive ? 'text-brand-400' : 'text-zinc-400'
                }`}>
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
                isActive ? 'text-brand-400 font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.75]'}`} />
              <span className="text-[11px] mt-1 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
