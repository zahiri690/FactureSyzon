import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  AppState, BankAccount, BankTransaction, Contact, Doc, ID,
  LibraryItem, Payment,
} from '../types';
import { buildSeed } from './seed';
import { nextDocNumber, todayISO, uid } from './utils';

const STORAGE_KEY = 'facturo-data-v1';

/* --------------------------------- Reducer -------------------------------- */

type Action =
  | { type: 'contact/save'; contact: Contact }
  | { type: 'contact/delete'; id: ID }
  | { type: 'item/save'; item: LibraryItem }
  | { type: 'item/delete'; id: ID }
  | { type: 'doc/save'; doc: Doc }
  | { type: 'doc/delete'; id: ID }
  | { type: 'doc/status'; id: ID; status: Doc['status'] }
  | { type: 'doc/payment'; id: ID; payment: Payment }
  | { type: 'doc/convert'; quoteId: ID; invoice: Doc }
  | { type: 'account/save'; account: BankAccount }
  | { type: 'account/delete'; id: ID }
  | { type: 'tx/add'; tx: BankTransaction }
  | { type: 'tx/delete'; id: ID }
  | { type: 'tx/toggle'; id: ID }
  | { type: 'reset' };

const upsert = <T extends { id: ID }>(list: T[], item: T): T[] => {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) return [...list, item];
  const copy = [...list];
  copy[i] = item;
  return copy;
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'contact/save':
      return { ...state, contacts: upsert(state.contacts, action.contact) };
    case 'contact/delete':
      return { ...state, contacts: state.contacts.filter((c) => c.id !== action.id) };
    case 'item/save':
      return { ...state, items: upsert(state.items, action.item) };
    case 'item/delete':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    case 'doc/save': {
      const exists = state.docs.some((d) => d.id === action.doc.id);
      return {
        ...state,
        docs: upsert(state.docs, action.doc),
        counters: exists
          ? state.counters
          : action.doc.kind === 'devis'
            ? { ...state.counters, quote: state.counters.quote + 1 }
            : { ...state.counters, invoice: state.counters.invoice + 1 },
      };
    }
    case 'doc/delete':
      return { ...state, docs: state.docs.filter((d) => d.id !== action.id) };
    case 'doc/status':
      return {
        ...state,
        docs: state.docs.map((d) => (d.id === action.id ? { ...d, status: action.status } : d)),
      };
    case 'doc/payment':
      return {
        ...state,
        docs: state.docs.map((d) =>
          d.id === action.id ? { ...d, payments: [...d.payments, action.payment] } : d,
        ),
      };
    case 'doc/convert':
      return {
        ...state,
        docs: [
          ...state.docs.map((d) => (d.id === action.quoteId ? { ...d, status: 'accepte' as const } : d)),
          action.invoice,
        ],
        counters: { ...state.counters, invoice: state.counters.invoice + 1 },
      };
    case 'account/save':
      return { ...state, accounts: upsert(state.accounts, action.account) };
    case 'account/delete':
      return {
        ...state,
        accounts: state.accounts.filter((a) => a.id !== action.id),
        transactions: state.transactions.filter((t) => t.accountId !== action.id),
      };
    case 'tx/add':
      return { ...state, transactions: [...state.transactions, action.tx] };
    case 'tx/delete':
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id) };
    case 'tx/toggle':
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.id ? { ...t, reconciled: !t.reconciled } : t,
        ),
      };
    case 'reset':
      return buildSeed();
    default:
      return state;
  }
}

/* --------------------------------- Context -------------------------------- */

interface Toast {
  id: ID;
  message: string;
  kind: 'success' | 'error' | 'info';
}

interface DataApi {
  state: AppState;
  toasts: Toast[];
  saveContact: (c: Contact) => void;
  deleteContact: (id: ID) => boolean;
  saveItem: (i: LibraryItem) => void;
  deleteItem: (id: ID) => void;
  saveDoc: (d: Doc, silent?: boolean) => void;
  deleteDoc: (id: ID) => void;
  setDocStatus: (id: ID, status: Doc['status']) => void;
  addPayment: (id: ID, payment: Payment) => void;
  convertQuote: (quoteId: ID) => ID | null;
  duplicateDoc: (id: ID) => ID;
  saveAccount: (a: BankAccount) => void;
  deleteAccount: (id: ID) => void;
  addTransaction: (t: BankTransaction) => void;
  deleteTransaction: (id: ID) => void;
  toggleTransaction: (id: ID) => void;
  resetData: () => void;
  pushToast: (message: string, kind?: Toast['kind']) => void;
}

const DataContext = createContext<DataApi | null>(null);

