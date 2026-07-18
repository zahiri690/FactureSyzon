import { motion } from 'framer-motion';
import {
  AlertCircle, ArrowRight, ArrowUpRight, Banknote, Clock3, FileCheck2,
  Hourglass, PiggyBank, TrendingUp, Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { accountBalance, useData } from '../lib/store';
import {
  computeTotals, docStatusMeta, effectiveInvoiceStatus, fmtDate, fmtMAD,
  monthKey, monthLabel, paidAmount, remainingAmount, todayISO,
} from '../lib/utils';
import { Card, StatusBadge } from '../components/ui';

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const { state } = useData();
  const invoices = state.docs.filter((d) => d.kind === 'facture');
  const quotes = state.docs.filter((d) => d.kind === 'devis');

  /* ------------------------------ Calculs KPI ------------------------------ */
  const thisMonth = monthKey(todayISO());
  const encaisseMois = invoices
    .flatMap((d) => d.payments)
    .filter((p) => monthKey(p.date) === thisMonth)
    .reduce((s, p) => s + p.amount, 0);

  const open = invoices.filter((d) => ['envoyee', 'partielle', 'en_retard'].includes(effectiveInvoiceStatus(d)));
  const enAttente = open.reduce((s, d) => s + remainingAmount(d), 0);

  const late = invoices.filter((d) => effectiveInvoiceStatus(d) === 'en_retard');
  const lateAmount = late.reduce((s, d) => s + remainingAmount(d), 0);

  const pendingQuotes = quotes.filter((d) => d.status === 'envoye');
  const pendingQuotesAmount = pendingQuotes.reduce((s, d) => s + computeTotals(d.lines).ttc, 0);
  const answeredQuotes = quotes.filter((d) => d.status === 'accepte' || d.status === 'refuse');
  const acceptRate = answeredQuotes.length
    ? Math.round((quotes.filter((d) => d.status === 'accepte').length / answeredQuotes.length) * 100)
    : 0;

  const treasury = state.accounts.reduce((s, a) => s + accountBalance(state, a.id), 0);

  /* --------------------------- Graphique 6 mois ---------------------------- */
  const months: string[] = [];
  {
    const d = new Date();
    d.setDate(1);
    for (let i = 5; i >= 0; i--) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 15);
      months.push(m.toISOString().slice(0, 7));
    }
  }
  const paymentsByMonth = months.map((m) =>
    invoices.flatMap((d) => d.payments).filter((p) => monthKey(p.date) === m).reduce((s, p) => s + p.amount, 0),
  );
  const maxMonth = Math.max(...paymentsByMonth, 1);

  /* ------------------------------ Donut statuts ---------------------------- */
  const statusCounts: { key: string; label: string; color: string; count: number }[] = [
    { key: 'payee', label: 'Payées', color: '#10b981', count: 0 },
    { key: 'envoyee', label: 'Envoyées', color: '#3b82f6', count: 0 },
    { key: 'partielle', label: 'Partielles', color: '#8b5cf6', count: 0 },
    { key: 'en_retard', label: 'En retard', color: '#f43f5e', count: 0 },
    { key: 'brouillon', label: 'Brouillons', color: '#94a3b8', count: 0 },
  ];
  invoices.forEach((d) => {
    const s = effectiveInvoiceStatus(d);
    const entry = statusCounts.find((x) => x.key === s);
    if (entry) entry.count += 1;
  });
  const totalInvoices = Math.max(invoices.length, 1);
  let acc = 0;
  const R = 15.9;
  const C = 2 * Math.PI * R;

  const recentInvoices = [...invoices]
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
    .slice(0, 6);

  const toRelaunch = quotes
    .filter((d) => d.status === 'envoye')
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    .slice(0, 4);

  const kpis = [
    {
      label: 'Encaissé ce mois-ci', value: fmtMAD(encaisseMois), icon: Banknote,
      accent: 'bg-brand-50 text-brand-600', sub: 'Règlements reçus sur vos comptes',
    },
    {
      label: 'En attente d’encaissement', value: fmtMAD(enAttente), icon: Hourglass,
      accent: 'bg-blue-50 text-blue-600', sub: `${open.length} facture${open.length > 1 ? 's' : ''} ouverte${open.length > 1 ? 's' : ''}`,
    },
    {
      label: 'Factures en retard', value: fmtMAD(lateAmount), icon: AlertCircle,
      accent: 'bg-rose-50 text-rose-600', sub: `${late.length} facture${late.length > 1 ? 's' : ''} à relancer`,
    },
    {
      label: 'Devis en cours', value: fmtMAD(pendingQuotesAmount), icon: FileCheck2,
      accent: 'bg-violet-50 text-violet-600', sub: `Taux d’acceptation : ${acceptRate} %`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">Tableau de bord</h1>
          <p className="mt-1 text-sm text-ink-500">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {' — '}vue d'ensemble de votre activité
          </p>
        </div>
        <div className="flex items-center gap-2.5 rounded-2xl border border-ink-100 bg-white px-4 py-2.5 shadow-sm">
          <PiggyBank size={18} className="text-brand-600" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-ink-400">Trésorerie totale</div>
            <div className="font-mono text-base font-bold text-ink-900">{fmtMAD(treasury)}</div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label} {...fadeUp} transition={{ delay: i * 0.06, duration: 0.4 }}>
            <Card className="p-5">
              <div className="flex items-start justify-between">
                <div className={`rounded-xl p-2.5 ${k.accent}`}>
                  <k.icon size={19} />
                </div>
                <TrendingUp size={15} className="text-ink-200" />
              </div>
              <div className="mt-4 font-mono text-[22px] font-bold tracking-tight text-ink-900">{k.value}</div>
              <div className="mt-0.5 text-sm font-semibold text-ink-700">{k.label}</div>
              <div className="mt-0.5 text-xs text-ink-400">{k.sub}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Graphiques */}
      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <motion.div {...fadeUp} transition={{ delay: 0.15, duration: 0.4 }}>
          <Card className="h-full p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-ink-900">Revenus encaissés</h2>
                <p className="text-xs text-ink-400">6 derniers mois, tous comptes confondus</p>
              </div>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                {fmtMAD(paymentsByMonth.reduce((a, b) => a + b, 0))} au total
              </span>
            </div>
            <div className="flex h-52 items-end gap-3 sm:gap-5">
              {paymentsByMonth.map((v, i) => (
                <div key={months[i]} className="group flex flex-1 flex-col items-center gap-2">
                  <div className="relative flex h-40 w-full items-end justify-center">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max((v / maxMonth) * 100, v > 0 ? 6 : 2)}%` }}
                      transition={{ delay: 0.3 + i * 0.07, duration: 0.6, type: 'spring', damping: 20 }}
                      className={`w-full max-w-[52px] rounded-t-lg ${
                        i === paymentsByMonth.length - 1
                          ? 'bg-gradient-to-t from-brand-600 to-brand-400'
                          : 'bg-ink-100 group-hover:bg-brand-200'
                      } transition-colors`}
                    />
                    <div className="pointer-events-none absolute -top-8 whitespace-nowrap rounded-lg bg-ink-950 px-2 py-1 font-mono text-[11px] font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                      {fmtMAD(v)}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold ${i === paymentsByMonth.length - 1 ? 'text-brand-700' : 'text-ink-400'}`}>
                    {monthLabel(months[i])}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.22, duration: 0.4 }}>
          <Card className="h-full p-6">
            <h2 className="text-base font-bold text-ink-900">Factures par statut</h2>
            <p className="text-xs text-ink-400">{invoices.length} facture{invoices.length > 1 ? 's' : ''} au total</p>
            <div className="mt-5 flex items-center gap-6">
              <svg viewBox="0 0 42 42" className="h-36 w-36 shrink-0 -rotate-90">
                <circle cx="21" cy="21" r={R} fill="none" stroke="#eef1f6" strokeWidth="5" />
                {statusCounts
                  .filter((s) => s.count > 0)
                  .map((s) => {
                    const frac = s.count / totalInvoices;
                    const dash = `${frac * C} ${C}`;
                    const offset = -acc * C;
                    acc += frac;
                    return (
                      <circle
                        key={s.key} cx="21" cy="21" r={R} fill="none"
                        stroke={s.color} strokeWidth="5" strokeDasharray={dash}
                        strokeDashoffset={offset} strokeLinecap="butt"
                      />
                    );
                  })}
              </svg>
              <ul className="flex-1 space-y-2.5">
                {statusCounts.map((s) => (
                  <li key={s.key} className="flex items-center gap-2.5 text-sm">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                    <span className="text-ink-600">{s.label}</span>
                    <span className="ml-auto font-mono font-bold text-ink-800">{s.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Listes */}
      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        {/* Factures récentes */}
        <motion.div {...fadeUp} transition={{ delay: 0.28, duration: 0.4 }}>
          <Card>
            <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
              <h2 className="text-base font-bold text-ink-900">Factures récentes</h2>
              <Link
                to="/factures"
                className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 transition hover:text-brand-800"
              >
                Tout voir <ArrowRight size={13} />
              </Link>
            </div>
            <ul className="divide-y divide-ink-50">
              {recentInvoices.map((d) => {
                const contact = state.contacts.find((c) => c.id === d.contactId);
                const status = effectiveInvoiceStatus(d);
                return (
                  <li key={d.id}>
                    <Link
                      to={`/factures/${d.id}`}
                      className="flex items-center gap-4 px-6 py-3.5 transition hover:bg-ink-50/50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-ink-800">{contact?.company ?? '—'}</div>
                        <div className="font-mono text-xs text-ink-400">{d.number} · {fmtDate(d.issuedAt)}</div>
                      </div>
                      <div className="hidden sm:block">
                        <StatusBadge meta={docStatusMeta(d)} />
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-bold text-ink-900">
                          {fmtMAD(computeTotals(d.lines).ttc)}
                        </div>
                        {status !== 'payee' && status !== 'brouillon' && paidAmount(d) > 0 && (
                          <div className="text-[11px] text-ink-400">reste {fmtMAD(remainingAmount(d))}</div>
                        )}
                      </div>
                      <ArrowUpRight size={15} className="text-ink-300" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        </motion.div>

        {/* Devis à relancer + comptes */}
        <div className="space-y-4">
          <motion.div {...fadeUp} transition={{ delay: 0.34, duration: 0.4 }}>
            <Card>
              <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
                <h2 className="flex items-center gap-2 text-base font-bold text-ink-900">
                  <Clock3 size={16} className="text-amber-500" /> Devis à relancer
                </h2>
                <Link to="/devis" className="text-xs font-bold text-brand-700 hover:text-brand-800">
                  Tout voir
                </Link>
              </div>
              {toRelaunch.length === 0 ? (
                <p className="px-6 py-6 text-sm text-ink-400">Aucun devis en attente de réponse. Tout est à jour.</p>
              ) : (
                <ul className="divide-y divide-ink-50">
                  {toRelaunch.map((d) => {
                    const contact = state.contacts.find((c) => c.id === d.contactId);
                    const daysLeft = Math.round(
                      (new Date(d.dueAt).getTime() - new Date(todayISO()).getTime()) / 86400000,
                    );
                    return (
                      <li key={d.id}>
                        <Link to={`/devis/${d.id}`} className="flex items-center gap-3 px-6 py-3.5 transition hover:bg-ink-50/50">
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-bold text-ink-800">{contact?.company}</div>
                            <div className="font-mono text-xs text-ink-400">{d.number}</div>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            daysLeft <= 5 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {daysLeft < 0 ? 'Expiré' : `J−${daysLeft}`}
                          </span>
                          <span className="font-mono text-sm font-bold text-ink-800">
                            {fmtMAD(computeTotals(d.lines).ttc)}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </motion.div>

          <motion.div {...fadeUp} transition={{ delay: 0.4, duration: 0.4 }}>
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-bold text-ink-900">
                  <Wallet size={16} className="text-brand-600" /> Comptes bancaires
                </h2>
                <Link to="/banques" className="text-xs font-bold text-brand-700 hover:text-brand-800">
                  Gérer
                </Link>
              </div>
              <ul className="space-y-3">
                {state.accounts.map((a) => {
                  const bal = accountBalance(state, a.id);
                  return (
                    <li key={a.id} className="flex items-center gap-3">
                      <span className="h-9 w-1.5 rounded-full" style={{ background: a.color }} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-ink-800">{a.name}</div>
                        <div className="text-xs text-ink-400">{a.bank}</div>
                      </div>
                      <span className="font-mono text-sm font-bold text-ink-900">{fmtMAD(bal)}</span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
