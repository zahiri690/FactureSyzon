import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { apiFetch, ApiError, getToken, setToken } from './api';

const USERNAME_KEY = 'facturo-username-v1';

interface AuthApi {
  isAuthenticated: boolean;
  username: string;
  login: (username: string, password: string) => Promise<boolean>;
  loginError: string;
  logout: () => void;
  changeCredentials: (newUsername: string, currentPassword: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthApi | null>(null);

const loadUsername = (): string => {
  try {
    return localStorage.getItem(USERNAME_KEY) ?? 'admin';
  } catch {
    return 'admin';
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string>(loadUsername);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(getToken()));
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(USERNAME_KEY, username);
    } catch {
      /* navigation privée */
    }
  }, [username]);

  const login = useCallback(async (usernameInput: string, password: string) => {
    setLoginError('');
    try {
      const res = await apiFetch<{ token: string; username: string }>('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username: usernameInput, password }),
      });
      setToken(res.token);
      setUsername(res.username);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      setLoginError(err instanceof ApiError ? err.message : 'Connexion impossible. Réessayez.');
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    void apiFetch('/api/logout', { method: 'POST' }).catch(() => {
      /* le jeton est de toute façon retiré côté client */
    });
    setToken(null);
    setIsAuthenticated(false);
  }, []);

  const changeCredentials = useCallback(
    async (newUsername: string, currentPassword: string, newPassword: string) => {
      try {
        const res = await apiFetch<{ ok: boolean; username: string }>('/api/change-credentials', {
          method: 'POST',
          body: JSON.stringify({ newUsername, currentPassword, newPassword }),
        });
        setUsername(res.username);
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  const api = useMemo<AuthApi>(
    () => ({ isAuthenticated, username, login, loginError, logout, changeCredentials }),
    [isAuthenticated, username, login, loginError, logout, changeCredentials],
  );

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return ctx;
}
