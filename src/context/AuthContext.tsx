import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { UserProfile } from '../types';

type AuthStatus = 'loading' | 'authenticated' | 'guest';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  status: AuthStatus;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  authFetch: <T,>(path: string, init?: RequestInit) => Promise<T>;
  changePassword: (currentPassword: string, password: string, passwordConfirmation: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (payload: { email: string; token: string; password: string; passwordConfirmation: string }) => Promise<string>;
}

const API_BASE_URL = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api';
const TOKEN_KEY = 'ioms_auth_token';
const USER_KEY = 'ioms_auth_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const parseStoredUser = (): UserProfile | null => {
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => window.localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<UserProfile | null>(() => parseStoredUser());
  const [status, setStatus] = useState<AuthStatus>(() => (window.localStorage.getItem(TOKEN_KEY) ? 'loading' : 'guest'));
  const [error, setError] = useState<string | null>(null);

  const persistAuth = (nextToken: string | null, nextUser: UserProfile | null) => {
    setToken(nextToken);
    setUser(nextUser);

    if (nextToken) {
      window.localStorage.setItem(TOKEN_KEY, nextToken);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }

    if (nextUser) {
      window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    } else {
      window.localStorage.removeItem(USER_KEY);
    }
  };

  const clearAuth = () => {
    persistAuth(null, null);
    setStatus('guest');
  };

  const authFetch = async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const currentToken = token ?? window.localStorage.getItem(TOKEN_KEY);
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Accept': 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {}),
        ...(init?.headers ?? {}),
      },
    });

    if (response.status === 401) {
      clearAuth();
      throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
    }

    if (!response.ok) {
      let message = 'Terjadi kesalahan pada server.';
      try {
        const payload = await response.json() as { message?: string };
        if (payload.message) {
          message = payload.message;
        }
      } catch {
        // ignore
      }
      throw new Error(message);
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.json() as Promise<T>;
  };

  const refreshUser = async () => {
    if (!token && !window.localStorage.getItem(TOKEN_KEY)) {
      setStatus('guest');
      return;
    }

    try {
      const payload = await authFetch<{ data: UserProfile }>('/auth/me');
      persistAuth(token ?? window.localStorage.getItem(TOKEN_KEY), payload.data);
      setStatus('authenticated');
      setError(null);
    } catch (refreshError) {
      clearAuth();
      setError(refreshError instanceof Error ? refreshError.message : 'Gagal memulihkan sesi.');
    }
  };

  const login = async (email: string, password: string) => {
    setStatus('loading');
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json() as { token?: string; user?: { data?: UserProfile } | UserProfile; message?: string };

      if (!response.ok || !payload.token) {
        throw new Error(payload.message ?? 'Login gagal.');
      }

      const nextUser = 'data' in (payload.user ?? {}) ? (payload.user as { data: UserProfile }).data : payload.user as UserProfile;
      persistAuth(payload.token, nextUser ?? null);
      setStatus('authenticated');
    } catch (loginError) {
      clearAuth();
      setError(loginError instanceof Error ? loginError.message : 'Login gagal.');
      throw loginError;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await authFetch('/auth/logout', { method: 'POST' });
      }
    } catch {
      // ignore remote logout failure
    } finally {
      clearAuth();
    }
  };

  const changePassword = async (currentPassword: string, password: string, passwordConfirmation: string) => {
    await authFetch('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      }),
    });
    await logout();
  };

  const forgotPassword = async (email: string) => {
    const payload = await authFetch<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return payload.message;
  };

  const resetPassword = async (payload: { email: string; token: string; password: string; passwordConfirmation: string }) => {
    const response = await authFetch<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
        token: payload.token,
        password: payload.password,
        password_confirmation: payload.passwordConfirmation,
      }),
    });
    return response.message;
  };

  useEffect(() => {
    if (token) {
      void refreshUser();
    } else {
      setStatus('guest');
    }
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    token,
    status,
    error,
    isAuthenticated: status === 'authenticated' && !!user && !!token,
    login,
    logout,
    refreshUser,
    authFetch,
    changePassword,
    forgotPassword,
    resetPassword,
  }), [user, token, status, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
