import { motion } from 'framer-motion';
import {
  ArrowDownLeft, ArrowUpRight, Check, Copy, Landmark, Plus, Scale, Trash2, Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Card, ConfirmDialog, EmptyState, Field, Modal, inputCls, selectCls, selectStyle,
} from '../components/ui';
import { accountBalance, useData } from '../lib/store';
import type { BankAccount } from '../types';
import { TX_CATEGORIES, fmtDate, fmtMAD, todayISO, uid } from '../lib/utils';

const ACCOUNT_COLORS = ['#10b981', '#6366f1', '#0ea5e9', '#f59e0b', '#f43f5e', '#8b5cf6'];

const TYPE_LABELS: Record<BankAccount['type'], string> = {
  professionnel: 'Professionnel',
  courant: 'Courant',
  epargne: 'Épargne',
};

export default function Banks() {
  const { state, saveAccount, deleteAccount, addTransaction, deleteTransaction, toggleTransaction } = useData();
  const [selectedAccount, setSelectedAccount] = useState<string>('tous');
  const [accountModal, setAccountModal] = useState<BankAccount | null>(null);
  const [txModal, setTxModal] = useState(false);
  const [txForm, setTxForm] = useState({ accountId: '', date: todayISO(), label: '', amount: '', category: 'Vente', credit: true });
  const [toDeleteAccount, setToDeleteAccount] = useState<BankAccount | null>(null);
  const [toDeleteTx, setToDeleteTx] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const totalBalance = state.accounts.reduce((s, a) => s + accountBalance(state, a.id), 0);

  const transactions = useMemo(() => {
    return state.transactions
      .filter((t) => (selectedAccount === 'tous' ? true : t.accountId === selectedAccount))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [state.transactions, selectedAccount]);

  /* -------------------- Courbe d'évolution du solde -------------------- */
  const chartData = useMemo(() => {
    const txs = state.transactions
      .filter((t) => (selectedAccount === 'tous' ? true : t.accountId === selectedAccount))
      .sort((a, b) => a.date.localeCompare(b.date));
    const base =
      selectedAccount === 'tous'
        ? state.accounts.reduce((s, a) => s + a.initialBalance, 0)
        : state.accounts.find((a) => a.id === selectedAccount)?.initialBalance ?? 0;
    let running = base;
    const points = txs.map((t) => {
      running += t.amount;
      return { date: t.date, value: running };
    });
    if (points.length === 0) return [];
    return [{ date: points[0].date, value: base }, ...points];
  }, [state.transactions, state.accounts, selectedAccount]);

  const chart = useMemo(() => {
    if (chartData.length < 2) return null;
    const W = 640, H = 150, PAD = 6;
    const values = chartData.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const stepX = (W - PAD * 2) / (chartData.length - 1);
    const pts = chartData.map((p, i) => ({
      x: PAD + i * stepX,
      y: H - PAD - ((p.value - min) / span) * (H - PAD * 2 - 14),
    }));
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${H} L${pts[0].x.toFixed(1)},${H} Z`;
    return { line, area, last: pts[pts.length - 1], W, H };
  }, [chartData]);

  const copyIban = (id: string, iban: string) => {
    navigator.clipboard?.writeText(iban.replace(/\s/g, '')).catch(() => undefined);
    setCopied(id);
    window.setTimeout(() => setCopied(null), 1800);
  };

  const submitAccount = () => {
    if (!accountModal) return;
    if (!accountModal.name.trim() || !accountModal.bank.trim()) {
      setFormError('Le nom du compte et la banque sont obligatoires.');
      return;
    }
    saveAccount({ ...accountModal, name: accountModal.name.trim(), bank: accountModal.bank.trim() });
    setAccountModal(null);
    setFormError('');
  };

  const submitTx = () => {
    const amount = parseFloat(txForm.amount.replace(',', '.'));
    if (!txForm.label.trim() || isNaN(amount) || amount <= 0 || !txForm.accountId) {
      setFormError('Renseignez un libellé, un montant positif et un compte.');
      return;
    }
    addTransaction({
      id: uid(),
      accountId: txForm.accountId,
      date: txForm.date,
      label: txForm.label.trim(),
      amount: txForm.credit ? amount : -amount,
      category: txForm.category,
      reconciled: false,
    });
    setTxModal(false);
    setFormError('');
    setTxForm({ accountId: '', date: todayISO(), label: '', amount: '', category: 'Vente', credit: true });
  };

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">Banques</h1>
          <p className="mt-1 text-sm text-ink-500">
            {state.accounts.length} compte{state.accounts.length > 1 ? 's' : ''} · solde global{' '}
            <span className="font-mono font-bold text-ink-800">{fmtMAD(totalBalance)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setTxForm({ accountId: state.accounts[0]?.id ?? '', date: todayISO(), label: '', amount: '', category: 'Vente', credit: true });
              setFormError('');
              setTxModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-bold text-ink-700 transition hover:bg-ink-50"
          >
            <Scale size={15} /> Nouvelle écriture
          </button>
          <button
            onClick={() => {
              setAccountModal({
                id: uid(), name: '', bank: '', iban: '', type: 'professionnel',
                initialBalance: 0, color: ACCOUNT_COLORS[state.accounts.length % ACCOUNT_COLORS.length],
              });
              setFormError('');
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-ink-950 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-ink-950/20 transition hover:bg-ink-800"
          >
            <Plus size={16} /> Ajouter un compte
          </button>
        </div>
      </div>

      {/* Cartes comptes */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {state.accounts.map((a, i) => {
          const bal = accountBalance(state, a.id);
          const active = selectedAccount === a.id;
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
            >
              <button
                onClick={() => setSelectedAccount(active ? 'tous' : a.id)}
                className={`group relative w-full overflow-hidden rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-xl ${
                  active ? 'border-transparent shadow-xl' : 'border-ink-100 shadow-sm'
                }`}
                style={{
                  background: active
                    ? `linear-gradient(135deg, ${a.color}f2, ${a.color}cc)`
                    : 'white',
                }}
              >
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-15"
                  style={{ background: a.color }}
                />
                <div className="flex items-start justify-between">
                  <div className={`rounded-xl p-2.5 ${active ? 'bg-white/20 text-white' : 'bg-ink-50 text-ink-600'}`}>
                    {a.type === 'epargne' ? <Wallet size={18} /> : <Landmark size={18} />}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    active ? 'bg-white/20 text-white' : 'bg-ink-50 text-ink-500'
                  }`}>
                    {TYPE_LABELS[a.type]}
                  </span>
                </div>
                <div className={`mt-4 text-sm font-bold ${active ? 'text-white' : 'text-ink-900'}`}>{a.name}</div>
                <div className={`text-xs ${active ? 'text-white/75' : 'text-ink-400'}`}>{a.bank}</div>
                <div className={`mt-3 font-mono text-2xl font-bold tracking-tight ${active ? 'text-white' : 'text-ink-900'}`}>
                  {fmtMAD(bal)}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`font-mono text-[11px] ${active ? 'text-white/70' : 'text-ink-400'}`}>
                    {a.iban || 'IBAN non renseigné'}
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); copyIban(a.id, a.iban); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); copyIban(a.id, a.iban); } }}
                    className={`rounded-lg p-1.5 transition ${
                      active ? 'text-white/80 hover:bg-white/20' : 'text-ink-300 hover:bg-ink-50 hover:text-ink-600'
                    }`}
                    title="Copier l'IBAN"
                  >
                    {copied === a.id ? <Check size={14} /> : <Copy size={14} />}
                  </span>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Graphique + écritures */}
      <div className="grid gap-4 xl:grid-cols-[1fr]">
        <Card className="p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-ink-900">
                Écritures {selectedAccount !== 'tous' && `— ${state.accounts.find((a) => a.id === selectedAccount)?.name}`}
              </h2>
              <p className="text-xs text-ink-400">
                {transactions.length} opération{transactions.length > 1 ? 's' : ''}
                {selectedAccount !== 'tous' && (
                  <button onClick={() => setSelectedAccount('tous')} className="ml-2 font-bold text-brand-700 hover:underline">
                    Voir tous les comptes
                  </button>
                )}
              </p>
            </div>
            {chart && (
              <span className="rounded-full bg-brand-50 px-3 py-1 font-mono text-xs font-bold text-brand-700">
                Solde : {fmtMAD(chartData[chartData.length - 1]?.value ?? 0)}
              </span>
            )}
          </div>

          {/* Courbe de solde */}
          {chart && (
            <div className="mb-5 overflow-hidden rounded-xl bg-ink-50/60 p-3">
              <svg viewBox={`0 0 ${chart.W} ${chart.H}`} className="h-32 w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <path d={chart.area} fill="url(#balanceFill)" />
                <path d={chart.line} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                <circle cx={chart.last.x} cy={chart.last.y} r="4.5" fill="#059669" stroke="white" strokeWidth="2" />
              </svg>
            </div>
          )}

          {transactions.length === 0 ? (
            <EmptyState
              icon={<Scale size={26} />}
              title="Aucune écriture"
              message="Ajoutez votre première opération bancaire pour suivre votre trésorerie."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left">
                    <th className="py-3 pr-4 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">Date</th>
                    <th className="py-3 pr-4 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">Libellé</th>
                    <th className="py-3 pr-4 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">Catégorie</th>
                    <th className="py-3 pr-4 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">Compte</th>
                    <th className="py-3 pr-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">Rapproché</th>
                    <th className="py-3 pr-2 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">Montant</th>
                    <th className="py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-50">
                  {transactions.map((t) => {
                    const acc = state.accounts.find((a) => a.id === t.accountId);
                    const invoice = t.invoiceId ? state.docs.find((d) => d.id === t.invoiceId) : undefined;
                    return (
                      <tr key={t.id} className="group transition hover:bg-ink-50/40">
                        <td className="whitespace-nowrap py-3.5 pr-4 text-ink-500">{fmtDate(t.date)}</td>
                        <td className="max-w-[280px] py-3.5 pr-4">
                          {invoice ? (
                            <Link to={`/factures/${invoice.id}`} className="truncate font-semibold text-ink-800 hover:text-brand-700 hover:underline">
                              {t.label}
                            </Link>
                          ) : (
                            <span className="truncate font-semibold text-ink-800">{t.label}</span>
                          )}
                        </td>
                        <td className="py-3.5 pr-4">
                          <span className="rounded-full bg-ink-50 px-2.5 py-1 text-xs font-semibold text-ink-500">
                            {t.category}
                          </span>
                        </td>
                        <td className="whitespace-nowrap py-3.5 pr-4">
                          <span className="flex items-center gap-2 text-xs text-ink-500">
                            <span className="h-2 w-2 rounded-full" style={{ background: acc?.color ?? '#ccc' }} />
                            {acc?.name ?? '—'}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 text-center">
                          <button
                            onClick={() => toggleTransaction(t.id)}
                            title={t.reconciled ? 'Rapprochée' : 'Marquer comme rapprochée'}
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-lg border transition ${
                              t.reconciled
                                ? 'border-brand-500 bg-brand-500 text-white'
                                : 'border-ink-200 bg-white text-transparent hover:border-brand-400'
                            }`}
                          >
                            <Check size={13} strokeWidth={3} />
                          </button>
                        </td>
                        <td className="whitespace-nowrap py-3.5 pr-2 text-right">
                          <span className={`inline-flex items-center gap-1 font-mono font-bold ${t.amount >= 0 ? 'text-brand-600' : 'text-ink-800'}`}>
                            {t.amount >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownLeft size={13} className="text-ink-400" />}
                            {fmtMAD(Math.abs(t.amount))}
                          </span>
                        </td>
                        <td className="py-3.5 pl-2 text-right">
                          <button
                            onClick={() => setToDeleteTx(t.id)}
                            className="rounded-lg p-1.5 text-ink-200 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500"
                            aria-label="Supprimer l'écriture"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Modale compte */}
      <Modal
        open={!!accountModal}
        onClose={() => setAccountModal(null)}
        title={accountModal && state.accounts.some((a) => a.id === accountModal.id) ? 'Modifier le compte' : 'Ajouter un compte'}
      >
        {accountModal && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom du compte *">
                <input
                  className={inputCls}
                  placeholder="Ex. Compte professionnel"
                  value={accountModal.name}
                  onChange={(e) => setAccountModal({ ...accountModal, name: e.target.value })}
                />
              </Field>
              <Field label="Banque *">
                <input
                  className={inputCls}
                  placeholder="Ex. Qonto"
                  value={accountModal.bank}
                  onChange={(e) => setAccountModal({ ...accountModal, bank: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type de compte">
                <select
                  className={selectCls} style={selectStyle}
                  value={accountModal.type}
                  onChange={(e) => setAccountModal({ ...accountModal, type: e.target.value as BankAccount['type'] })}
                >
                  <option value="professionnel">Professionnel</option>
                  <option value="courant">Courant</option>
                  <option value="epargne">Épargne</option>
                </select>
              </Field>
              <Field label="Solde initial (DH)">
                <input
                  type="number" step="0.01"
                  className={inputCls + ' font-mono'}
                  value={accountModal.initialBalance || ''}
                  onChange={(e) => setAccountModal({ ...accountModal, initialBalance: parseFloat(e.target.value) || 0 })}
                />
              </Field>
            </div>
            <Field label="IBAN">
              <input
                className={inputCls + ' font-mono'}
                placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                value={accountModal.iban}
                onChange={(e) => setAccountModal({ ...accountModal, iban: e.target.value })}
              />
            </Field>
            <Field label="Couleur">
              <div className="flex gap-2 pt-1">
                {ACCOUNT_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setAccountModal({ ...accountModal, color: c })}
                    className={`h-8 w-8 rounded-full transition ${accountModal.color === c ? 'ring-2 ring-ink-900 ring-offset-2' : 'hover:scale-110'}`}
                    style={{ background: c }}
                    aria-label={`Couleur ${c}`}
                  />
                ))}
              </div>
            </Field>
            {formError && (
              <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-200">{formError}</p>
            )}
            <div className="flex items-center justify-between pt-1">
              {state.accounts.some((a) => a.id === accountModal.id) ? (
                <button
                  onClick={() => { setAccountModal(null); setToDeleteAccount(accountModal); }}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  Supprimer ce compte
                </button>
              ) : <span />}
              <div className="flex gap-2">
                <button onClick={() => setAccountModal(null)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-500 hover:bg-ink-50">
                  Annuler
                </button>
                <button
                  onClick={submitAccount}
                  className="rounded-xl bg-ink-950 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-ink-950/20 hover:bg-ink-800"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modale écriture */}
      <Modal open={txModal} onClose={() => setTxModal(false)} title="Nouvelle écriture">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-ink-200 bg-ink-50/50 p-1">
            <button
              onClick={() => setTxForm({ ...txForm, credit: true })}
              className={`rounded-lg px-3 py-2.5 text-sm font-bold transition ${txForm.credit ? 'bg-brand-600 text-white shadow' : 'text-ink-500 hover:bg-white'}`}
            >
              Crédit (entrée)
            </button>
            <button
              onClick={() => setTxForm({ ...txForm, credit: false })}
              className={`rounded-lg px-3 py-2.5 text-sm font-bold transition ${!txForm.credit ? 'bg-rose-500 text-white shadow' : 'text-ink-500 hover:bg-white'}`}
            >
              Débit (sortie)
            </button>
          </div>
          <Field label="Libellé *">
            <input
              className={inputCls}
              placeholder="Ex. Loyer bureau, Règlement client…"
              value={txForm.label}
              onChange={(e) => setTxForm({ ...txForm, label: e.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Montant (DH) *">
              <input
                type="number" min={0} step="0.01"
                className={inputCls + ' font-mono'}
                placeholder="0,00"
                value={txForm.amount}
                onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
              />
            </Field>
            <Field label="Date">
              <input type="date" className={inputCls} value={txForm.date} onChange={(e) => setTxForm({ ...txForm, date: e.target.value })} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Compte">
              <select
                className={selectCls} style={selectStyle}
                value={txForm.accountId}
                onChange={(e) => setTxForm({ ...txForm, accountId: e.target.value })}
              >
                {state.accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} — {a.bank}</option>
                ))}
              </select>
            </Field>
            <Field label="Catégorie">
              <select
                className={selectCls} style={selectStyle}
                value={txForm.category}
                onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}
              >
                {TX_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          {formError && (
            <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-200">{formError}</p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setTxModal(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-500 hover:bg-ink-50">
              Annuler
            </button>
            <button
              onClick={submitTx}
              className="rounded-xl bg-ink-950 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-ink-950/20 hover:bg-ink-800"
            >
              Ajouter l'écriture
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDeleteAccount}
        onClose={() => setToDeleteAccount(null)}
        onConfirm={() => {
          if (toDeleteAccount) {
            deleteAccount(toDeleteAccount.id);
            if (selectedAccount === toDeleteAccount.id) setSelectedAccount('tous');
          }
        }}
        title="Supprimer ce compte ?"
        message={`Le compte « ${toDeleteAccount?.name} » et toutes ses écritures seront supprimés.`}
      />
      <ConfirmDialog
        open={!!toDeleteTx}
        onClose={() => setToDeleteTx(null)}
        onConfirm={() => toDeleteTx && deleteTransaction(toDeleteTx)}
        title="Supprimer cette écriture ?"
        message="L'opération sera retirée du relevé et le solde du compte sera recalculé."
      />
    </div>
  );
}
