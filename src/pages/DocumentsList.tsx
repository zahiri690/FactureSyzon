import { motion } from 'framer-motion';
import { FileText, Plus, Receipt, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EmptyState, StatusBadge } from '../components/ui';
import { useData } from '../lib/store';
import {
  computeTotals, docStatusMeta, effectiveInvoiceStatus, fmtDate, fmtMAD, remainingAmount,
} from '../lib/utils';

export default function DocumentsList({ kind }: { kind: 'devis' | 'facture' }) {
  const { state } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous');
  const isInvoice = kind === 'facture';

  const docs = useMemo(() => {
    return state.docs
      .filter((d) => d.kind === kind)
      .filter((d) => {
        if (statusFilter === 'tous') return true;
        const s = isInvoice ? effectiveInvoiceStatus(d) : d.status;
        return s === statusFilter;
      })
      .filter((d) => {
        if (!search.trim()) return true;
        const contact = state.contacts.find((c) => c.id === d.contactId);
        const q = search.toLowerCase();
        return (
          d.number.toLowerCase().includes(q) ||
          (contact?.company.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  }, [state.docs, state.contacts, kind, search, statusFilter, isInvoice]);

  const filters = isInvoice
    ? [
        { key: 'tous', label: 'Toutes' },
        { key: 'brouillon', label: 'Brouillons' },
        { key: 'envoyee', label: 'Envoyées' },
        { key: 'partielle', label: 'Partielles' },
        { key: 'payee', label: 'Payées' },
        { key: 'en_retard', label: 'En retard' },
      ]
    : [
        { key: 'tous', label: 'Tous' },
        { key: 'brouillon', label: 'Brouillons' },
        { key: 'envoye', label: 'Envoyés' },
        { key: 'accepte', label: 'Acceptés' },
        { key: 'refuse', label: 'Refusés' },
      ];

  const totalTTC = docs.reduce((s, d) => s + computeTotals(d.lines).ttc, 0);
  const totalReste = isInvoice ? docs.reduce((s, d) => s + remainingAmount(d), 0) : 0;

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
            {isInvoice ? 'Factures' : 'Devis'}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {docs.length} document{docs.length > 1 ? 's' : ''} · {fmtMAD(totalTTC)} TTC
            {isInvoice && totalReste > 0 && <> · <span className="font-semibold text-amber-600">{fmtMAD(totalReste)} restant à encaisser</span></>}
          </p>
        </div>
        <button
          onClick={() => navigate(isInvoice ? '/factures/nouvelle' : '/devis/nouveau')}
          className="inline-flex items-center gap-2 rounded-xl bg-ink-950 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-ink-950/20 transition hover:bg-ink-800"
        >
          <Plus size={16} />
          {isInvoice ? 'Nouvelle facture' : 'Nouveau devis'}
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isInvoice ? 'Rechercher un n°, un client…' : 'Rechercher un n°, un client…'}
            className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-ink-200 bg-white p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === f.key ? 'bg-ink-950 text-white shadow' : 'text-ink-500 hover:bg-ink-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {docs.length === 0 ? (
        <EmptyState
          icon={isInvoice ? <Receipt size={26} /> : <FileText size={26} />}
          title={isInvoice ? 'Aucune facture trouvée' : 'Aucun devis trouvé'}
          message="Modifiez vos filtres ou créez un nouveau document pour démarrer."
          action={
            <button
              onClick={() => navigate(isInvoice ? '/factures/nouvelle' : '/devis/nouveau')}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
            >
              <Plus size={15} /> Créer un document
            </button>
          }
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-[0_1px_3px_rgba(16,24,40,0.05)]"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/50 text-left">
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">Numéro</th>
                  <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">Client</th>
                  <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">Émission</th>
                  <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">
                    {isInvoice ? 'Échéance' : 'Validité'}
                  </th>
                  <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">Statut</th>
                  <th className="px-6 py-3.5 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">
                    {isInvoice ? 'Total TTC / Reste' : 'Total TTC'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {docs.map((d) => {
                  const contact = state.contacts.find((c) => c.id === d.contactId);
                  const ttc = computeTotals(d.lines).ttc;
                  const reste = remainingAmount(d);
                  const status = isInvoice ? effectiveInvoiceStatus(d) : d.status;
                  return (
                    <tr
                      key={d.id}
                      onClick={() => navigate(isInvoice ? `/factures/${d.id}` : `/devis/${d.id}`)}
                      className="cursor-pointer transition hover:bg-brand-50/40"
                    >
                      <td className="px-6 py-4 font-mono text-[13px] font-bold text-ink-800">{d.number}</td>
                      <td className="px-4 py-4 font-semibold text-ink-700">{contact?.company ?? '—'}</td>
                      <td className="px-4 py-4 text-ink-500">{fmtDate(d.issuedAt)}</td>
                      <td className="px-4 py-4 text-ink-500">{fmtDate(d.dueAt)}</td>
                      <td className="px-4 py-4"><StatusBadge meta={docStatusMeta(d)} /></td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-mono font-bold text-ink-900">{fmtMAD(ttc)}</div>
                        {isInvoice && status !== 'payee' && status !== 'brouillon' && reste > 0 && reste < ttc && (
                          <div className="text-[11px] font-semibold text-amber-600">reste {fmtMAD(reste)}</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
