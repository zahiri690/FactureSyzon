import {
  ArrowLeft, ArrowRightLeft, BadgeCheck, Ban, CheckCircle2, Copy, CreditCard,
  FileX2, HandCoins, Pencil, Percent, Printer, Send, Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DocumentPaper from '../components/DocumentPaper';
import { Card, ConfirmDialog, Field, Modal, StatusBadge, inputCls, selectCls, selectStyle } from '../components/ui';
import { useData } from '../lib/store';
import type { DepositMode } from '../types';
import {
  computeTotals, depositRequestTtc, docStatusMeta, effectiveInvoiceStatus, fmtDate, fmtMAD, fmtNum,
  isDepositInvoice, methodLabel, paidAmount, remainingAmount, todayISO, uid,
} from '../lib/utils';

export default function DocumentDetail({ kind }: { kind: 'devis' | 'facture' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    state, setDocStatus, deleteDoc, addPayment, convertQuote, createDepositInvoice, duplicateDoc,
  } = useData();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payDate, setPayDate] = useState(todayISO());
  const [payMethod, setPayMethod] = useState('virement');
  const [payAccount, setPayAccount] = useState(state.accounts[0]?.id ?? '');
  const [depModal, setDepModal] = useState(false);
  const [depMode, setDepMode] = useState<DepositMode>('percent');
  const [depValue, setDepValue] = useState(50);

  const doc = state.docs.find((d) => d.id === id && d.kind === kind);
  if (!doc) {
    return (
      <Card className="p-10 text-center">
        <FileX2 size={32} className="mx-auto text-ink-300" />
        <h1 className="mt-3 text-lg font-bold text-ink-800">Document introuvable</h1>
        <p className="mt-1 text-sm text-ink-500">Il a peut-être été supprimé.</p>
        <Link
          to={kind === 'facture' ? '/factures' : '/devis'}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-ink-950 px-4 py-2.5 text-sm font-bold text-white"
        >
          <ArrowLeft size={15} /> Retour à la liste
        </Link>
      </Card>
    );
  }

  const isInvoice = kind === 'facture';
  const contact = state.contacts.find((c) => c.id === doc.contactId);
  const totals = computeTotals(doc.lines);
  const paid = paidAmount(doc);
  const remaining = remainingAmount(doc);
  const status = isInvoice ? effectiveInvoiceStatus(doc) : doc.status;
  const linkedInvoices = state.docs.filter((d) => d.quoteId === doc.id);
  const depositInvoices = linkedInvoices.filter((d) => isDepositInvoice(d));
  const alreadyConverted = doc.quoteId
    ? true
    : linkedInvoices.some((d) => !isDepositInvoice(d));
  const sourceQuote = doc.quoteId ? state.docs.find((d) => d.id === doc.quoteId) : undefined;
  const paidPct = Math.min(100, totals.ttc > 0 ? (paid / totals.ttc) * 100 : 0);
  const depositTtc = isInvoice ? depositRequestTtc(doc) : 0;
  const depositRemaining = Math.max(0, depositTtc - paid);
  const depPreviewTtc =
    depMode === 'percent' ? (totals.ttc * depValue) / 100 : Math.min(depValue, totals.ttc);

  const openPayModal = () => {
    setPayAmount(Math.round((depositRemaining > 0 ? Math.min(depositRemaining, remaining) : remaining) * 100) / 100);
    setPayDate(todayISO());
    setPayMethod('virement');
    setPayAccount(state.accounts[0]?.id ?? '');
    setPayModal(true);
  };

  const submitPayment = () => {
    if (payAmount <= 0) return;
    addPayment(doc.id, {
      id: uid(),
      date: payDate,
      amount: Math.round(payAmount * 100) / 100,
      method: payMethod as never,
      accountId: payAccount || undefined,
    });
    setPayModal(false);
  };

  const btn =
    'flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-bold transition';
  const btnDark = btn + ' bg-ink-950 text-white hover:bg-ink-800 shadow-lg shadow-ink-950/15';
  const btnBrand = btn + ' bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-600/25';
  const btnGhost = btn + ' border border-ink-200 bg-white text-ink-700 hover:bg-ink-50';

  return (
    <div className="space-y-5">
      {/* Barre d'actions haute */}
      <div className="print-hidden flex flex-wrap items-center gap-3">
        <button
          onClick={() => navigate(isInvoice ? '/factures' : '/devis')}
          className="rounded-xl border border-ink-200 bg-white p-2.5 text-ink-500 transition hover:bg-ink-50 hover:text-ink-800"
          aria-label="Retour"
        >
          <ArrowLeft size={17} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">
            {isInvoice ? 'Facture' : 'Devis'} <span className="font-mono">{doc.number}</span>
          </h1>
          <p className="text-sm text-ink-400">{contact?.company} · émis le {fmtDate(doc.issuedAt)}</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <StatusBadge meta={docStatusMeta(doc)} />
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm font-bold text-ink-700 transition hover:bg-ink-50"
          >
            <Printer size={15} /> Imprimer / PDF
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_320px] print:block">
        {/* Aperçu papier */}
        <div>
          <DocumentPaper doc={doc} contact={contact} company={state.company} />
        </div>

        {/* Panneau d'actions */}
        <div className="print-hidden space-y-4">
          {/* Progression règlement */}
          {isInvoice && (
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-ink-900">Encaissement</h2>
                <span className="font-mono text-sm font-bold text-ink-900">
                  {fmtMAD(paid)} <span className="font-normal text-ink-400">/ {fmtMAD(totals.ttc)}</span>
                </span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-ink-100">
                <div
                  className={`h-full rounded-full transition-all ${status === 'payee' ? 'bg-brand-500' : 'bg-violet-500'}`}
                  style={{ width: `${paidPct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-ink-400">
                {status === 'payee'
                  ? 'Facture intégralement réglée.'
                  : `Reste à encaisser : ${fmtMAD(remaining)}`}
              </p>
              {depositTtc > 0 && (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 ring-1 ring-amber-200/60">
                  Acompte demandé : {fmtMAD(depositTtc)} TTC
                  {doc.depositRequest?.mode === 'percent' && ` (${fmtNum(doc.depositRequest.value)} %)`}
                  {depositRemaining > 0 ? ` — reste ${fmtMAD(depositRemaining)} à encaisser` : ' — encaissé'}
                </p>
              )}

              {doc.payments.length > 0 && (
                <ul className="mt-4 space-y-2 border-t border-ink-50 pt-4">
                  {doc.payments.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 size={15} className="shrink-0 text-brand-500" />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-ink-700">
                          {methodLabel(p.method)}
                          {p.label && <span className="font-normal text-ink-400"> · {p.label}</span>}
                        </div>
                        <div className="text-xs text-ink-400">{fmtDate(p.date)}</div>
                      </div>
                      <span className="font-mono font-bold text-brand-700">{fmtMAD(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {/* Lien devis ↔ facture */}
          {sourceQuote && (
            <Card className="p-5">
              <p className="text-xs text-ink-500">
                {isDepositInvoice(doc)
                  ? `Facture d'acompte de ${fmtNum(doc.depositPercent ?? 0)} % issue du devis`
                  : 'Issue du devis'}
              </p>
              <Link
                to={`/devis/${sourceQuote.id}`}
                className="mt-1 inline-flex items-center gap-1.5 font-mono text-sm font-bold text-brand-700 hover:underline"
              >
                <ArrowRightLeft size={13} /> {sourceQuote.number}
              </Link>
            </Card>
          )}
          {linkedInvoices.length > 0 && (
            <Card className="p-5">
              <p className="text-xs text-ink-500">Factures liées</p>
              <ul className="mt-1.5 space-y-1.5">
                {linkedInvoices.map((inv) => (
                  <li key={inv.id}>
                    <Link
                      to={`/factures/${inv.id}`}
                      className="inline-flex items-center gap-1.5 font-mono text-sm font-bold text-brand-700 hover:underline"
                    >
                      <ArrowRightLeft size={13} /> {inv.number}
                    </Link>
                    <span className="ml-1.5 text-xs text-ink-400">
                      {isDepositInvoice(inv)
                        ? `acompte ${fmtNum(inv.depositPercent ?? 0)} %`
                        : 'facture de solde'}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Actions */}
          <Card className="space-y-2 p-5">
            <h2 className="mb-3 text-sm font-bold text-ink-900">Actions</h2>

            {/* Devis */}
            {!isInvoice && doc.status === 'brouillon' && (
              <button className={btnDark} onClick={() => setDocStatus(doc.id, 'envoye')}>
                <Send size={15} /> Marquer comme envoyé
              </button>
            )}
            {!isInvoice && doc.status === 'envoye' && (
              <>
                <button className={btnBrand} onClick={() => setDocStatus(doc.id, 'accepte')}>
                  <BadgeCheck size={15} /> Marquer accepté
                </button>
                <button className={btnGhost} onClick={() => setDocStatus(doc.id, 'refuse')}>
                  <Ban size={15} /> Marquer refusé
                </button>
              </>
            )}
            {!isInvoice && doc.status === 'accepte' && !alreadyConverted && (
              <>
                <button
                  className={btnBrand}
                  onClick={() => {
                    setDepMode('percent');
                    setDepValue(50);
                    setDepModal(true);
                  }}
                >
                  <Percent size={15} /> Facture d'acompte
                </button>
                <button
                  className={btnGhost}
                  onClick={() => {
                    const invId = convertQuote(doc.id);
                    if (invId) navigate(`/factures/${invId}`);
                  }}
                >
                  <ArrowRightLeft size={15} />
                  {depositInvoices.length > 0 ? 'Facture de solde' : 'Convertir en facture'}
                </button>
              </>
            )}
            {!isInvoice && doc.status === 'refuse' && (
              <button className={btnGhost} onClick={() => setDocStatus(doc.id, 'envoye')}>
                <Send size={15} /> Renvoyer le devis
              </button>
            )}

            {/* Facture */}
            {isInvoice && doc.status === 'brouillon' && (
              <button className={btnDark} onClick={() => setDocStatus(doc.id, 'envoyee')}>
                <Send size={15} /> Émettre la facture
              </button>
            )}
            {isInvoice && status !== 'brouillon' && status !== 'payee' && (
              <>
                <button className={btnBrand} onClick={openPayModal}>
                  <CreditCard size={15} /> Enregistrer un règlement
                </button>
                {depositRemaining > 0 && (
                  <button
                    className={btnGhost}
                    onClick={() =>
                      addPayment(doc.id, {
                        id: uid(),
                        date: todayISO(),
                        amount: Math.round(Math.min(depositRemaining, remaining) * 100) / 100,
                        method: 'virement',
                        accountId: state.accounts[0]?.id,
                        label: 'Acompte',
                      })
                    }
                  >
                    <HandCoins size={15} /> Encaisser l'acompte ({fmtMAD(Math.min(depositRemaining, remaining))})
                  </button>
                )}
                <button
                  className={btnGhost}
                  onClick={() =>
                    addPayment(doc.id, {
                      id: uid(),
                      date: todayISO(),
                      amount: Math.round(remaining * 100) / 100,
                      method: 'virement',
                      accountId: state.accounts[0]?.id,
                    })
                  }
                >
                  <CheckCircle2 size={15} /> Marquer payée ({fmtMAD(remaining)})
                </button>
              </>
            )}

            <div className="border-t border-ink-50 pt-2">
              <button
                className={btnGhost}
                onClick={() =>
                  navigate(isInvoice ? `/factures/${doc.id}/modifier` : `/devis/${doc.id}/modifier`)
                }
              >
                <Pencil size={15} /> Modifier
              </button>
              <button
                className={btnGhost}
                onClick={() => {
                  const newId = duplicateDoc(doc.id);
                  navigate(isInvoice ? `/factures/${newId}` : `/devis/${newId}`);
                }}
              >
                <Copy size={15} /> Dupliquer
              </button>
              <button
                className={btn + ' text-rose-600 hover:bg-rose-50'}
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 size={15} /> Supprimer
              </button>
            </div>
          </Card>

          {/* Mémo */}
          <Card className="p-5 text-xs leading-relaxed text-ink-500">
            <h3 className="mb-1.5 font-bold text-ink-700">Bon à savoir</h3>
            {isInvoice
              ? "Chaque règlement enregistré crée automatiquement une écriture rapprochée sur le compte bancaire choisi."
              : "Un devis accepté peut être converti en facture en un clic : les lignes et le client sont repris automatiquement."}
          </Card>
        </div>
      </div>

      {/* Modale règlement */}
      <Modal open={payModal} onClose={() => setPayModal(false)} title="Enregistrer un règlement">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Montant (DH)" hint={`Reste dû : ${fmtMAD(remaining)}`}>
              <input
                type="number" min={0} step="0.01"
                className={inputCls + ' font-mono'}
                value={payAmount || ''}
                onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
              />
            </Field>
            <Field label="Date du règlement">
              <input type="date" className={inputCls} value={payDate} onChange={(e) => setPayDate(e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Moyen de paiement">
              <select className={selectCls} style={selectStyle} value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                <option value="virement">Virement bancaire</option>
                <option value="carte">Carte bancaire</option>
                <option value="cheque">Chèque</option>
                <option value="especes">Espèces</option>
                <option value="prelevement">Prélèvement</option>
              </select>
            </Field>
            <Field label="Compte crédité">
              <select className={selectCls} style={selectStyle} value={payAccount} onChange={(e) => setPayAccount(e.target.value)}>
                {state.accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} — {a.bank}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setPayModal(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-500 hover:bg-ink-50"
            >
              Annuler
            </button>
            <button
              onClick={submitPayment}
              disabled={payAmount <= 0}
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-40"
            >
              Enregistrer {payAmount > 0 ? fmtMAD(payAmount) : ''}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modale facture d'acompte */}
      <Modal open={depModal} onClose={() => setDepModal(false)} title="Facture d'acompte">
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-ink-500">
            Une facture d'acompte sera créée à partir du devis{' '}
            <span className="font-mono font-semibold text-ink-700">{doc.number}</span> (
            {fmtMAD(totals.ttc)} TTC). Elle ne facturera que le montant de l'acompte.
            {depositInvoices.length > 0 && (
              <>
                {' '}
                Acomptes déjà facturés :{' '}
                {depositInvoices.map((i) => fmtNum(i.depositPercent ?? 0)).join(' + ')} %.
              </>
            )}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mode de calcul">
              <select
                className={selectCls}
                style={selectStyle}
                value={depMode}
                onChange={(e) => {
                  const m = e.target.value as DepositMode;
                  setDepMode(m);
                  setDepValue(m === 'percent' ? 50 : Math.round(totals.ttc / 2));
                }}
              >
                <option value="percent">Pourcentage du TTC</option>
                <option value="amount">Montant fixe TTC</option>
              </select>
            </Field>
            <Field label={depMode === 'percent' ? 'Pourcentage' : 'Montant'}>
              <div className="relative">
                <input
                  type="number" min={0} step={depMode === 'percent' ? 5 : 100}
                  max={depMode === 'percent' ? 100 : undefined}
                  className={inputCls + ' pr-8 text-right font-mono'}
                  value={depValue || ''}
                  onChange={(e) => setDepValue(parseFloat(e.target.value) || 0)}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-400">
                  {depMode === 'percent' ? '%' : 'DH'}
                </span>
              </div>
            </Field>
          </div>
          {depValue > 0 && totals.ttc > 0 && depPreviewTtc > 0 && (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 ring-1 ring-amber-200/60">
              Acompte à facturer : {fmtMAD(depPreviewTtc)} TTC
              <span className="block text-xs font-normal text-amber-700/80">
                soit {fmtMAD(totals.ttc > 0 ? depPreviewTtc * (totals.ht / totals.ttc) : 0)} HT
                {' · '}solde restant : {fmtMAD(Math.max(0, totals.ttc - depPreviewTtc))}
              </span>
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setDepModal(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-500 hover:bg-ink-50"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                const invId = createDepositInvoice(doc.id, depMode, depValue);
                if (invId) {
                  setDepModal(false);
                  navigate(`/factures/${invId}`);
                }
              }}
              disabled={depValue <= 0 || depPreviewTtc <= 0}
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-40"
            >
              Créer la facture d'acompte
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteDoc(doc.id);
          navigate(isInvoice ? '/factures' : '/devis');
        }}
        title={`Supprimer ${isInvoice ? 'la facture' : 'le devis'} ?`}
        message={`Le document ${doc.number} sera définitivement supprimé. Les règlements déjà enregistrés en banque ne seront pas effacés.`}
      />
    </div>
  );
}