const load = (): AppState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed && Array.isArray(parsed.docs) && Array.isArray(parsed.contacts)) return parsed;
    }
  } catch {
    /* données corrompues → seed */
  }
  return buildSeed();
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota dépassé */
    }
  }, [state]);

  const pushToast = useCallback((message: string, kind: Toast['kind'] = 'success') => {
    const id = uid();
    setToasts((t) => [...t, { id, message, kind }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const api = useMemo<DataApi>(() => ({
    state,
    toasts,
    pushToast,
    saveContact: (c) => {
      dispatch({ type: 'contact/save', contact: c });
      pushToast(`Contact « ${c.company} » enregistré`);
    },
    deleteContact: (id) => {
      const used = state.docs.some((d) => d.contactId === id);
      if (used) {
        pushToast('Impossible : ce contact est lié à des documents', 'error');
        return false;
      }
      dispatch({ type: 'contact/delete', id });
      pushToast('Contact supprimé');
      return true;
    },
    saveItem: (i) => {
      dispatch({ type: 'item/save', item: i });
      pushToast(`Article « ${i.name} » enregistré`);
    },
    deleteItem: (id) => {
      dispatch({ type: 'item/delete', id });
      pushToast('Article supprimé');
    },
    saveDoc: (d, silent) => {
      dispatch({ type: 'doc/save', doc: d });
      if (!silent) pushToast(`${d.kind === 'devis' ? 'Devis' : 'Facture'} ${d.number} enregistré${d.kind === 'devis' ? '' : 'e'}`);
    },
    deleteDoc: (id) => {
      dispatch({ type: 'doc/delete', id });
      pushToast('Document supprimé');
    },
    setDocStatus: (id, status) => {
      dispatch({ type: 'doc/status', id, status });
      pushToast('Statut mis à jour');
    },
    addPayment: (id, payment) => {
      const doc = state.docs.find((d) => d.id === id);
      dispatch({ type: 'doc/payment', id, payment });
      if (doc && payment.accountId) {
        const contact = state.contacts.find((c) => c.id === doc.contactId);
        dispatch({
          type: 'tx/add',
          tx: {
            id: uid(),
            accountId: payment.accountId,
            date: payment.date,
            label: `Règlement ${doc.number}${contact ? ` — ${contact.company}` : ''}`,
            amount: payment.amount,
            category: 'Vente',
            invoiceId: doc.id,
            reconciled: true,
          },
        });
      }
      pushToast('Règlement enregistré');
    },
    convertQuote: (quoteId) => {
      const quote = state.docs.find((d) => d.id === quoteId);
      if (!quote || quote.kind !== 'devis') return null;
      if (state.docs.some((d) => d.quoteId === quoteId)) {
        pushToast('Ce devis a déjà été converti en facture', 'error');
        return null;
      }
      const invoice: Doc = {
        id: uid(),
        kind: 'facture',
        number: nextDocNumber('facture', state.counters),
        contactId: quote.contactId,
        issuedAt: todayISO(),
        dueAt: todayISO(),
        status: 'envoyee',
        lines: quote.lines.map((l) => ({ ...l, id: uid() })),
        payments: [],
        quoteId: quote.id,
        notes: quote.notes,
        createdAt: todayISO(),
      };
      invoice.dueAt = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
      dispatch({ type: 'doc/convert', quoteId, invoice });
      pushToast(`Facture ${invoice.number} créée à partir du devis`);
      return invoice.id;
    },
    duplicateDoc: (id) => {
      const src = state.docs.find((d) => d.id === id);
      if (!src) return id;
      const copy: Doc = {
        ...src,
        id: uid(),
        number: nextDocNumber(src.kind, state.counters),
        issuedAt: todayISO(),
        dueAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        status: 'brouillon',
        lines: src.lines.map((l) => ({ ...l, id: uid() })),
        payments: [],
        quoteId: undefined,
        createdAt: todayISO(),
      };
      dispatch({ type: 'doc/save', doc: copy });
      pushToast(`${src.kind === 'devis' ? 'Devis' : 'Facture'} dupliqué${src.kind === 'devis' ? '' : 'e'} → ${copy.number}`);
      return copy.id;
    },
    saveAccount: (a) => {
      dispatch({ type: 'account/save', account: a });
      pushToast(`Compte « ${a.name} » enregistré`);
    },
    deleteAccount: (id) => {
      dispatch({ type: 'account/delete', id });
      pushToast('Compte supprimé');
    },
    addTransaction: (t) => {
      dispatch({ type: 'tx/add', tx: t });
      pushToast('Écriture ajoutée');
    },
    deleteTransaction: (id) => {
      dispatch({ type: 'tx/delete', id });
      pushToast('Écriture supprimée');
    },
    toggleTransaction: (id) => dispatch({ type: 'tx/toggle', id }),
    resetData: () => {
      dispatch({ type: 'reset' });
      pushToast('Données de démonstration restaurées', 'info');
    },
  }), [state, pushToast]);

  return <DataContext.Provider value={api}>{children}</DataContext.Provider>;
}

export function useData(): DataApi {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData doit être utilisé dans un DataProvider');
  return ctx;
}

/* ------------------------------- Sélecteurs ------------------------------- */

export const accountBalance = (state: AppState, accountId: ID): number => {
  const acc = state.accounts.find((a) => a.id === accountId);
  if (!acc) return 0;
  return (
    acc.initialBalance +
    state.transactions.filter((t) => t.accountId === accountId).reduce((s, t) => s + t.amount, 0)
  );
};