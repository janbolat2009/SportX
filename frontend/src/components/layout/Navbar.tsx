import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';
import { AuthModal } from '../auth/AuthModal';
import {
  Activity, Dumbbell, Users, Bell, User as UserIcon, LogOut,
  ChevronDown, TrendingUp, FlaskConical, LogIn, UserPlus
} from 'lucide-react';
import { NotificationsDropdown } from './NotificationsDropdown';

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<Props> = ({ currentTab, onSelectTab }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');

  const navItems = [
    { id: 'home', label: 'Home', icon: Activity },
    { id: 'train', label: 'Train', icon: Dumbbell },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'coach', label: 'Coach', icon: Users },
  ];

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthInitialMode(mode);
    setShowAuthModal(true);
  };

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div
          onClick={() => onSelectTab('home')}
          className="cursor-pointer"
        >
          <Logo size="md" />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Section: Auth State or Actions */}
        <div className="flex items-center gap-3">
          
          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
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
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs text-brand-400 border border-zinc-700">
                    {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:flex flex-col">
                    <span className="text-xs font-bold text-zinc-200 leading-tight truncate max-w-[120px]">
                      {user?.full_name || 'User'}
                    </span>
                    <span className="text-[10px] text-zinc-400 capitalize">
                      {user?.role || 'Athlete'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl p-2 z-50 animate-in fade-in">
                    <div className="px-2.5 py-2 border-b border-zinc-800">
                      <p className="text-xs font-bold text-white truncate">{user?.full_name}</p>
                      <p className="text-[11px] text-zinc-400 truncate">{user?.email}</p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          onSelectTab('profile');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                      >
                        <UserIcon className="w-4 h-4 text-zinc-400" />
                        <span>Profile & Settings</span>
                      </button>
                      <button
                        onClick={() => {
                          logout();
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 mt-0.5"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenAuth('login')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-900 border border-zinc-800 transition-all"
              >
                Log In
              </button>
              <button
                onClick={() => handleOpenAuth('signup')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-brand-500 hover:bg-brand-400 text-black transition-all shadow-sm active:scale-95"
              >
                Sign Up
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Auth Modal if triggered */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          initialMode={authInitialMode}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </header>
  );
};
