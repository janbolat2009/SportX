import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Logo } from '../common/Logo';
import {
  Activity, Dumbbell, Users, Bell, User as UserIcon, LogOut,
  ChevronDown, Flame, CheckCircle, TrendingUp, FlaskConical
} from 'lucide-react';
import { NotificationsDropdown } from './NotificationsDropdown';

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<Props> = ({ currentTab, onSelectTab }) => {
  const { user, logout, quickLogin } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Activity },
    { id: 'train', label: 'Train', icon: Dumbbell },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'coach', label: 'Coach', icon: Users },
    { id: 'research', label: 'Research', icon: FlaskConical },
  ];

  return (
    <header className="sticky top-0 z-30 bg-surface-bg/95 backdrop-blur-md border-b border-surface-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div
          onClick={() => onSelectTab('home')}
          className="cursor-pointer"
        >
          <Logo size="md" />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-card p-1 rounded-xl border border-surface-border">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-800 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Notifications & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-surface-card transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500"></span>
            </button>

            {showNotifications && (
              <NotificationsDropdown onClose={() => setShowNotifications(false)} />
            )}
          </div>

          {/* Quick Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-surface-card border border-surface-border hover:border-surface-borderLight transition-all"
            >
              <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs text-brand-400">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-zinc-100 leading-none truncate max-w-[100px]">
                  {user?.full_name || 'Athlete'}
                </p>
                <p className="text-[10px] text-zinc-400 uppercase font-mono mt-0.5">
                  {user?.role || 'athlete'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-surface-card border border-surface-border rounded-2xl p-2 shadow-xl z-50 animate-in fade-in">
                <div className="p-2 border-b border-surface-border">
                  <p className="text-xs font-semibold text-zinc-200">{user?.full_name}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{user?.email}</p>
                </div>

                <div className="py-2 space-y-1">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase px-2">Switch Persona</p>
                  <button
                    onClick={() => {
                      quickLogin('athlete');
                      setShowProfileMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                      user?.role === 'athlete' ? 'bg-zinc-800 text-brand-400 font-semibold' : 'text-zinc-300 hover:bg-zinc-800/50'
                    }`}
                  >
                    <span>Athlete (Alex)</span>
                    {user?.role === 'athlete' && <CheckCircle className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => {
                      quickLogin('coach');
                      setShowProfileMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                      user?.role === 'coach' ? 'bg-zinc-800 text-brand-400 font-semibold' : 'text-zinc-300 hover:bg-zinc-800/50'
                    }`}
                  >
                    <span>Coach (Marcus)</span>
                    {user?.role === 'coach' && <CheckCircle className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => {
                      quickLogin('researcher');
                      setShowProfileMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                      user?.role === 'researcher' ? 'bg-zinc-800 text-brand-400 font-semibold' : 'text-zinc-300 hover:bg-zinc-800/50'
                    }`}
                  >
                    <span>Researcher (Elena)</span>
                    {user?.role === 'researcher' && <CheckCircle className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="pt-2 border-t border-surface-border">
                  <button
                    onClick={() => {
                      onSelectTab('profile');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800/50 flex items-center gap-2"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>Account Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
