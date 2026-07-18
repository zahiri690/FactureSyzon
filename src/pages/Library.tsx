import { motion } from 'framer-motion';
import { Package, Pencil, Plus, Search, Trash2, Wrench } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Card, ConfirmDialog, EmptyState, Field, Modal, inputCls, selectCls, selectStyle } from '../components/ui';
import { useData } from '../lib/store';
import type { LibraryItem } from '../types';
import { VAT_RATES, fmtMAD, fmtNum, uid } from '../lib/utils';

const UNITS = ['unité', 'heure', 'jour', 'mois', 'an', 'forfait', 'lot', 'kg', 'm²'];

const emptyItem = (): LibraryItem => ({
  id: uid(), reference: '', name: '', description: '', kind: 'service',
  unit: 'unité', price: 0, vatRate: 20, active: true,
});

export default function Library() {
  const { state, saveItem, deleteItem } = useData();
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<'tous' | 'produit' | 'service'>('tous');
  const [editModal, setEditModal] = useState<LibraryItem | null>(null);
  const [toDelete, setToDelete] = useState<LibraryItem | null>(null);
  const [formError, setFormError] = useState('');

  const items = useMemo(() => {
    return state.items
      .filter((i) => (kindFilter === 'tous' ? true : i.kind === kindFilter))
      .filter((i) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return i.name.toLowerCase().includes(q) || i.reference.toLowerCase().includes(q) || i.description.toLowerCase().includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [state.items, search, kindFilter]);

  const submit = () => {
    if (!editModal) return;
    if (!editModal.name.trim()) {
      setFormError("L'intitulé de l'article est obligatoire.");
      return;
    }
    const reference =
      editModal.reference.trim() ||
      `${editModal.kind === 'produit' ? 'PRD' : 'SRV'}-${String(state.items.length + 1).padStart(3, '0')}`;
    saveItem({ ...editModal, name: editModal.name.trim(), reference });
    setEditModal(null);
    setFormError('');
  };

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">Bibliothèque</h1>
          <p className="mt-1 text-sm text-ink-500">
            {state.items.length} article{state.items.length > 1 ? 's' : ''} · catalogue de produits et services réutilisables
          </p>
        </div>
        <button
          onClick={() => { setEditModal(emptyItem()); setFormError(''); }}
          className="inline-flex items-center gap-2 rounded-xl bg-ink-950 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-ink-950/20 transition hover:bg-ink-800"
        >
          <Plus size={16} /> Nouvel article
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un article, une référence…"
            className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="flex gap-1.5 rounded-xl border border-ink-200 bg-white p-1">
          {([
            { key: 'tous', label: 'Tous' },
            { key: 'service', label: 'Services' },
            { key: 'produit', label: 'Produits' },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setKindFilter(t.key)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                kindFilter === t.key ? 'bg-ink-950 text-white shadow' : 'text-ink-500 hover:bg-ink-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <EmptyState
          icon={<Package size={26} />}
          title="Aucun article trouvé"
          message="Créez vos produits et services types pour les insérer en un clic dans vos devis et factures."
          action={
            <button
              onClick={() => setEditModal(emptyItem())}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
            >
              <Plus size={15} /> Créer un article
            </button>
          }
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-ink-100 bg-ink-50/50 text-left">
                    <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">Réf.</th>
                    <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">Article</th>
                    <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">Type</th>
                    <th className="px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">Prix HT</th>
                    <th className="px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">TVA</th>
                    <th className="px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">Actif</th>
                    <th className="px-6 py-3.5 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-50">
                  {items.map((i) => (
                    <tr key={i.id} className={`group transition hover:bg-brand-50/30 ${!i.active ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-ink-500">{i.reference}</td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-ink-800">{i.name}</div>
                        {i.description && <div className="mt-0.5 max-w-[340px] truncate text-xs text-ink-400">{i.description}</div>}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          i.kind === 'service' ? 'bg-violet-50 text-violet-700' : 'bg-sky-50 text-sky-700'
                        }`}>
                          {i.kind === 'service' ? <Wrench size={11} /> : <Package size={11} />}
                          {i.kind === 'service' ? 'Service' : 'Produit'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-mono font-bold text-ink-900">{fmtMAD(i.price)}</span>
                        <span className="text-xs text-ink-400"> / {i.unit}</span>
                      </td>
                      <td className="px-4 py-4 text-center text-ink-500">{fmtNum(i.vatRate)} %</td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => saveItem({ ...i, active: !i.active })}
                          title={i.active ? 'Désactiver' : 'Activer'}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${i.active ? 'bg-brand-500' : 'bg-ink-200'}`}
                        >
                          <span className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition ${i.active ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} style={{ width: 18, height: 18 }} />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                          <button
                            onClick={() => { setEditModal({ ...i }); setFormError(''); }}
                            className="rounded-lg p-2 text-ink-400 hover:bg-ink-50 hover:text-ink-700"
                            aria-label="Modifier"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setToDelete(i)}
                            className="rounded-lg p-2 text-ink-400 hover:bg-rose-50 hover:text-rose-500"
                            aria-label="Supprimer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Modale édition */}
      <Modal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title={editModal && state.items.some((i) => i.id === editModal.id) ? "Modifier l'article" : 'Nouvel article'}
        wide
      >
        {editModal && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
              <Field label="Type">
                <select
                  className={selectCls} style={selectStyle}
                  value={editModal.kind}
                  onChange={(e) => setEditModal({ ...editModal, kind: e.target.value as LibraryItem['kind'] })}
                >
                  <option value="service">Service</option>
                  <option value="produit">Produit</option>
                </select>
              </Field>
              <Field label="Intitulé *">
                <input
                  className={inputCls}
                  placeholder="Ex. Prestation de conseil"
                  value={editModal.name}
                  onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Description">
              <textarea
                className={inputCls + ' min-h-[70px] resize-y'}
                placeholder="Détail visible sur les documents (optionnel)"
                value={editModal.description}
                onChange={(e) => setEditModal({ ...editModal, description: e.target.value })}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="Référence" hint="Auto si vide">
                <input
                  className={inputCls + ' font-mono'}
                  placeholder="SRV-001"
                  value={editModal.reference}
                  onChange={(e) => setEditModal({ ...editModal, reference: e.target.value })}
                />
              </Field>
              <Field label="Prix HT (DH)">
                <input
                  type="number" min={0} step="0.01"
                  className={inputCls + ' font-mono'}
                  value={editModal.price || ''}
                  placeholder="0,00"
                  onChange={(e) => setEditModal({ ...editModal, price: parseFloat(e.target.value) || 0 })}
                />
              </Field>
              <Field label="Unité">
                <select
                  className={selectCls} style={selectStyle}
                  value={editModal.unit}
                  onChange={(e) => setEditModal({ ...editModal, unit: e.target.value })}
                >
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </Field>
              <Field label="TVA">
                <select
                  className={selectCls} style={selectStyle}
                  value={editModal.vatRate}
                  onChange={(e) => setEditModal({ ...editModal, vatRate: parseFloat(e.target.value) })}
                >
                  {VAT_RATES.map((r) => <option key={r} value={r}>{fmtNum(r)} %</option>)}
                </select>
              </Field>
            </div>
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
        onConfirm={() => toDelete && deleteItem(toDelete.id)}
        title="Supprimer cet article ?"
        message={`« ${toDelete?.name} » sera retiré de la bibliothèque. Les documents existants ne seront pas modifiés.`}
      />
    </div>
  );
}
