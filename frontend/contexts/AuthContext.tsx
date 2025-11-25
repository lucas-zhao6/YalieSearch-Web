'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, getCurrentUser, setAuthToken, clearAuthToken, getAuthToken } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // DEV MODE: Skip authentication for testing
  const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  useEffect(() => {
    // DEV MODE: Auto-login with fake user
    if (DEV_MODE) {
      setUser({ netid: 'dev_user', authenticated: true });
      setLoading(false);
      return;
    }

    // Check for auth token in URL (from CAS callback)
    const params = new URLSearchParams(window.location.search);
    const token = params.get('auth_token');
    
    if (token) {
      setAuthToken(token);
      // Remove token from URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Load user
    loadUser();
  }, []);

  const loadUser = async () => {
    setLoading(true);
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  };

  const login = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/api/auth/login`);
    const data = await response.json();
    window.location.href = data.login_url;
  };

  const logout = async () => {
    clearAuthToken();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/api/auth/logout`);
    const data = await response.json();
    window.location.href = data.logout_url;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

