import { useState } from 'react';
import type { FormEvent } from 'react';
import { Lock, LogIn, User } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { inputCls } from '../components/ui';
import logo from '../assets/logo.syzon.png';

export default function Login() {
  const { login, loginError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await login(username, password);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-center">
          <img src={logo} alt="Syzon Design Decor" className="h-16 w-auto object-contain" />
        </div>
        <h1 className="mb-1 text-center text-lg font-bold text-ink-900">Espace administrateur</h1>
        <p className="mb-6 text-center text-sm text-ink-500">Connectez-vous pour accéder à l'application.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink-600">Identifiant</span>
            <div className="relative">
              <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
              <input
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputCls + ' pl-9'}
                placeholder="admin"
                autoComplete="username"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink-600">Mot de passe</span>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls + ' pl-9'}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </label>

          {loginError && <p className="text-sm font-semibold text-red-600">{loginError}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            <LogIn size={16} />
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
