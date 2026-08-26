import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  quickLogin: (role: UserRole) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('sportx_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const userData = await api.getMe();
          setUser(userData);
        } catch (e) {
          console.error('Session expired or invalid:', e);
          logout();
        }
      } else {
        // Auto-login default demo athlete for immediate interactive testing if no session
        try {
          await quickLogin('athlete');
        } catch (e) {
          console.log('Backend not ready yet for auto-login');
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      localStorage.setItem('sportx_token', res.access_token);
      setToken(res.access_token);
      setUser({
        id: res.user_id,
        email: res.email,
        full_name: res.full_name,
        role: res.role as UserRole,
        is_active: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (role: UserRole) => {
    setIsLoading(true);
    try {
      let email = 'athlete@sportx.ai';
      let password = 'athlete123';

      if (role === 'coach') {
        email = 'coach@sportx.ai';
        password = 'coach123';
      } else if (role === 'researcher') {
        email = 'researcher@sportx.ai';
        password = 'research123';
      }

      const res = await api.login(email, password);
      localStorage.setItem('sportx_token', res.access_token);
      setToken(res.access_token);
      setUser({
        id: res.user_id,
        email: res.email,
        full_name: res.full_name,
        role: res.role as UserRole,
        is_active: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      const res = await api.register(userData);
      localStorage.setItem('sportx_token', res.access_token);
      setToken(res.access_token);
      setUser({
        id: res.user_id,
        email: res.email,
        full_name: res.full_name,
        role: res.role as UserRole,
        is_active: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('sportx_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        quickLogin,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
