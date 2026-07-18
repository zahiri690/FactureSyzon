import { motion } from 'framer-motion';
import {
  Building2, FileText, Mail, MapPin, Pencil, Phone, Plus, Receipt, Search, Trash2, UserRound, Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, ConfirmDialog, EmptyState, Field, Modal, inputCls, selectCls, selectStyle } from '../components/ui';
import { useData } from '../lib/store';
import type { Contact } from '../types';
import { avatarColor, computeTotals, fmtDate, fmtMAD, initials, todayISO, uid } from '../lib/utils';

const emptyContact = (): Contact => ({
  id: uid(), kind: 'client', company: '', firstName: '', lastName: '',
  email: '', phone: '', address: '', zip: '', city: '', siret: '', notes: '',
  createdAt: todayISO(),
});

export default function Contacts() {
  const { state, saveContact, deleteContact } = useData();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'tous' | 'client' | 'fournisseur'>('tous');
  const [editModal, setEditModal] = useState<Contact | null>(null);
  const [detail, setDetail] = useState<Contact | null>(null);
  const [toDelete, setToDelete] = useState<Contact | null>(null);
  const [formError, setFormError] = useState('');

  const contacts = useMemo(() => {
    return state.contacts
      .filter((c) => (tab === 'tous' ? true : c.kind === tab))
      .filter((c) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          c.company.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.company.localeCompare(b.company));
  }, [state.contacts, search, tab]);

  const statsFor = (c: Contact) => {
    const docs = state.docs.filter((d) => d.contactId === c.id);
    const invoices = docs.filter((d) => d.kind === 'facture');
    const ca = invoices.reduce((s, d) => s + computeTotals(d.lines).ttc, 0);
    return { docs, invoices, ca };
  };

  const submit = () => {
    if (!editModal) return;
    if (!editModal.company.trim()) {
      setFormError('Le nom de la société est obligatoire.');
      return;
    }
    saveContact({ ...editModal, company: editModal.company.trim() });
    setEditModal(null);
    setFormError('');
    if (detail?.id === editModal.id) setDetail(editModal);
  };

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">Contacts</h1>
          <p className="mt-1 text-sm text-ink-500">
            {state.contacts.filter((c) => c.kind === 'client').length} clients ·{' '}
            {state.contacts.filter((c) => c.kind === 'fournisseur').length} fournisseurs
          </p>
        </div>
        <button
          onClick={() => { setEditModal(emptyContact()); setFormError(''); }}
          className="inline-flex items-center gap-2 rounded-xl bg-ink-950 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-ink-950/20 transition hover:bg-ink-800"
        >
          <Plus size={16} /> Nouveau contact
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une société, un nom, une ville…"
            className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="flex gap-1.5 rounded-xl border border-ink-200 bg-white p-1">
          {([
            { key: 'tous', label: 'Tous' },
            { key: 'client', label: 'Clients' },
            { key: 'fournisseur', label: 'Fournisseurs' },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                tab === t.key ? 'bg-ink-950 text-white shadow' : 'text-ink-500 hover:bg-ink-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grille */}
      {contacts.length === 0 ? (
        <EmptyState
          icon={<Users size={26} />}
          title="Aucun contact trouvé"
          message="Modifiez votre recherche ou ajoutez votre premier contact."
          action={
            <button
              onClick={() => setEditModal(emptyContact())}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
            >
              <Plus size={15} /> Ajouter un contact
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {contacts.map((c, i) => {
            const s = statsFor(c);
            return (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.35 }}
                onClick={() => setDetail(c)}
                className="group rounded-2xl border border-ink-100 bg-white p-5 text-left shadow-[0_1px_3px_rgba(16,24,40,0.05)] transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${avatarColor(c.company)}`}>
                    {initials(c.company)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold text-ink-900">{c.company}</div>
                    <div className="truncate text-xs text-ink-400">
                      {c.firstName} {c.lastName}
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    c.kind === 'client' ? 'bg-brand-50 text-brand-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {c.kind === 'client' ? 'Client' : 'Fourn.'}
                  </span>
                </div>
                <div className="mt-4 space-y-1.5 text-xs text-ink-500">
                  {c.email && (
                    <div className="flex items-center gap-2 truncate"><Mail size={12} className="shrink-0 text-ink-300" />{c.email}</div>
                  )}
                  {(c.city || c.zip) && (
                    <div className="flex items-center gap-2"><MapPin size={12} className="shrink-0 text-ink-300" />{c.zip} {c.city}</div>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-ink-50 pt-3.5 text-xs">
                  <span className="text-ink-400">
                    {s.invoices.length} facture{s.invoices.length > 1 ? 's' : ''} · {s.docs.filter((d) => d.kind === 'devis').length} devis
                  </span>
                  <span className="font-mono font-bold text-ink-800">{fmtMAD(s.ca)}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Modale détail */}
      <Modal open={!!detail && !editModal} onClose={() => setDetail(null)} title={detail?.company ?? ''} wide>
        {detail && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-extrabold ${avatarColor(detail.company)}`}>
                {initials(detail.company)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    detail.kind === 'client' ? 'bg-brand-50 text-brand-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {detail.kind === 'client' ? 'Client' : 'Fournisseur'}
                  </span>
                  <span className="text-xs text-ink-400">depuis le {fmtDate(detail.createdAt)}</span>
                </div>
                <div className="mt-2 grid gap-x-8 gap-y-1.5 text-sm text-ink-600 sm:grid-cols-2">
                  <span className="flex items-center gap-2"><UserRound size={14} className="text-ink-300" />{detail.firstName} {detail.lastName}</span>
                  <span className="flex items-center gap-2"><Mail size={14} className="text-ink-300" />{detail.email || '—'}</span>
                  <span className="flex items-center gap-2"><Phone size={14} className="text-ink-300" />{detail.phone || '—'}</span>
                  <span className="flex items-center gap-2"><MapPin size={14} className="text-ink-300" />{detail.address ? `${detail.address}, ${detail.zip} ${detail.city}` : '—'}</span>
                  {detail.siret && (
                    <span className="flex items-center gap-2"><Building2 size={14} className="text-ink-300" />SIRET {detail.siret}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditModal({ ...detail }); setFormError(''); }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 px-3.5 py-2 text-xs font-bold text-ink-700 hover:bg-ink-50"
                >
                  <Pencil size={13} /> Modifier
                </button>
                <button
                  onClick={() => setToDelete(detail)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 size={13} /> Supprimer
                </button>
              </div>
            </div>

            {detail.notes && (
              <p className="rounded-xl bg-ink-50 px-4 py-3 text-sm italic text-ink-500">« {detail.notes} »</p>
            )}

            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-400">
                Documents ({statsFor(detail).docs.length})
              </h3>
              {statsFor(detail).docs.length === 0 ? (
                <p className="text-sm text-ink-400">Aucun document pour ce contact.</p>
              ) : (
                <ul className="divide-y divide-ink-50 rounded-xl border border-ink-100">
                  {statsFor(detail).docs
                    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
                    .map((d) => (
                      <li key={d.id}>
                        <Link
                          to={d.kind === 'facture' ? `/factures/${d.id}` : `/devis/${d.id}`}
                          className="flex items-center gap-3 px-4 py-3 transition hover:bg-brand-50/40"
                        >
                          {d.kind === 'facture'
                            ? <Receipt size={15} className="shrink-0 text-brand-600" />
                            : <FileText size={15} className="shrink-0 text-violet-500" />}
                          <span className="font-mono text-xs font-bold text-ink-700">{d.number}</span>
                          <span className="text-xs text-ink-400">{fmtDate(d.issuedAt)}</span>
                          <span className="ml-auto font-mono text-sm font-bold text-ink-800">
                            {fmtMAD(computeTotals(d.lines).ttc)}
                          </span>
                        </Link>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modale édition */}
      <Modal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title={editModal && state.contacts.some((c) => c.id === editModal.id) ? 'Modifier le contact' : 'Nouveau contact'}
        wide
      >
        {editModal && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type de contact">
                <select
                  className={selectCls} style={selectStyle}
                  value={editModal.kind}
                  onChange={(e) => setEditModal({ ...editModal, kind: e.target.value as Contact['kind'] })}
                >
                  <option value="client">Client</option>
                  <option value="fournisseur">Fournisseur</option>
                </select>
              </Field>
              <Field label="Société *">
                <input
                  className={inputCls}
                  placeholder="Ex. Atelier Lumière"
                  value={editModal.company}
                  onChange={(e) => setEditModal({ ...editModal, company: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Prénom">
                <input className={inputCls} value={editModal.firstName} onChange={(e) => setEditModal({ ...editModal, firstName: e.target.value })} />
              </Field>
              <Field label="Nom">
                <input className={inputCls} value={editModal.lastName} onChange={(e) => setEditModal({ ...editModal, lastName: e.target.value })} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="E-mail">
                <input type="email" className={inputCls} placeholder="contact@societe.fr" value={editModal.email} onChange={(e) => setEditModal({ ...editModal, email: e.target.value })} />
              </Field>
              <Field label="Téléphone">
                <input className={inputCls} placeholder="06 00 00 00 00" value={editModal.phone} onChange={(e) => setEditModal({ ...editModal, phone: e.target.value })} />
              </Field>
            </div>
            <Field label="Adresse">
              <input className={inputCls} placeholder="N° et rue" value={editModal.address} onChange={(e) => setEditModal({ ...editModal, address: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Code postal">
                <input className={inputCls} value={editModal.zip} onChange={(e) => setEditModal({ ...editModal, zip: e.target.value })} />
              </Field>
              <Field label="Ville">
                <input className={inputCls} value={editModal.city} onChange={(e) => setEditModal({ ...editModal, city: e.target.value })} />
              </Field>
              <Field label="SIRET">
                <input className={inputCls + ' font-mono'} placeholder="000 000 000 00000" value={editModal.siret ?? ''} onChange={(e) => setEditModal({ ...editModal, siret: e.target.value })} />
              </Field>
            </div>
            <Field label="Notes internes">
              <textarea
                className={inputCls + ' min-h-[70px] resize-y'}
                value={editModal.notes ?? ''}
                onChange={(e) => setEditModal({ ...editModal, notes: e.target.value })}
              />
            </Field>
            {formError && (
              <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-200">{formError}</p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setEditModal(null)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-500 hover:bg-ink-50">
                Annuler
              </button>
              <button
                onClick={submit}
                className="rounded-xl bg-ink-950 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-ink-950/20 hover:bg-ink-800"
              >
                Enregistrer
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete && deleteContact(toDelete.id)) setDetail(null);
        }}
        title="Supprimer ce contact ?"
        message={`« ${toDelete?.company} » sera définitivement supprimé de votre carnet d'adresses.`}
      />
    </div>
  );
}
