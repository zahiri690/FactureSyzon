export type ID = string;

export type DocKind = 'devis' | 'facture';

export type QuoteStatus = 'brouillon' | 'envoye' | 'accepte' | 'refuse';
export type InvoiceStatus = 'brouillon' | 'envoyee' | 'partielle' | 'payee' | 'en_retard';

export interface Contact {
  id: ID;
  kind: 'client' | 'fournisseur';
  company: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  zip: string;
  city: string;
  siret?: string;
  notes?: string;
  createdAt: string;
}

export interface LibraryItem {
  id: ID;
  reference: string;
  name: string;
  description: string;
  kind: 'produit' | 'service';
  unit: string;
  price: number; // HT
  vatRate: number; // 20 | 10 | 5.5 | 2.1 | 0
  active: boolean;
}

export interface DocLine {
  id: ID;
  label: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number; // HT
  vatRate: number;
}

export type PaymentMethod = 'virement' | 'carte' | 'cheque' | 'especes' | 'prelevement';

export interface Payment {
  id: ID;
  date: string;
  amount: number;
  method: PaymentMethod;
  accountId?: ID;
}

export interface Doc {
  id: ID;
  kind: DocKind;
  number: string;
  contactId: ID;
  issuedAt: string; // ISO date
  dueAt: string; // date d'échéance (facture) ou de validité (devis)
  status: QuoteStatus | InvoiceStatus;
  lines: DocLine[];
  payments: Payment[];
  quoteId?: ID; // facture issue d'un devis
  notes?: string;
  createdAt: string;
}

export interface BankAccount {
  id: ID;
  name: string;
  bank: string;
  iban: string;
  type: 'professionnel' | 'courant' | 'epargne';
  initialBalance: number;
  color: string; // tailwind-ish hex
}

export interface BankTransaction {
  id: ID;
  accountId: ID;
  date: string;
  label: string;
  amount: number; // + crédit, - débit
  category: string;
  invoiceId?: ID;
  reconciled: boolean;
}

export type ResourceKind = 'guide' | 'modele' | 'fiche' | 'lien';

export interface Resource {
  id: ID;
  title: string;
  kind: ResourceKind;
  tag: string;
  description: string;
  content: string;
  updatedAt: string;
}

export interface CompanyInfo {
  name: string;
  legalForm: string;
  address: string;
  zip: string;
  city: string;
  ice: string;
  vatNumber: string;
  email: string;
  phone: string;
  iban: string;
}

export interface AppState {
  contacts: Contact[];
  items: LibraryItem[];
  docs: Doc[];
  accounts: BankAccount[];
  transactions: BankTransaction[];
  resources: Resource[];
  company: CompanyInfo;
  counters: { quote: number; invoice: number };
}
