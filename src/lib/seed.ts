import type { AppState } from '../types';

export const emptyState = (): AppState => ({
  contacts: [],
  items: [],
  docs: [],
  accounts: [],
  transactions: [],
  resources: [],
  company: {
    name: '',
    legalForm: '',
    address: '',
    zip: '',
    city: '',
    ice: '',
    vatNumber: '',
    email: '',
    phone: '',
    iban: '',
  },
  counters: { quote: 0, invoice: 0 },
  updatedAt: new Date().toISOString(),
});
