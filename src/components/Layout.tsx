import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen, Building2, FileText, Landmark, LayoutDashboard, LogOut, Menu,
  Package, Receipt, Users, X,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useData } from '../lib/store';
import { useAuth } from '../lib/auth';
import { Toasts } from './ui';
import logo from '../assets/logo.syzon.png';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: 'Pilotage',
    items: [{ to: '/', label: 'Tableau de bord', icon: LayoutDashboard, end: true }],
  },
  {
    section: 'Ventes',
    items: [
      { to: '/devis', label: 'Devis', icon: FileText },
      { to: '/factures', label: 'Factures', icon: Receipt },
    ],
  },
  {
    section: 'Gestion',
    items: [
      { to: '/banques', label: 'Banques', icon: Landmark },
      { to: '/contacts', label: 'Contacts', icon: Users },
    ],
  },
  {
    section: 'Données',
    items: [
      { to: '/bibliotheque', label: 'Bibliothèque', icon: Package },
      { to: '/ressources', label: 'Ressources', icon: BookOpen },
    ],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { state } = useData();
  const { username, logout } = useAuth();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center px-5 pt-6 pb-7">
        <div className="flex h-16 w-full items-center overflow-hidden rounded-2xl bg-white px-3 shadow-lg shadow-brand-500/30">
          <img src={logo} alt="Syzon Design Decor" className="h-[70%] w-auto object-contain" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3">
        {NAV.map((group) => (
          <div key={group.section}>
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">
              {group.section}
            </div>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/10'
                          : 'text-ink-300 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          size={18}
                          className={isActive ? 'text-brand-400' : 'text-ink-400 transition group-hover:text-brand-300'}
                        />
                        {item.label}
                        {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-400" />}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Pied : entreprise + reset */}
      <div className="space-y-3 border-t border-white/5 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
            <Building2 size={17} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-white">{state.company.name}</div>
            <div className="truncate text-[11px] text-ink-400">ICE {state.company.ice}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-ink-400 transition hover:bg-white/5 hover:text-ink-200"
        >
          <LogOut size={13} />
          Déconnexion ({username})
        </button>
      </div>
    </div>
  );
}

const TITLES: [RegExp, string][] = [
  [/^\/$/, 'Tableau de bord'],
  [/^\/devis/, 'Devis'],
  [/^\/factures/, 'Factures'],
  [/^\/banques/, 'Banques'],
  [/^\/contacts/, 'Contacts'],
  [/^\/bibliotheque/, 'Bibliothèque'],
  [/^\/ressources/, 'Ressources'],
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { toasts } = useData();
  const location = useLocation();
  const title = TITLES.find(([re]) => re.test(location.pathname))?.[1] ?? 'Facturo';

  return (
    <div className="min-h-screen">
      {/* Sidebar desktop */}
      <aside className="print-hidden fixed inset-y-0 left-0 z-40 hidden w-[268px] bg-ink-950 lg:block">
        <SidebarContent />
      </aside>

      {/* Sidebar mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="print-hidden fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute inset-y-0 left-0 w-[280px] bg-ink-950 shadow-2xl"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-3 rounded-lg p-2 text-ink-400 hover:bg-white/10 hover:text-white"
                aria-label="Fermer le menu"
              >
                <X size={18} />
              </button>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenu */}
      <div className="lg:pl-[268px]">
        {/* Topbar mobile */}
        <header className="print-hidden sticky top-0 z-30 flex items-center gap-3 border-b border-ink-100 bg-white/85 px-4 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-ink-600 hover:bg-ink-50"
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} />
          </button>
          <span className="text-base font-bold text-ink-900">{title}</span>
          <img src={logo} alt="Syzon Design Decor" className="ml-auto h-9 w-auto object-contain" />
        </header>

        <main className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-9 print:max-w-none print:p-0">
          <Outlet />
        </main>
      </div>

      <Toasts toasts={toasts} />
    </div>
  );
}
