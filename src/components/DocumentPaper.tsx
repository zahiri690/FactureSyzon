import type { CompanyInfo, Contact, Doc } from '../types';
import logo from '../assets/logo.syzon.png';
import { computeTotals, docStatusMeta, fmtDate, fmtMAD, fmtNum, paidAmount } from '../lib/utils';

/** Aperçu « papier » d'un devis ou d'une facture (imprimable en PDF). */
export default function DocumentPaper({
  doc,
  contact,
  company,
}: {
  doc: Doc;
  contact?: Contact;
  company: CompanyInfo;
}) {
  const totals = computeTotals(doc.lines);
  const paid = paidAmount(doc);
  const meta = docStatusMeta(doc);
  const isInvoice = doc.kind === 'facture';

  return (
    <div className="print-area rounded-2xl border border-ink-100 bg-white p-7 shadow-[0_1px_3px_rgba(16,24,40,0.06)] sm:p-10">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Syzon Design Decor" className="h-16 w-auto shrink-0 object-contain" />
          <div>
            <div className="text-lg font-extrabold tracking-tight text-ink-900">{company.name}</div>
            <div className="text-xs text-ink-500">{company.legalForm}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-extrabold tracking-tight text-ink-900">
            {isInvoice ? 'FACTURE' : 'DEVIS'}
          </div>
          <div className="mt-0.5 font-mono text-sm font-semibold text-ink-500">{doc.number}</div>
          <div className="mt-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${meta.cls}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
          </div>
        </div>
      </div>

      {/* Émetteur / Client */}
      <div className="mt-9 grid gap-6 sm:grid-cols-2">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">Émetteur</div>
          <div className="mt-2 text-sm leading-relaxed text-ink-700">
            <div className="font-bold text-ink-900">{company.name}</div>
            <div>{company.address}</div>
            <div>{company.zip} {company.city}</div>
            <div className="mt-1 text-ink-500">{company.email}</div>
            <div className="text-ink-500">{company.phone}</div>
          </div>
        </div>
        <div className="sm:text-right">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
            {isInvoice ? 'Facturé à' : 'Adressé à'}
          </div>
          <div className="mt-2 text-sm leading-relaxed text-ink-700">
            <div className="font-bold text-ink-900">{contact?.company ?? '—'}</div>
            {contact && (contact.firstName || contact.lastName) && (
              <div>{contact.firstName} {contact.lastName}</div>
            )}
            {contact?.address && <div>{contact.address}</div>}
            {contact && (contact.zip || contact.city) && <div>{contact.zip} {contact.city}</div>}
            {contact?.email && <div className="mt-1 text-ink-500">{contact.email}</div>}
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="mt-8 flex flex-wrap gap-x-10 gap-y-3 rounded-xl bg-ink-50/70 px-5 py-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">Date d'émission</div>
          <div className="mt-0.5 text-sm font-semibold text-ink-800">{fmtDate(doc.issuedAt)}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
            {isInvoice ? "Date d'échéance" : 'Valable jusqu’au'}
          </div>
          <div className="mt-0.5 text-sm font-semibold text-ink-800">{fmtDate(doc.dueAt)}</div>
        </div>
        {doc.quoteId && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">Devis d'origine</div>
            <div className="mt-0.5 text-sm font-semibold text-ink-800">Lié au devis accepté</div>
          </div>
        )}
      </div>

      {/* Lignes */}
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b-2 border-ink-900 text-left">
              <th className="pb-3 pr-4 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-500">Description</th>
              <th className="pb-3 pr-4 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ink-500">Qté</th>
              <th className="pb-3 pr-4 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-500">Unité</th>
              <th className="pb-3 pr-4 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ink-500">PU HT</th>
              <th className="pb-3 pr-4 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ink-500">TVA</th>
              <th className="pb-3 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ink-500">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {doc.lines.map((l) => (
              <tr key={l.id} className="border-b border-ink-100 align-top">
                <td className="py-3.5 pr-4">
                  <div className="font-semibold text-ink-800">{l.label}</div>
                  {l.description && <div className="mt-0.5 text-xs text-ink-400">{l.description}</div>}
                </td>
                <td className="py-3.5 pr-4 text-right font-mono text-ink-700">{fmtNum(l.quantity)}</td>
                <td className="py-3.5 pr-4 text-ink-500">{l.unit}</td>
                <td className="py-3.5 pr-4 text-right font-mono text-ink-700">{fmtMAD(l.unitPrice)}</td>
                <td className="py-3.5 pr-4 text-right text-ink-500">{fmtNum(l.vatRate)} %</td>
                <td className="py-3.5 text-right font-mono font-semibold text-ink-800">
                  {fmtMAD(l.quantity * l.unitPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totaux */}
      <div className="mt-6 flex justify-end">
        <div className="w-full max-w-xs space-y-2 text-sm">
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
          <div className="flex items-center justify-between rounded-xl bg-ink-950 px-4 py-3 text-white">
            <span className="text-sm font-bold">Total TTC</span>
            <span className="font-mono text-lg font-bold">{fmtMAD(totals.ttc)}</span>
          </div>
          {isInvoice && paid > 0 && (
            <>
              <div className="flex justify-between pt-1 text-ink-500">
                <span>Déjà réglé</span>
                <span className="font-mono text-brand-600">− {fmtMAD(paid)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-ink-900">
                <span>Reste à payer</span>
                <span className="font-mono">{fmtMAD(Math.max(0, totals.ttc - paid))}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Notes */}
      {doc.notes && (
        <div className="mt-8 rounded-xl border border-amber-200/70 bg-amber-50/60 px-5 py-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-600">Notes</div>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink-700">{doc.notes}</p>
        </div>
      )}

      {/* Pied légal */}
      <div className="mt-10 border-t border-ink-100 pt-5 text-[11px] leading-relaxed text-ink-400">
        <p>
          {company.name} — {company.legalForm} — ICE {company.ice} — TVA intracommunautaire {company.vatNumber}
        </p>
        {isInvoice ? (
          <p className="mt-1">
            Pénalités de retard : 3 × taux d'intérêt légal, exigibles de plein droit dès le lendemain de l'échéance.
            Indemnité forfaitaire de recouvrement : 400 DH. Pas d'escompte pour paiement anticipé.
            Règlement par virement : {company.iban}
          </p>
        ) : (
          <p className="mt-1">
            Devis valable jusqu'au {fmtDate(doc.dueAt)}. Pour accepter ce devis, merci de le retourner signé
            avec la mention « Bon pour accord » à {company.email}.
          </p>
        )}
      </div>
    </div>
  );
}
