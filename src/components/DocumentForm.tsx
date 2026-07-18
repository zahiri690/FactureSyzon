import { ArrowLeft, Check, PackagePlus, Plus, Save, Send, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../lib/store';
import type { Doc, DocLine } from '../types';
import {
  VAT_RATES, addDays, computeTotals, fmtMAD, fmtNum, nextDocNumber, todayISO, uid,
} from '../lib/utils';
import { Card, Field, inputCls, selectCls, selectStyle } from './ui';

const emptyLine = (): DocLine => ({
  id: uid(), label: '', quantity: 1, unit: 'unité', unitPrice: 0, vatRate: 20, description: '',
});

export default function DocumentForm({ kind }: { kind: 'devis' | 'facture' }) {
  const { state, saveDoc, pushToast } = useData();
  const navigate = useNavigate();
  const { id } = useParams();
  const existing = id ? state.docs.find((d) => d.id === id) : undefined;
  const isInvoice = kind === 'facture';

  const clients = useMemo(
    () => state.contacts.filter((c) => c.kind === 'client').sort((a, b) => a.company.localeCompare(b.company)),
    [state.contacts],
  );
  const catalog = useMemo(
    () => state.items.filter((i) => i.active).sort((a, b) => a.name.localeCompare(b.name)),
    [state.items],
  );

  const [contactId, setContactId] = useState(existing?.contactId ?? '');
  const [issuedAt, setIssuedAt] = useState(existing?.issuedAt ?? todayISO());
  const [dueAt, setDueAt] = useState(existing?.dueAt ?? addDays(todayISO(), 30));
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [lines, setLines] = useState<DocLine[]>(existing ? existing.lines.map((l) => ({ ...l })) : [emptyLine()]);
  const [error, setError] = useState('');

  const number = existing?.number ?? nextDocNumber(kind, state.counters);
  const totals = computeTotals(lines);

  const updateLine = (lid: string, patch: Partial<DocLine>) =>
    setLines((ls) => ls.map((l) => (l.id === lid ? { ...l, ...patch } : l)));

  const applyCatalogItem = (lid: string, itemId: string) => {
    const item = catalog.find((i) => i.id === itemId);
    if (!item) return;
    updateLine(lid, {
      label: item.name,
      description: item.description,
      unit: item.unit,
      unitPrice: item.price,
      vatRate: item.vatRate,
    });
  };

  const validate = (): boolean => {
    if (!contactId) {
      setError('Sélectionnez un client pour ce document.');
      return false;
    }
    const valid = lines.filter((l) => l.label.trim() && l.quantity > 0);
    if (valid.length === 0) {
      setError('Ajoutez au moins une ligne avec un intitulé et une quantité.');
      return false;
    }
    setError('');
    return true;
  };

  const save = (send: boolean) => {
    if (!validate()) return;
    const doc: Doc = {
      id: existing?.id ?? uid(),
      kind,
      number,
      contactId,
      issuedAt,
      dueAt,
      status: send
        ? isInvoice ? 'envoyee' : 'envoye'
        : existing?.status ?? 'brouillon',
      lines: lines
        .filter((l) => l.label.trim() && l.quantity > 0)
        .map((l) => ({ ...l, label: l.label.trim() })),
      payments: existing?.payments ?? [],
      quoteId: existing?.quoteId,
      notes: notes.trim() || undefined,
      createdAt: existing?.createdAt ?? todayISO(),
    };
    saveDoc(doc);
    navigate(isInvoice ? `/factures/${doc.id}` : `/devis/${doc.id}`);
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* En-tête */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-xl border border-ink-200 bg-white p-2.5 text-ink-500 transition hover:bg-ink-50 hover:text-ink-800"
          aria-label="Retour"
        >
          <ArrowLeft size={17} />
        </button>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">
            {existing
              ? `Modifier ${isInvoice ? 'la facture' : 'le devis'}`
              : isInvoice ? 'Nouvelle facture' : 'Nouveau devis'}
          </h1>
          <p className="text-sm text-ink-400">
            N° <span className="font-mono font-semibold text-ink-600">{number}</span>
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_330px]">
        {/* Colonne principale */}
        <div className="space-y-6">
          {/* Informations */}
          <Card className="p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink-500">Informations générales</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Client">
                <select
                  className={selectCls}
                  style={selectStyle}
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                >
                  <option value="">— Sélectionner —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.company}</option>
                  ))}
                </select>
              </Field>
              <Field label="Date d'émission">
                <input type="date" className={inputCls} value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} />
              </Field>
              <Field label={isInvoice ? "Date d'échéance" : 'Valable jusqu’au'}>
                <input type="date" className={inputCls} value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
              </Field>
            </div>
          </Card>

          {/* Lignes */}
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-ink-500">Prestations & produits</h2>
              <button
                onClick={() => setLines((ls) => [...ls, emptyLine()])}
                className="inline-flex items-center gap-1.5 rounded-xl bg-ink-950 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-ink-800"
              >
                <Plus size={14} /> Ajouter une ligne
              </button>
            </div>

            <div className="space-y-3">
              {lines.map((l, idx) => (
                <div key={l.id} className="rounded-xl border border-ink-100 bg-ink-50/40 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-ink-950 text-[11px] font-bold text-white">
                      {idx + 1}
                    </span>
                    <select
                      className="min-w-0 flex-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-600 outline-none focus:border-brand-500"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) applyCatalogItem(l.id, e.target.value);
                      }}
                    >
                      <option value="">Insérer depuis la bibliothèque…</option>
                      {catalog.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name} — {fmtMAD(i.price)} / {i.unit}
                        </option>
                      ))}
                    </select>
                    <span className="ml-auto font-mono text-sm font-bold text-ink-800">
                      {fmtMAD(l.quantity * l.unitPrice)}
                    </span>
                    <button
                      onClick={() => setLines((ls) => ls.filter((x) => x.id !== l.id))}
                      disabled={lines.length === 1}
                      className="rounded-lg p-1.5 text-ink-300 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-30"
                      aria-label="Supprimer la ligne"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-[1fr_84px_96px_110px_90px]">
                    <input
                      className={inputCls + ' !py-2'}
                      placeholder="Intitulé de la prestation ou du produit"
                      value={l.label}
                      onChange={(e) => updateLine(l.id, { label: e.target.value })}
                    />
                    <div className="relative">
                      <input
                        type="number" min={0} step="0.5"
                        className={inputCls + ' !py-2 text-center font-mono'}
                        value={l.quantity}
                        onChange={(e) => updateLine(l.id, { quantity: parseFloat(e.target.value) || 0 })}
                        title="Quantité"
                      />
                    </div>
                    <input
                      className={inputCls + ' !py-2 text-center'}
                      value={l.unit}
                      onChange={(e) => updateLine(l.id, { unit: e.target.value })}
                      title="Unité"
                      placeholder="unité"
                    />
                    <div className="relative">
                      <input
                        type="number" min={0} step="0.01"
                        className={inputCls + ' !py-2 pr-7 text-right font-mono'}
                        value={l.unitPrice || ''}
                        placeholder="0,00"
                        onChange={(e) => updateLine(l.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                        title="Prix unitaire HT"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-400">DH</span>
                    </div>
                    <select
                      className={selectCls + ' !py-2 text-center'}
                      style={selectStyle}
                      value={l.vatRate}
                      onChange={(e) => updateLine(l.id, { vatRate: parseFloat(e.target.value) })}
                      title="Taux de TVA"
                    >
                      {VAT_RATES.map((r) => (
                        <option key={r} value={r}>TVA {fmtNum(r)} %</option>
                      ))}
                    </select>
                  </div>
                  <input
                    className={inputCls + ' mt-2.5 !py-2 text-xs text-ink-500'}
                    placeholder="Description complémentaire (optionnel)"
                    value={l.description ?? ''}
                    onChange={(e) => updateLine(l.id, { description: e.target.value })}
                  />
                </div>
              ))}
            </div>

            {catalog.length === 0 && (
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-ink-50 px-4 py-3 text-xs text-ink-500">
                <PackagePlus size={14} />
                Astuce : créez des articles dans la Bibliothèque pour les insérer en un clic dans vos documents.
              </p>
            )}
          </Card>

          {/* Notes */}
          <Card className="p-6">
            <Field label="Notes visibles sur le document (optionnel)">
              <textarea
                className={inputCls + ' min-h-[90px] resize-y'}
                placeholder="Conditions de règlement, références de commande, remerciements…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
          </Card>
        </div>

        {/* Colonne totaux / actions */}
        <div className="space-y-4">
          <Card className="sticky top-6 p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink-500">Récapitulatif</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-ink-600">
                <span>Total HT</span>
                <span className="font-mono font-semibold">{fmtMAD(totals.ht)}</span>
              </div>
              {totals.byRate.map((r) => (
                <div key={r.rate} className="flex justify-between text-ink-500">
                  <span>TVA {fmtNum(r.rate)} %</span>
                  <span className="font-mono">{fmtMAD(r.tax)}</span>
                </div>
              ))}
              <div className="mt-3 flex items-center justify-between rounded-xl bg-ink-950 px-4 py-3.5 text-white">
                <span className="text-sm font-bold">Total TTC</span>
                <span className="font-mono text-lg font-bold">{fmtMAD(totals.ttc)}</span>
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-200">
                {error}
              </p>
            )}

            <div className="mt-6 space-y-2.5">
              <button
                onClick={() => save(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"
              >
                <Send size={15} />
                {isInvoice ? 'Enregistrer et émettre' : 'Enregistrer et envoyer'}
              </button>
              <button
                onClick={() => save(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm font-bold text-ink-700 transition hover:bg-ink-50"
              >
                {existing ? <Check size={15} /> : <Save size={15} />}
                {existing ? 'Enregistrer les modifications' : 'Enregistrer en brouillon'}
              </button>
              <button
                onClick={() => navigate(-1)}
                className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-400 transition hover:text-ink-700"
              >
                Annuler
              </button>
            </div>

            {!contactId && (
              <p className="mt-4 text-center text-xs text-ink-400">
                {clients.length === 0 ? (
                  <>Aucun client : créez-en un dans l'onglet Contacts.</>
                ) : (
                  <>Sélectionnez un client pour activer l'enregistrement.</>
                )}
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
