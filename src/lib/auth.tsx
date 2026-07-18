import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

const CREDENTIALS_KEY = 'facturo-auth-v1';
const SESSION_KEY = 'facturo-session-v1';

/** Identifiants par défaut (à changer après la première connexion). */
const DEFAULT_USERNAME = 'admin';
/** SHA-256 de "Syzon@2025" — le mot de passe en clair n'est jamais stocké. */
const DEFAULT_PASSWORD_HASH = 'bebd615fff73c8e9c65de9544cf9ab62b3b5e1e8a09353fa4155fbf1ad763f4f';

interface StoredCredentials {
  username: string;
  passwordHash: string;
}

const sha256Hex = async (text: string): Promise<string> => {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const loadCredentials = (): StoredCredentials => {
  try {
    const raw = localStorage.getItem(CREDENTIALS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredCredentials;
      if (parsed?.username && parsed?.passwordHash) return parsed;
    }
  } catch {
    /* données corrompues → identifiants par défaut */
  }
  return { username: DEFAULT_USERNAME, passwordHash: DEFAULT_PASSWORD_HASH };
};

interface AuthApi {
  isAuthenticated: boolean;
  username: string;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  changeCredentials: (newUsername: string, currentPassword: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthApi | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [creds, setCreds] = useState<StoredCredentials>(loadCredentials);
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === '1',
  );

  useEffect(() => {
    try {
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
    } catch {
      /* quota dépassé */
    }
  }, [creds]);

  const login = useCallback(
    async (usernameInput: string, password: string) => {
      const hash = await sha256Hex(password);
      const ok = usernameInput.trim() === creds.username && hash === creds.passwordHash;
      if (ok) {
        sessionStorage.setItem(SESSION_KEY, '1');
        setIsAuthenticated(true);
      }
      return ok;
    },
    [creds],
  );

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  }, []);

  const changeCredentials = useCallback(
    async (newUsername: string, currentPassword: string, newPassword: string) => {
      const currentHash = await sha256Hex(currentPassword);
      if (currentHash !== creds.passwordHash) return false;
      const passwordHash = newPassword ? await sha256Hex(newPassword) : creds.passwordHash;
      setCreds({ username: newUsername.trim() || creds.username, passwordHash });
      return true;
    },
    [creds],
  );

  const api = useMemo<AuthApi>(
    () => ({ isAuthenticated, username: creds.username, login, logout, changeCredentials }),
    [isAuthenticated, creds.username, login, logout, changeCredentials],
  );

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return ctx;
}
