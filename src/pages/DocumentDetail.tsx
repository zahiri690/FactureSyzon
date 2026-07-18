import {
  ArrowLeft, ArrowRightLeft, BadgeCheck, Ban, CheckCircle2, Copy, CreditCard,
  FileX2, Pencil, Printer, Send, Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DocumentPaper from '../components/DocumentPaper';
import { Card, ConfirmDialog, Field, Modal, StatusBadge, inputCls, selectCls, selectStyle } from '../components/ui';
import { useData } from '../lib/store';
import {
  computeTotals, docStatusMeta, effectiveInvoiceStatus, fmtDate, fmtMAD,
  methodLabel, paidAmount, remainingAmount, todayISO, uid,
} from '../lib/utils';

export default function DocumentDetail({ kind }: { kind: 'devis' | 'facture' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    state, setDocStatus, deleteDoc, addPayment, convertQuote, duplicateDoc,
  } = useData();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payDate, setPayDate] = useState(todayISO());
  const [payMethod, setPayMethod] = useState('virement');
  const [payAccount, setPayAccount] = useState(state.accounts[0]?.id ?? '');

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
  const alreadyConverted = doc.quoteId
    ? true
    : state.docs.some((d) => d.quoteId === doc.id);
  const linkedInvoice = state.docs.find((d) => d.quoteId === doc.id);
  const sourceQuote = doc.quoteId ? state.docs.find((d) => d.id === doc.quoteId) : undefined;
  const paidPct = Math.min(100, totals.ttc > 0 ? (paid / totals.ttc) * 100 : 0);

  const openPayModal = () => {
    setPayAmount(Math.round(remaining * 100) / 100);
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

              {doc.payments.length > 0 && (
                <ul className="mt-4 space-y-2 border-t border-ink-50 pt-4">
                  {doc.payments.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 size={15} className="shrink-0 text-brand-500" />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-ink-700">{methodLabel(p.method)}</div>
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
              <p className="text-xs text-ink-500">Issue du devis</p>
              <Link
                to={`/devis/${sourceQuote.id}`}
                className="mt-1 inline-flex items-center gap-1.5 font-mono text-sm font-bold text-brand-700 hover:underline"
              >
                <ArrowRightLeft size={13} /> {sourceQuote.number}
              </Link>
            </Card>
          )}
          {linkedInvoice && (
            <Card className="p-5">
              <p className="text-xs text-ink-500">Converti en facture</p>
              <Link
                to={`/factures/${linkedInvoice.id}`}
                className="mt-1 inline-flex items-center gap-1.5 font-mono text-sm font-bold text-brand-700 hover:underline"
              >
                <ArrowRightLeft size={13} /> {linkedInvoice.number}
              </Link>
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
              <button
                className={btnBrand}
                onClick={() => {
                  const invId = convertQuote(doc.id);
                  if (invId) navigate(`/factures/${invId}`);
                }}
              >
                <ArrowRightLeft size={15} /> Convertir en facture
              </button>
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
