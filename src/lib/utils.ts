import type { Doc, DocLine, InvoiceStatus, QuoteStatus } from '../types';

export const uid = (): string =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

/* ------------------------------ Formatting ------------------------------ */

const mad = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtMAD = (n: number): string => `${mad.format(n)} DH`;

export const fmtNum = (n: number): string =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n);

export const fmtDate = (iso: string): string =>
  new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export const fmtDateLong = (iso: string): string =>
  new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

/* -------------------------------- Dates --------------------------------- */

export const todayISO = (): string => new Date().toISOString().slice(0, 10);

export const addDays = (iso: string, days: number): string => {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const daysAgo = (n: number): string => addDays(todayISO(), -n);

export const daysBetween = (a: string, b: string): number =>
  Math.round((new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / 86400000);

export const monthKey = (iso: string): string => iso.slice(0, 7);

export const monthLabel = (key: string): string =>
  new Date(key + '-15T12:00:00').toLocaleDateString('fr-FR', { month: 'short' });

/* -------------------------------- Totals -------------------------------- */

export interface Totals {
  ht: number;
  tva: number;
  ttc: number;
  byRate: { rate: number; base: number; tax: number }[];
}

export const computeTotals = (lines: DocLine[]): Totals => {
  const map = new Map<number, { base: number; tax: number }>();
  let ht = 0;
  for (const l of lines) {
    const base = l.quantity * l.unitPrice;
    const tax = (base * l.vatRate) / 100;
    ht += base;
    const cur = map.get(l.vatRate) ?? { base: 0, tax: 0 };
    cur.base += base;
    cur.tax += tax;
    map.set(l.vatRate, cur);
  }
  const byRate = [...map.entries()]
    .map(([rate, v]) => ({ rate, base: v.base, tax: v.tax }))
    .sort((a, b) => b.rate - a.rate);
  const tva = byRate.reduce((s, r) => s + r.tax, 0);
  return { ht, tva, ttc: ht + tva, byRate };
};

export const paidAmount = (doc: Doc): number =>
  doc.payments.reduce((s, p) => s + p.amount, 0);

export const remainingAmount = (doc: Doc): number =>
  Math.max(0, computeTotals(doc.lines).ttc - paidAmount(doc));

/* -------------------------------- Status -------------------------------- */

export interface StatusMeta {
  label: string;
  cls: string;
  dot: string;
}

export const QUOTE_STATUS: Record<QuoteStatus, StatusMeta> = {
  brouillon: { label: 'Brouillon', cls: 'bg-slate-100 text-slate-600 ring-slate-300/60', dot: 'bg-slate-400' },
  envoye: { label: 'Envoyé', cls: 'bg-blue-50 text-blue-700 ring-blue-300/60', dot: 'bg-blue-500' },
  accepte: { label: 'Accepté', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-300/60', dot: 'bg-emerald-500' },
  refuse: { label: 'Refusé', cls: 'bg-rose-50 text-rose-700 ring-rose-300/60', dot: 'bg-rose-500' },
};

export const INVOICE_STATUS: Record<InvoiceStatus, StatusMeta> = {
  brouillon: { label: 'Brouillon', cls: 'bg-slate-100 text-slate-600 ring-slate-300/60', dot: 'bg-slate-400' },
  envoyee: { label: 'Envoyée', cls: 'bg-blue-50 text-blue-700 ring-blue-300/60', dot: 'bg-blue-500' },
  partielle: { label: 'Paiement partiel', cls: 'bg-violet-50 text-violet-700 ring-violet-300/60', dot: 'bg-violet-500' },
  payee: { label: 'Payée', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-300/60', dot: 'bg-emerald-500' },
  en_retard: { label: 'En retard', cls: 'bg-rose-50 text-rose-700 ring-rose-300/60', dot: 'bg-rose-500' },
};

/** Statut effectif d'une facture, recalculé à partir des règlements et de l'échéance. */
export const effectiveInvoiceStatus = (doc: Doc): InvoiceStatus => {
  if (doc.status === 'brouillon') return 'brouillon';
  const total = computeTotals(doc.lines).ttc;
  const paid = paidAmount(doc);
  if (paid >= total - 0.005) return 'payee';
  if (daysBetween(todayISO(), doc.dueAt) < 0) return 'en_retard';
  if (paid > 0) return 'partielle';
  return 'envoyee';
};

export const docStatusMeta = (doc: Doc): StatusMeta => {
  if (doc.kind === 'devis') return QUOTE_STATUS[doc.status as QuoteStatus];
  return INVOICE_STATUS[effectiveInvoiceStatus(doc)];
};

/* ------------------------------- Numérotation ---------------------------- */

export const nextDocNumber = (kind: 'devis' | 'facture', counters: { quote: number; invoice: number }): string => {
  const year = new Date().getFullYear();
  const n = kind === 'devis' ? counters.quote + 1 : counters.invoice + 1;
  return `${kind === 'devis' ? 'DEV' : 'FAC'}-${year}-${String(n).padStart(3, '0')}`;
};

/* --------------------------------- Divers -------------------------------- */

export const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

const AVATAR_COLORS = [
  'bg-emerald-100 text-emerald-700',
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
];

export const avatarColor = (seed: string): string => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

export const VAT_RATES = [20, 10, 5.5, 2.1, 0];

export const PAYMENT_METHODS: { value: string; label: string }[] = [
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'carte', label: 'Carte bancaire' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'especes', label: 'Espèces' },
  { value: 'prelevement', label: 'Prélèvement' },
];

export const TX_CATEGORIES = [
  'Vente',
  'Loyer',
  'Charges sociales',
  'Logiciels',
  'Fournisseurs',
  'Sous-traitance',
  'Déplacement',
  'Repas',
  'Assurance',
  'Fiscal',
  'Autre',
];

export const methodLabel = (m: string): string =>
  PAYMENT_METHODS.find((p) => p.value === m)?.label ?? m;
